
import { hand } from './hand.js';

const bucketSize = 0.05;

export function simulatedGame(totalStats, weights, deck) {

  const cards = deck.evenHands();

  // build two hand objects by splitting the deck in half
  const hands = [cards[0], cards[1]].map((cardSet, i) => {
    // calculate the score for the hand based on the weights
    // this is the key part of the prediction - how good do we think the hand actually is?
    const score = weights.scoreHand(cardSet);
    return hand(cardSet, i, score);
  });

  // we'll first determine what "strength" bucket this game falls into based on the lesser
  // hand, the worse this hand is, the lower the bucket and the stronger the difference
  // between the two hands
  const lowerHandScore = Math.min(hands[0].score, hands[1].score);

  // then assign it to a bucket of the given granularity
  const bucket = Math.floor((lowerHandScore) / bucketSize);

  // then we'll ensure the strength bucket for this game exists
  let bucketStats = totalStats.strengthHistogram[bucket];
  if (!bucketStats) {
    bucketStats = {
      count: 0,
      fights: 0,
      wars: 0,
      shuffles: 0,
      predictableWins: 0,
      bucketRange: [bucket * bucketSize, (bucket + 1) * bucketSize]
    }
    totalStats.strengthHistogram[bucket] = bucketStats;
  }

  // we'll use this function to determine if the game is over as well
  // as to put together the stats for the game if it is over
  const gameOver = ({ winner, loser, forceEnding = false}) => {
    if (loser.hasCardsLeft() && !forceEnding) {
      return false;
    }
    const shuffles = winner.getShuffles() + loser.getShuffles();
    totalStats.wins[winner.id]++;
    totalStats.shuffles += shuffles;
    if (winner.score > loser.score) {
      totalStats.predictableWins++;
      bucketStats.predictableWins++;
    }
    bucketStats.count++;
    bucketStats.shuffles += shuffles;

    // give feedback to the weight functions describing how well this game was predicted
    weights.result(winner.score - loser.score);
    return true;
  }

  // determines the winner based on the two hands current top card
  // returns a winner and a loser, unless there is a tie, and then
  // it returns no outcome in the form of null
  const match = () => {
    // the first player has won
    if (hands[0].topCardValue() > hands[1].topCardValue()) {
      return {
        winner: hands[0],
        loser: hands[1]
      }
    }
    // the second player has won
    if (hands[0].topCardValue() < hands[1].topCardValue()) {
      return {
        winner: hands[1],
        loser: hands[0]
      }
    }
    // its a tie
    return null;
  }

  // runs one "fight" between the two hands
  const fight = (stakes = []) => {
    bucketStats.fights++;
    totalStats.fights++;
    const outcome = match();

    // we have a winner and a loser, so the fight is over
    if (outcome) {
      const { winner, loser } = outcome
      // add the matched up cards to the stakes
      stakes.push(winner.loseCard(), loser.loseCard());
      // give the stakes to the winner
      winner.win(stakes);

      // if the loser is out of cards, the game is over, return the winner
      return { winner, gameOver: gameOver(outcome) };
    }
    totalStats.wars++;
    bucketStats.wars++;
    // there was no outcome and so there must be a war
    // note that we didn't actually "lose" a card, so we're going to put up to 4 cards on the line
    // including the card we've already played if we can
    const enteringStakes = stakes.length;
    for (let i = 0; i < 4; i++) {
      hands.forEach(hand => {
        if (hand.canOfferWarStakes()) {
          stakes.push(hand.loseCard());
        }
      });
    }

    // tie game, both players are out of cards... guess we'll just flip a coin?
    if(stakes.length === enteringStakes) {
      totalStats.coinFlips = totalStats.coinFlips ? totalStats.coinFlips + 1 : 1;
      const winner = Math.floor(Math.random() * 2)
      const outcome = {
        winner: hands[winner],
        loser: hands[(winner + 1) % 2],
        forceEnding: true
      }
      return { winner: outcome.winner, gameOver: gameOver(outcome) };
    }

    return fight(stakes);
  }

  // simulate a game by fighting until the game is over
  const simulate = () => {
    let playOn = true;
    totalStats.games++;
    while (playOn) {
      const { gameOver } = fight();
      playOn = !gameOver;
    }
  }

  return {
    simulate
  }
}


