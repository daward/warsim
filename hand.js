import _ from "lodash";


export function hand(startingCards, id, score) {
  // convert them all to their rank, we don't actually need anything else
  const cards = [...startingCards];
  const wonCards = [];
  let shuffles = 0;

  const topCardValue = () => {
    shuffleWonCards();
    return cards[cards.length - 1];
  }

  const win = (stakes) => {
    wonCards.push(...stakes);
  }

  const shuffleWonCards = () => {
    if (cards.length === 0) {
      shuffles++;
      cards.push(..._.shuffle(wonCards));
      wonCards.length = 0;
    }
  }

  const loseCard = () => {
    const retVal = cards.pop();
    // if we're out of cards, shuffle the won cards and add them to the deck
    shuffleWonCards();
    return retVal;
  }

  const hasCardsLeft = () => {
    return cards.length > 0 || wonCards.length > 0;
  }

  const canOfferWarStakes = () => {
    return cards.length + wonCards.length > 1;
  }

  return {
    topCardValue,
    win,
    loseCard,
    hasCardsLeft,
    canOfferWarStakes,
    id,
    score,
    getShuffles: () => shuffles
  };
}