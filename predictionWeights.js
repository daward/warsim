export function predictionWeights(initialWeights, deck) {

  const weights = [...initialWeights];

  let quality = 0;
  let runs = 0;
  let predictedWins = 0;

  const rankWeight = (rank) => {
    return weights[rank - 2];
  }

  const deckScores = deck.deckSource.flatMap(({ rank, count }) => {
    const retVal = [];
    for (let i = 0; i < count; i++) {
      retVal.push(rankWeight(rank));
    }
    return retVal;
  }).sort((a, b) => a - b)

  const middle = Math.floor(deckScores.length / 2);
  const worstHandScore= deckScores.slice(0, middle).reduce((acc, score) => acc + score, 0);
  const bestHandScore  = deckScores.slice(middle).reduce((acc, score) => acc + score, 0);

  return {
    scoreHand(startingRanks) {
      const absoluteScore = startingRanks.reduce((acc, rank) => acc + rankWeight(rank), 0);
      const retVal = (absoluteScore - worstHandScore) / (bestHandScore - worstHandScore);
      return retVal;
    },
    result(score) {
      runs++;
      if (score > 0) {
        predictedWins++
      }
      quality += score;
    },
    getQuality() {
      return (quality / runs) || 0;
    },
    mutate() {
      const newWeights = [...weights];
      for (let i = 0; i < newWeights.length; i++) {
        if (Math.random() > 0.5) {
          newWeights[i] += (Math.random() * 2) - 1;
        }
      }

      return predictionWeights(newWeights, deck);
    },
    weights,
    output: () => ({
      values: weights,
      score: quality / runs,
      accuracy: predictedWins / runs
    })
  }
}