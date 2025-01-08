import { predictionWeights } from './predictionWeights.js';
import { simulatedGame } from './simulatedGame.js';
import { deck } from './deck.js';
import fs from 'fs';
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers"
import path from "path";

const argv = yargs(hideBin(process.argv)).argv;

const sourceDeck = deck();

const readData = (filePath) => {
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  }
  const retVal = {
    values: []
  }

  for (let i = 0; i < 13; i++) {
    retVal.values.push(i);
  }
  return retVal;
}

const simulate = (stats, weights, simulations = 10000) => {
  // we need to simulate a number of games for each generation to account for randomness
  // too few and a "lucky" set of weights will look much better than it is
  for (let j = 0; j < simulations; j++) {
    const game = simulatedGame(stats, weights, sourceDeck);
    game.simulate();
  }
}

const initializeStats = () => {
  return {
    wars: 0,
    fights: 0,
    wins: [0, 0],
    predictableWins: 0,
    shuffles: 0,
    games: 0,
    strengthHistogram: []
  }
}

const buildOutput = (stats, weights) => {

  // calculate some averages, just because its nice to see
  stats.strengthHistogram.forEach(bucketStats => {
    bucketStats.averageFights = bucketStats.fights / bucketStats.count;
    bucketStats.averageWars = bucketStats.wars / bucketStats.count;
    bucketStats.averageShuffles = bucketStats.shuffles / bucketStats.count;
    bucketStats.accuracy = bucketStats.predictableWins / bucketStats.count;
  });

  stats.averageFights = stats.fights / stats.games;
  stats.averageWars = stats.wars / stats.games;
  stats.averageShuffles = stats.shuffles / stats.games;

  const output = weights.output();
  output.stats = stats;

  return output;
}

// through a number of generations, we will randomly mutate the weights
// but then select only the most successful mutations
const generate = (initialWeights, generations) => {

  // initialize a stats object to accumulate statistics throughout the simulation
  const stats = initializeStats();

  // assume the best weights are the ones we load from the file
  let bestWeights = predictionWeights(initialWeights, sourceDeck);
  // and start by using those best weights
  let weights = bestWeights;

  // run the simulation for the number of generations
  for (let i = 0; i < generations; i++) {

    // every 100 generations, log the progress
    if (i % 100 === 0) {
      console.log(`Generation ${i} of ${generations}`);
    }

    simulate(stats, weights);

    // having used our current weights for a number of simulated games,
    // we will have collected their quality, if it was better than the best weights
    // by a non-negative amount, we'll update the best weights
    if (weights.getQuality() > bestWeights.getQuality() + 0.0005) {
      bestWeights = weights;
      console.log(`Generation ${i} - ${bestWeights.output().score}`);
    }

    // now that we have our best weights, lets mutate them to try something new
    weights = bestWeights.mutate();
  }

  return buildOutput(stats, bestWeights);
}

// allows the caller to merge different generated lineages by averaging the weights
if (argv.breedFile) {
  const paths = [path.resolve(argv.breedFile[0]), path.resolve(argv.breedFile[1])];
  const data = paths.map(readData);
  const weights = data[0].values.map((weight, i) => (weight + data[1].values[i]) / 2);

  const output = generate(weights, 1);

  const outputPath = path.resolve(argv.output);
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 4), 'utf8');
}

// repeatedly simulates games and mutates the prediction-weights to try to
// find the most successful weights through a fitness function
// the fitness function is based on how successful the predictions are
if (argv.generate) {
  const fileName = argv.generate;
  const filePath = path.resolve(fileName);
  const jsonData = readData(filePath);

  const generations = argv.generations || 100;

  const output = generate(jsonData.values, generations);

  fs.writeFileSync(filePath, JSON.stringify(output, null, 4), 'utf8');
}

// this command will simulate any number of games, but it will not mutate
// and replace weights. It is really intended to see how successful a given
// set of weights can be
if(argv.simulate) {
  const fileName = argv.simulate;
  const filePath = path.resolve(fileName);
  const jsonData = readData(filePath);

  const simulations = argv.generations || 10000;
  const weights = predictionWeights(jsonData.values, sourceDeck);
  const stats = initializeStats();
  simulate(stats, weights, simulations);
  const output = buildOutput(stats, weights);

  fs.writeFileSync(filePath, JSON.stringify(output, null, 4), 'utf8');
}


