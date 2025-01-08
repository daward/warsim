# warsim
A tool to analyze the card game "war" using a genetic algorithm to make predictions

## Generation
```js
// Runs 250 generations of war, mutating the prediction weights
// each time, selecting the most successful one
node index.js --generate=file.json --generations=250
```

## Reproduction
```js
// "breeds" one generation with another by averaging their weights
node index.js --breedFile=father.json --breedFile=mother.json --output=child.json
```

## Simulation
```js
// if you now have a lineage you like, see how well it performs
node index.js --simulate=w22.json --simulations=10000
```