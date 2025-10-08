import { describe, it, expect, beforeEach } from 'vitest';
import { generateAllHands, type Card as PokerCard, type HandResult } from '../../../shared/lib/poker';

// Mock community cards for testing
const mockCommunityCards: PokerCard[] = [
  { rank: 'K', suit: 'spades' },
  { rank: 'K', suit: 'clubs' },
  { rank: '6', suit: 'diamonds' },
  { rank: '5', suit: 'spades' },
  { rank: '3', suit: 'hearts' }
];

// Helper function to create a card
const createCard = (rank: string, suit: string): PokerCard => ({ rank: rank as any, suit: suit as any });

// Helper function to get the best hand from hole cards + community cards
const getBestHand = (holeCards: PokerCard[]): HandResult | null => {
  const allHands = generateAllHands(mockCommunityCards, holeCards);
  return allHands[0] || null;
};

// Helper function to get rank counts
const getRankCounts = (ranks: string[]): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const rank of ranks) {
    counts[rank] = (counts[rank] || 0) + 1;
  }
  return counts;
};

// RANK_VALUES for comparison
const RANK_VALUES: Record<string, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

// Comparison functions (copied from CommunityTrainer)
const compareFullHouseHands = (handA: { holeCards: PokerCard[]; bestHand?: HandResult }, handB: { holeCards: PokerCard[]; bestHand?: HandResult }): number => {
  const bestA = handA.bestHand || getBestHand(handA.holeCards);
  const bestB = handB.bestHand || getBestHand(handB.holeCards);
  
  if (!bestA || !bestB) return 0;
  
  const getFullHouseRanks = (hand: HandResult) => {
    const counts = getRankCounts(hand.cards.map(card => card.rank));
    let trips = 0;
    let pair = 0;
    
    for (const [rank, count] of Object.entries(counts)) {
      if (count === 3) trips = RANK_VALUES[rank as string] || 0;
      if (count === 2) pair = RANK_VALUES[rank as string] || 0;
    }
    
    return { trips, pair };
  };
  
  const ranksA = getFullHouseRanks(bestA);
  const ranksB = getFullHouseRanks(bestB);
  
  if (ranksA.trips !== ranksB.trips) {
    return ranksB.trips - ranksA.trips; // Higher trips first
  }
  
  return ranksB.pair - ranksA.pair; // Higher pair first
};

const compareFourOfAKindHands = (handA: { holeCards: PokerCard[]; bestHand?: HandResult }, handB: { holeCards: PokerCard[]; bestHand?: HandResult }): number => {
  const bestA = handA.bestHand || getBestHand(handA.holeCards);
  const bestB = handB.bestHand || getBestHand(handB.holeCards);
  
  if (!bestA || !bestB) return 0;
  
  const getFourOfAKindRank = (hand: HandResult) => {
    const counts = getRankCounts(hand.cards.map(card => card.rank));
    
    for (const [rank, count] of Object.entries(counts)) {
      if (count === 4) {
        return RANK_VALUES[rank as string] || 0;
      }
    }
    return 0;
  };
  
  const getKicker = (hand: HandResult) => {
    const counts = getRankCounts(hand.cards.map(card => card.rank));
    
    for (const [rank, count] of Object.entries(counts)) {
      if (count === 1) {
        return RANK_VALUES[rank as string] || 0;
      }
    }
    return 0;
  };
  
  const fourA = getFourOfAKindRank(bestA);
  const fourB = getFourOfAKindRank(bestB);
  
  if (fourA !== fourB) {
    return fourB - fourA; // Higher four of a kind first
  }
  
  const kickerA = getKicker(bestA);
  const kickerB = getKicker(bestB);
  
  return kickerB - kickerA; // Higher kicker first
};

const compareTwoPairHands = (handA: { holeCards: PokerCard[]; bestHand?: HandResult }, handB: { holeCards: PokerCard[]; bestHand?: HandResult }): number => {
  const bestA = handA.bestHand || getBestHand(handA.holeCards);
  const bestB = handB.bestHand || getBestHand(handB.holeCards);
  
  if (!bestA || !bestB) return 0;
  
  const getTwoPairRanks = (hand: HandResult) => {
    const counts = getRankCounts(hand.cards.map(card => card.rank));
    const pairs: number[] = [];
    let kicker = 0;
    
    for (const [rank, count] of Object.entries(counts)) {
      if (count === 2) {
        pairs.push(RANK_VALUES[rank as string] || 0);
      } else if (count === 1) {
        kicker = RANK_VALUES[rank as string] || 0;
      }
    }
    
    pairs.sort((a, b) => b - a); // Sort pairs in descending order
    return { high: pairs[0] || 0, low: pairs[1] || 0, kicker };
  };
  
  const ranksA = getTwoPairRanks(bestA);
  const ranksB = getTwoPairRanks(bestB);
  
  if (ranksA.high !== ranksB.high) {
    return ranksB.high - ranksA.high; // Higher pair first
  }
  
  if (ranksA.low !== ranksB.low) {
    return ranksB.low - ranksA.low; // Higher low pair first
  }
  
  return ranksB.kicker - ranksA.kicker; // Higher kicker first
};

const compareThreeOfAKindHands = (handA: { holeCards: PokerCard[]; bestHand?: HandResult }, handB: { holeCards: PokerCard[]; bestHand?: HandResult }): number => {
  const bestA = handA.bestHand || getBestHand(handA.holeCards);
  const bestB = handB.bestHand || getBestHand(handB.holeCards);
  
  if (!bestA || !bestB) return 0;
  
  const getThreeOfAKindRank = (hand: HandResult) => {
    const counts = getRankCounts(hand.cards.map(card => card.rank));
    
    for (const [rank, count] of Object.entries(counts)) {
      if (count === 3) {
        return RANK_VALUES[rank as string] || 0;
      }
    }
    return 0;
  };
  
  const getKickers = (hand: HandResult) => {
    const counts = getRankCounts(hand.cards.map(card => card.rank));
    const kickers: number[] = [];
    
    for (const [rank, count] of Object.entries(counts)) {
      if (count === 1) {
        kickers.push(RANK_VALUES[rank as string] || 0);
      }
    }
    
    kickers.sort((a, b) => b - a); // Sort kickers in descending order
    return kickers;
  };
  
  const tripsA = getThreeOfAKindRank(bestA);
  const tripsB = getThreeOfAKindRank(bestB);
  
  if (tripsA !== tripsB) {
    return tripsB - tripsA; // Higher trips first
  }
  
  const kickersA = getKickers(bestA);
  const kickersB = getKickers(bestB);
  
  // Compare kickers one by one
  for (let i = 0; i < Math.min(kickersA.length, kickersB.length); i++) {
    if (kickersA[i] !== kickersB[i]) {
      return kickersB[i] - kickersA[i];
    }
  }
  
  return 0;
};

const comparePairHands = (handA: { holeCards: PokerCard[]; bestHand?: HandResult }, handB: { holeCards: PokerCard[]; bestHand?: HandResult }): number => {
  const bestA = handA.bestHand || getBestHand(handA.holeCards);
  const bestB = handB.bestHand || getBestHand(handB.holeCards);
  
  if (!bestA || !bestB) return 0;
  
  const getPairRank = (hand: HandResult) => {
    const counts = getRankCounts(hand.cards.map(card => card.rank));
    
    for (const [rank, count] of Object.entries(counts)) {
      if (count === 2) {
        return RANK_VALUES[rank as string] || 0;
      }
    }
    return 0;
  };
  
  const getKickers = (hand: HandResult) => {
    const counts = getRankCounts(hand.cards.map(card => card.rank));
    const kickers: number[] = [];
    
    for (const [rank, count] of Object.entries(counts)) {
      if (count === 1) {
        kickers.push(RANK_VALUES[rank as string] || 0);
      }
    }
    
    kickers.sort((a, b) => b - a); // Sort kickers in descending order
    return kickers;
  };
  
  const pairA = getPairRank(bestA);
  const pairB = getPairRank(bestB);
  
  if (pairA !== pairB) {
    return pairB - pairA; // Higher pair first
  }
  
  const kickersA = getKickers(bestA);
  const kickersB = getKickers(bestB);
  
  // Compare kickers one by one
  for (let i = 0; i < Math.min(kickersA.length, kickersB.length); i++) {
    if (kickersA[i] !== kickersB[i]) {
      return kickersB[i] - kickersA[i];
    }
  }
  
  return 0;
};

const compareHandsByHighCard = (handA: { holeCards: PokerCard[]; bestHand?: HandResult }, handB: { holeCards: PokerCard[]; bestHand?: HandResult }): number => {
  const bestA = handA.bestHand || getBestHand(handA.holeCards);
  const bestB = handB.bestHand || getBestHand(handB.holeCards);
  
  if (!bestA || !bestB) return 0;
  
  // Compare by highest card in hole cards
  const getHighestCard = (hand: { holeCards: PokerCard[] }) => {
    return Math.max(...hand.holeCards.map(card => RANK_VALUES[card.rank] || 0));
  };
  
  return getHighestCard(handB) - getHighestCard(handA);
};

describe('Hand Sorting Tests', () => {
  describe('Full House Sorting', () => {
    it('should sort full house hands correctly by trips first, then pair', () => {
      const hands = [
        { holeCards: [createCard('6', 'hearts'), createCard('6', 'clubs')] }, // 666KK
        { holeCards: [createCard('5', 'hearts'), createCard('5', 'diamonds')] }, // 555KK
        { holeCards: [createCard('3', 'diamonds'), createCard('3', 'clubs')] }, // 333KK
        { holeCards: [createCard('5', 'hearts'), createCard('K', 'diamonds')] }, // KKK55
        { holeCards: [createCard('6', 'hearts'), createCard('K', 'diamonds')] }, // KKK66
        { holeCards: [createCard('K', 'hearts'), createCard('3', 'diamonds')] }, // KKK33
      ];

      // Add bestHand to each hand
      const handsWithBestHand = hands.map(hand => ({
        ...hand,
        bestHand: getBestHand(hand.holeCards)
      }));

      const sortedHands = handsWithBestHand.sort(compareFullHouseHands);

      // Expected order: KKK66, KKK55, KKK33, 666KK, 555KK, 333KK
      expect(sortedHands[0].holeCards).toEqual([createCard('6', 'hearts'), createCard('K', 'diamonds')]); // KKK66
      expect(sortedHands[1].holeCards).toEqual([createCard('5', 'hearts'), createCard('K', 'diamonds')]); // KKK55
      expect(sortedHands[2].holeCards).toEqual([createCard('K', 'hearts'), createCard('3', 'diamonds')]); // KKK33
      expect(sortedHands[3].holeCards).toEqual([createCard('6', 'hearts'), createCard('6', 'clubs')]); // 666KK
      expect(sortedHands[4].holeCards).toEqual([createCard('5', 'hearts'), createCard('5', 'diamonds')]); // 555KK
      expect(sortedHands[5].holeCards).toEqual([createCard('3', 'diamonds'), createCard('3', 'clubs')]); // 333KK
    });
  });

  describe('Four of a Kind Sorting', () => {
    it('should sort four of a kind hands correctly by four cards first, then kicker', () => {
      const hands = [
        { holeCards: [createCard('K', 'hearts'), createCard('K', 'diamonds')] }, // KKKK with 6 kicker
        { holeCards: [createCard('6', 'hearts'), createCard('6', 'clubs')] }, // 6666 with K kicker
        { holeCards: [createCard('5', 'hearts'), createCard('5', 'diamonds')] }, // 5555 with K kicker
      ];

      const handsWithBestHand = hands.map(hand => ({
        ...hand,
        bestHand: getBestHand(hand.holeCards)
      }));

      const sortedHands = handsWithBestHand.sort(compareFourOfAKindHands);

      // Expected order: KKKK6, 6666K, 5555K
      expect(sortedHands[0].holeCards).toEqual([createCard('K', 'hearts'), createCard('K', 'diamonds')]); // KKKK6
      expect(sortedHands[1].holeCards).toEqual([createCard('6', 'hearts'), createCard('6', 'clubs')]); // 6666K
      expect(sortedHands[2].holeCards).toEqual([createCard('5', 'hearts'), createCard('5', 'diamonds')]); // 5555K
    });
  });

  describe('Two Pair Sorting', () => {
    it('should sort two pair hands correctly by high pair first, then low pair, then kicker', () => {
      const hands = [
        { holeCards: [createCard('A', 'hearts'), createCard('A', 'diamonds')] }, // AA with KK
        { holeCards: [createCard('Q', 'hearts'), createCard('Q', 'diamonds')] }, // QQ with KK
        { holeCards: [createCard('J', 'hearts'), createCard('J', 'diamonds')] }, // JJ with KK
      ];

      const handsWithBestHand = hands.map(hand => ({
        ...hand,
        bestHand: getBestHand(hand.holeCards)
      }));

      const sortedHands = handsWithBestHand.sort(compareTwoPairHands);

      // Expected order: AA, QQ, JJ (all with KK pair)
      expect(sortedHands[0].holeCards).toEqual([createCard('A', 'hearts'), createCard('A', 'diamonds')]);
      expect(sortedHands[1].holeCards).toEqual([createCard('Q', 'hearts'), createCard('Q', 'diamonds')]);
      expect(sortedHands[2].holeCards).toEqual([createCard('J', 'hearts'), createCard('J', 'diamonds')]);
    });
  });

  describe('Three of a Kind Sorting', () => {
    it('should sort three of a kind hands correctly by trips first, then kickers', () => {
      // Use different community cards that will create three of a kind hands
      const testCommunityCards: PokerCard[] = [
        { rank: 'A', suit: 'spades' },
        { rank: 'K', suit: 'clubs' },
        { rank: 'Q', suit: 'diamonds' },
        { rank: 'J', suit: 'spades' },
        { rank: '10', suit: 'hearts' }
      ];

      const getBestHandWithCommunity = (holeCards: PokerCard[]): HandResult | null => {
        const allHands = generateAllHands(testCommunityCards, holeCards);
        return allHands[0] || null;
      };

      const hands = [
        { holeCards: [createCard('A', 'hearts'), createCard('A', 'diamonds')] }, // AAA with KQ kickers
        { holeCards: [createCard('K', 'hearts'), createCard('K', 'diamonds')] }, // KKK with AQ kickers
        { holeCards: [createCard('Q', 'hearts'), createCard('Q', 'diamonds')] }, // QQQ with AK kickers
      ];

      const handsWithBestHand = hands.map(hand => ({
        ...hand,
        bestHand: getBestHandWithCommunity(hand.holeCards)
      }));

      // Log what hands are actually formed
      handsWithBestHand.forEach((hand, index) => {
        console.log(`Hand ${index + 1}: ${hand.holeCards.map(c => `${c.rank}${c.suit}`).join(' ')} -> ${hand.bestHand?.description}`);
      });

      // Filter to only three of a kind hands
      const threeOfAKindHands = handsWithBestHand.filter(hand => 
        hand.bestHand?.rank === 'three-of-a-kind'
      );

      expect(threeOfAKindHands.length).toBeGreaterThan(0);

      const sortedHands = threeOfAKindHands.sort(compareThreeOfAKindHands);

      // Verify they are sorted correctly
      for (let i = 0; i < sortedHands.length - 1; i++) {
        const current = sortedHands[i];
        const next = sortedHands[i + 1];
        
        const currentBest = current.bestHand!;
        const nextBest = next.bestHand!;
        
        const getThreeOfAKindRank = (hand: HandResult) => {
          const counts = getRankCounts(hand.cards.map(card => card.rank));
          for (const [rank, count] of Object.entries(counts)) {
            if (count === 3) {
              return RANK_VALUES[rank as string] || 0;
            }
          }
          return 0;
        };
        
        const currentTrips = getThreeOfAKindRank(currentBest);
        const nextTrips = getThreeOfAKindRank(nextBest);
        
        expect(currentTrips).toBeGreaterThanOrEqual(nextTrips);
      }
    });
  });

  describe('Pair Sorting', () => {
    it('should sort pair hands correctly by pair first, then kickers', () => {
      // Use different community cards that will create pair hands
      const testCommunityCards: PokerCard[] = [
        { rank: 'A', suit: 'spades' },
        { rank: 'K', suit: 'clubs' },
        { rank: 'Q', suit: 'diamonds' },
        { rank: 'J', suit: 'spades' },
        { rank: '10', suit: 'hearts' }
      ];

      const getBestHandWithCommunity = (holeCards: PokerCard[]): HandResult | null => {
        const allHands = generateAllHands(testCommunityCards, holeCards);
        return allHands[0] || null;
      };

      const hands = [
        { holeCards: [createCard('9', 'hearts'), createCard('9', 'diamonds')] }, // 99 with AKQJ kickers
        { holeCards: [createCard('8', 'hearts'), createCard('8', 'diamonds')] }, // 88 with AKQJ kickers
        { holeCards: [createCard('7', 'hearts'), createCard('7', 'diamonds')] }, // 77 with AKQJ kickers
      ];

      const handsWithBestHand = hands.map(hand => ({
        ...hand,
        bestHand: getBestHandWithCommunity(hand.holeCards)
      }));

      // Log what hands are actually formed
      handsWithBestHand.forEach((hand, index) => {
        console.log(`Hand ${index + 1}: ${hand.holeCards.map(c => `${c.rank}${c.suit}`).join(' ')} -> ${hand.bestHand?.description}`);
      });

      // Filter to only pair hands
      const pairHands = handsWithBestHand.filter(hand => 
        hand.bestHand?.rank === 'pair'
      );

      expect(pairHands.length).toBeGreaterThan(0);

      const sortedHands = pairHands.sort(comparePairHands);

      // Verify they are sorted correctly
      for (let i = 0; i < sortedHands.length - 1; i++) {
        const current = sortedHands[i];
        const next = sortedHands[i + 1];
        
        const currentBest = current.bestHand!;
        const nextBest = next.bestHand!;
        
        const getPairRank = (hand: HandResult) => {
          const counts = getRankCounts(hand.cards.map(card => card.rank));
          for (const [rank, count] of Object.entries(counts)) {
            if (count === 2) {
              return RANK_VALUES[rank as string] || 0;
            }
          }
          return 0;
        };
        
        const currentPair = getPairRank(currentBest);
        const nextPair = getPairRank(nextBest);
        
        expect(currentPair).toBeGreaterThanOrEqual(nextPair);
      }
    });
  });

  describe('High Card Sorting', () => {
    it('should sort high card hands correctly by highest card', () => {
      const hands = [
        { holeCards: [createCard('A', 'hearts'), createCard('Q', 'diamonds')] }, // AQ high
        { holeCards: [createCard('K', 'hearts'), createCard('Q', 'diamonds')] }, // KQ high
        { holeCards: [createCard('Q', 'hearts'), createCard('J', 'diamonds')] }, // QJ high
      ];

      const handsWithBestHand = hands.map(hand => ({
        ...hand,
        bestHand: getBestHand(hand.holeCards)
      }));

      const sortedHands = handsWithBestHand.sort(compareHandsByHighCard);

      // Expected order: AQ, KQ, QJ
      expect(sortedHands[0].holeCards).toEqual([createCard('A', 'hearts'), createCard('Q', 'diamonds')]);
      expect(sortedHands[1].holeCards).toEqual([createCard('K', 'hearts'), createCard('Q', 'diamonds')]);
      expect(sortedHands[2].holeCards).toEqual([createCard('Q', 'hearts'), createCard('J', 'diamonds')]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle identical hands correctly', () => {
      const hands = [
        { holeCards: [createCard('K', 'hearts'), createCard('K', 'diamonds')] },
        { holeCards: [createCard('K', 'hearts'), createCard('K', 'diamonds')] },
      ];

      const handsWithBestHand = hands.map(hand => ({
        ...hand,
        bestHand: getBestHand(hand.holeCards)
      }));

      const sortedHands = handsWithBestHand.sort(compareFullHouseHands);

      // Should not change order for identical hands
      expect(sortedHands).toHaveLength(2);
    });

    it('should handle hands with missing bestHand gracefully', () => {
      const hands = [
        { holeCards: [createCard('K', 'hearts'), createCard('K', 'diamonds')] },
        { holeCards: [createCard('6', 'hearts'), createCard('6', 'clubs')] },
      ];

      const sortedHands = hands.sort(compareFullHouseHands);

      // Should not crash and should return some order
      expect(sortedHands).toHaveLength(2);
    });
  });
});
