import _ from "lodash";

const defaultDeck = [
  { rank: 2, count: 4 },
  { rank: 3, count: 4 },
  { rank: 4, count: 4 },
  { rank: 5, count: 4 },
  { rank: 6, count: 4 },
  { rank: 7, count: 4 },
  { rank: 8, count: 4 },
  { rank: 9, count: 4 },
  { rank: 10, count: 4 },
  { rank: 11, count: 4 },
  { rank: 12, count: 4 },
  { rank: 13, count: 4 },
  { rank: 14, count: 4 }
];

export function deck() {

  let cards = [];

  defaultDeck.forEach(({count, rank}) => {
    for (let i = 0; i < count; i++) {
      cards.push(rank)
    }
  });

  return {
    evenHands: () => {
      // Calculate the midpoint
      const mid = Math.ceil(cards.length / 2);
      const shuffled = _.shuffle([...cards])

      return [shuffled.slice(0, mid), shuffled.slice(mid)];
    },
    deckSource: defaultDeck
  }
}