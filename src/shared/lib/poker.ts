import type { Rank, Suit } from '../ui/Card/Card';

export type HandRank = 
  | 'high-card'
  | 'pair'
  | 'two-pair'
  | 'three-of-a-kind'
  | 'straight'
  | 'flush'
  | 'full-house'
  | 'four-of-a-kind'
  | 'straight-flush'
  | 'royal-flush';

export interface Card {
  rank: Rank;
  suit: Suit;
}

export interface HandResult {
  rank: HandRank;
  cards: Card[];
  description: string;
}

const RANK_VALUES: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

const HAND_RANK_NAMES: Record<HandRank, string> = {
  'high-card': '하이카드',
  'pair': '원페어',
  'two-pair': '투페어',
  'three-of-a-kind': '트리플',
  'straight': '스트레이트',
  'flush': '플러시',
  'full-house': '풀하우스',
  'four-of-a-kind': '포카드',
  'straight-flush': '스트레이트 플러시',
  'royal-flush': '로얄 플러시'
};

// Generate all possible 7-card combinations from community cards + hole cards
export function generateAllHands(communityCards: Card[], holeCards: Card[]): HandResult[] {
  const allCards = [...communityCards, ...holeCards];
  const hands: HandResult[] = [];
  
  // Generate all possible 5-card combinations from 7 cards
  const combinations = getCombinations(allCards, 5);
  
  for (const combo of combinations) {
    const result = evaluateHand(combo);
    hands.push(result);
  }
  
  // Sort by hand strength (highest first)
  return hands.sort((a, b) => compareHands(a, b));
}

// Get all possible combinations of r elements from array
function getCombinations<T>(arr: T[], r: number): T[][] {
  if (r === 1) return arr.map(item => [item]);
  if (r === arr.length) return [arr];
  if (r > arr.length) return [];
  
  const combinations: T[][] = [];
  
  for (let i = 0; i <= arr.length - r; i++) {
    const head = arr[i];
    const tailCombinations = getCombinations(arr.slice(i + 1), r - 1);
    for (const tail of tailCombinations) {
      combinations.push([head, ...tail]);
    }
  }
  
  return combinations;
}

// Evaluate a 5-card hand
export function evaluateHand(cards: Card[]): HandResult {
  if (cards.length !== 5) {
    throw new Error('Hand must contain exactly 5 cards');
  }
  
  const sortedCards = [...cards].sort((a, b) => RANK_VALUES[b.rank] - RANK_VALUES[a.rank]);
  const ranks = sortedCards.map(card => card.rank);
  const suits = sortedCards.map(card => card.suit);
  
  // Check for flush
  const isFlush = suits.every(suit => suit === suits[0]);
  
  // Check for straight
  const isStraight = checkStraight(ranks);
  
  // Check for royal flush
  if (isFlush && isStraight && ranks[0] === 'A' && ranks[4] === 'T') {
    return {
      rank: 'royal-flush',
      cards: sortedCards,
      description: '로얄 플러시'
    };
  }
  
  // Check for straight flush
  if (isFlush && isStraight) {
    return {
      rank: 'straight-flush',
      cards: sortedCards,
      description: '스트레이트 플러시'
    };
  }
  
  // Check for four of a kind
  const fourOfAKind = getFourOfAKind(ranks);
  if (fourOfAKind) {
    return {
      rank: 'four-of-a-kind',
      cards: sortedCards,
      description: `포카드 (${fourOfAKind})`
    };
  }
  
  // Check for full house
  const fullHouse = getFullHouse(ranks);
  if (fullHouse) {
    return {
      rank: 'full-house',
      cards: sortedCards,
      description: `풀하우스 (${fullHouse.trips} over ${fullHouse.pair})`
    };
  }
  
  // Check for flush
  if (isFlush) {
    return {
      rank: 'flush',
      cards: sortedCards,
      description: '플러시'
    };
  }
  
  // Check for straight
  if (isStraight) {
    return {
      rank: 'straight',
      cards: sortedCards,
      description: '스트레이트'
    };
  }
  
  // Check for three of a kind
  const threeOfAKind = getThreeOfAKind(ranks);
  if (threeOfAKind) {
    return {
      rank: 'three-of-a-kind',
      cards: sortedCards,
      description: `트리플 (${threeOfAKind})`
    };
  }
  
  // Check for two pair
  const twoPair = getTwoPair(ranks);
  if (twoPair) {
    return {
      rank: 'two-pair',
      cards: sortedCards,
      description: `투페어 (${twoPair.high} and ${twoPair.low})`
    };
  }
  
  // Check for pair
  const pair = getPair(ranks);
  if (pair) {
    return {
      rank: 'pair',
      cards: sortedCards,
      description: `원페어 (${pair})`
    };
  }
  
  // High card
  return {
    rank: 'high-card',
    cards: sortedCards,
    description: `하이카드 (${ranks[0]})`
  };
}

function checkStraight(ranks: Rank[]): boolean {
  const values = ranks.map(rank => RANK_VALUES[rank]).sort((a, b) => a - b);
  
  // Check for regular straight
  for (let i = 1; i < values.length; i++) {
    if (values[i] !== values[i-1] + 1) {
      // Check for A-2-3-4-5 straight
      if (values[0] === 2 && values[1] === 3 && values[2] === 4 && values[3] === 5 && values[4] === 14) {
        return true;
      }
      return false;
    }
  }
  return true;
}

function getFourOfAKind(ranks: Rank[]): Rank | null {
  const counts = getRankCounts(ranks);
  for (const [rank, count] of Object.entries(counts)) {
    if (count === 4) return rank as Rank;
  }
  return null;
}

function getFullHouse(ranks: Rank[]): { trips: Rank; pair: Rank } | null {
  const counts = getRankCounts(ranks);
  let trips: Rank | null = null;
  let pair: Rank | null = null;
  
  for (const [rank, count] of Object.entries(counts)) {
    if (count === 3) trips = rank as Rank;
    if (count === 2) pair = rank as Rank;
  }
  
  return trips && pair ? { trips, pair } : null;
}

function getThreeOfAKind(ranks: Rank[]): Rank | null {
  const counts = getRankCounts(ranks);
  for (const [rank, count] of Object.entries(counts)) {
    if (count === 3) return rank as Rank;
  }
  return null;
}

function getTwoPair(ranks: Rank[]): { high: Rank; low: Rank } | null {
  const counts = getRankCounts(ranks);
  const pairs: Rank[] = [];
  
  for (const [rank, count] of Object.entries(counts)) {
    if (count === 2) pairs.push(rank as Rank);
  }
  
  if (pairs.length === 2) {
    pairs.sort((a, b) => RANK_VALUES[b] - RANK_VALUES[a]);
    return { high: pairs[0], low: pairs[1] };
  }
  
  return null;
}

function getPair(ranks: Rank[]): Rank | null {
  const counts = getRankCounts(ranks);
  for (const [rank, count] of Object.entries(counts)) {
    if (count === 2) return rank as Rank;
  }
  return null;
}

function getRankCounts(ranks: Rank[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const rank of ranks) {
    counts[rank] = (counts[rank] || 0) + 1;
  }
  return counts;
}

function compareHands(a: HandResult, b: HandResult): number {
  const handRankOrder: HandRank[] = [
    'high-card', 'pair', 'two-pair', 'three-of-a-kind', 'straight',
    'flush', 'full-house', 'four-of-a-kind', 'straight-flush', 'royal-flush'
  ];
  
  const aIndex = handRankOrder.indexOf(a.rank);
  const bIndex = handRankOrder.indexOf(b.rank);
  
  if (aIndex !== bIndex) {
    return bIndex - aIndex; // Higher rank first
  }
  
  // Same hand rank, compare by high cards
  for (let i = 0; i < Math.min(a.cards.length, b.cards.length); i++) {
    const aValue = RANK_VALUES[a.cards[i].rank];
    const bValue = RANK_VALUES[b.cards[i].rank];
    if (aValue !== bValue) {
      return bValue - aValue; // Higher card first
    }
  }
  
  return 0;
}

// Generate random community cards
export function generateRandomCommunityCards(): Card[] {
  const allCards: Card[] = [];
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'];
  
  for (const suit of suits) {
    for (const rank of ranks) {
      allCards.push({ rank, suit });
    }
  }
  
  // Shuffle and take 5 cards
  const shuffled = allCards.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 5);
}

// Generate random hole cards
export function generateRandomHoleCards(existingCards: Card[]): Card[] {
  const allCards: Card[] = [];
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'];
  
  for (const suit of suits) {
    for (const rank of ranks) {
      allCards.push({ rank, suit });
    }
  }
  
  // Remove existing cards
  const availableCards = allCards.filter(card => 
    !existingCards.some(existing => 
      existing.rank === card.rank && existing.suit === card.suit
    )
  );
  
  // Shuffle and take 2 cards
  const shuffled = availableCards.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 2);
}
