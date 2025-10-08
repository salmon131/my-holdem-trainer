import React, { useState, useEffect } from 'react';
import { Card, parseCard, createCardStr, type Suit } from '../../shared/ui/Card/Card';
import { 
  generateRandomCommunityCards, 
  generateRandomHoleCards, 
  generateAllHands, 
  evaluateHand,
  type Card as PokerCard,
  type HandResult 
} from '../../shared/lib/poker';
import { Button } from '../../shared/ui/Button/Button';

  interface HandByRank {
    rank: string;
    hands: { holeCards: PokerCard[]; description: string; isSeparator?: boolean; bestHand?: HandResult }[];
  }

export const CommunityTrainer: React.FC = () => {
  const [communityCards, setCommunityCards] = useState<PokerCard[]>([]);
  const [handsByRank, setHandsByRank] = useState<HandByRank[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState<string>('');

  const generateNewCards = () => {
    const newCommunity = generateRandomCommunityCards();
    setCommunityCards(newCommunity);
    setShowAnswer(false);
    setUserAnswer('');
    
    // Generate all possible hands by trying different hole cards
    const handsByRank = generateHandsByRank(newCommunity);
    setHandsByRank(handsByRank);
  };

  const generateHandsByRank = (community: PokerCard[]): HandByRank[] => {
    const allCards: PokerCard[] = [];
    const suits: ('hearts' | 'diamonds' | 'clubs' | 'spades')[] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks: ('A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K')[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'];
    
    // Generate all possible cards
    for (const suit of suits) {
      for (const rank of ranks) {
        allCards.push({ rank, suit });
      }
    }
    
    // Remove community cards
    const availableCards = allCards.filter(card => 
      !community.some(commCard => 
        commCard.rank === card.rank && commCard.suit === card.suit
      )
    );
    
    const handsByRankMap = new Map<string, { holeCards: PokerCard[]; description: string; subRank?: string; bestHand?: HandResult }[]>();
    
    // Try all possible 2-card combinations
    for (let i = 0; i < availableCards.length; i++) {
      for (let j = i + 1; j < availableCards.length; j++) {
        const holeCards = [availableCards[i], availableCards[j]];
        const allHands = generateAllHands(community, holeCards);
        const bestHand = allHands[0]; // Highest hand
        
        if (bestHand) {
          // Debug: Log the hand evaluation with 5-card hand
          
          const rankKey = bestHand.rank;
          if (!handsByRankMap.has(rankKey)) {
            handsByRankMap.set(rankKey, []);
          }
          
          
          // Create sub-rank for better grouping within same hand rank
          let subRank = '';
          if (bestHand.rank === 'full-house') {
            // Extract the specific full house type (e.g., "Aces full of Fives")
            subRank = bestHand.description;
          } else if (bestHand.rank === 'two-pair') {
            // Extract the specific two pair type
            subRank = bestHand.description;
          } else if (bestHand.rank === 'four-of-a-kind') {
            // Extract the specific four of a kind type
            subRank = bestHand.description;
          } else if (bestHand.rank === 'straight') {
            // For straight, use the top card as sub-rank
            const topCard = Math.max(...bestHand.cards.map(card => RANK_VALUES[card.rank] || 0));
            const topCardName = Object.keys(RANK_VALUES).find(key => RANK_VALUES[key] === topCard) || 'Unknown';
            subRank = `스트레이트 (탑카드 ${topCardName})`;
          }
          
          handsByRankMap.get(rankKey)!.push({
            holeCards,
            description: bestHand.description,
            subRank,
            bestHand: bestHand // Store the actual best hand for comparison
          });
        }
      }
    }
    
    // Convert to array and sort by hand strength
    const handRankOrder = [
      'royal-flush', 'straight-flush', 'four-of-a-kind', 'full-house',
      'flush', 'straight', 'three-of-a-kind', 'two-pair', 'pair', 'high-card'
    ];
    
    const result: HandByRank[] = [];
    for (const rank of handRankOrder) {
      if (handsByRankMap.has(rank)) {
        const hands = handsByRankMap.get(rank)!;
        
        // Group by sub-rank for better organization
        const groupedHands = new Map<string, { holeCards: PokerCard[]; description: string; bestHand?: HandResult }[]>();
        
        for (const hand of hands) {
          const groupKey = hand.subRank || hand.description;
          if (!groupedHands.has(groupKey)) {
            groupedHands.set(groupKey, []);
          }
          
          // For number-based hands (not flush-related), check for rank duplicates
          const isFlushRelated = hand.description.includes('플러시') || 
                                hand.description.includes('Flush') || 
                                hand.description.includes('로얄');
          
          if (!isFlushRelated) {
            // Check if we already have this rank combination
            const existingHands = groupedHands.get(groupKey)!;
            const handRanks = hand.holeCards.map(card => card.rank).sort().join('');
            const hasDuplicate = existingHands.some(existing => 
              existing.holeCards.map(card => card.rank).sort().join('') === handRanks
            );
            
            if (!hasDuplicate) {
              groupedHands.get(groupKey)!.push({
                holeCards: hand.holeCards,
                description: hand.description,
                bestHand: hand.bestHand
              });
            }
          } else {
            // For flush-related hands, show all suit combinations
            groupedHands.get(groupKey)!.push({
              holeCards: hand.holeCards,
              description: hand.description,
              bestHand: hand.bestHand
            });
          }
        }
        
        // Flatten all hands and sort them by strength
        const allHands: { holeCards: PokerCard[]; description: string; bestHand?: HandResult }[] = [];
        for (const groupHands of groupedHands.values()) {
          // Use the already stored bestHand information
          allHands.push(...groupHands);
        }
        
        
        // Sort all hands by strength within the same rank using a stable sort approach
        const sortedHands = [...allHands].sort((a, b) => {
          let comparison = 0;
          if (rank === 'full-house') {
            comparison = compareFullHouseHands(a, b);
          } else if (rank === 'two-pair') {
            comparison = compareTwoPairHands(a, b);
          } else if (rank === 'four-of-a-kind') {
            comparison = compareFourOfAKindHands(a, b);
          } else if (rank === 'three-of-a-kind') {
            comparison = compareThreeOfAKindHands(a, b);
          } else if (rank === 'pair') {
            comparison = comparePairHands(a, b);
          } else if (rank === 'straight') {
            // For straight, compare by top card only
            comparison = compareStraightHands(a, b);
          } else if (rank === 'flush' || rank === 'straight-flush' || rank === 'royal-flush') {
            // For flush hands, compare by highest card in the hand
            comparison = compareFlushHands(a, b);
          } else {
            // For high-card and other hands, compare by highest card
            comparison = compareHandsByHighCard(a, b);
          }
          
          
          return comparison;
        });
        
        
        // Convert to final array format
        const finalHands: { holeCards: PokerCard[]; description: string; isSeparator?: boolean; bestHand?: HandResult }[] = sortedHands;
        
        result.push({
          rank: getRankDisplayName(rank),
          hands: finalHands
        });
      }
    }
    
    return result;
  };

  const getRankDisplayName = (rank: string): string => {
    const names: Record<string, string> = {
      'royal-flush': '로얄 플러시',
      'straight-flush': '스트레이트 플러시',
      'four-of-a-kind': '포카드',
      'full-house': '풀하우스',
      'flush': '플러시',
      'straight': '스트레이트',
      'three-of-a-kind': '트리플',
      'two-pair': '투페어',
      'pair': '원페어',
      'high-card': '하이카드'
    };
    return names[rank] || rank;
  };

  // Helper functions for sorting hands within the same rank
  const RANK_VALUES: Record<string, number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
  };

  // Helper function to get the best 5-card hand from hole cards + community cards
  const getBestHand = (holeCards: PokerCard[]): HandResult | null => {
    const allHands = generateAllHands(communityCards, holeCards);
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

  const compareFullHouseHands = (handA: { holeCards: PokerCard[]; description: string; bestHand?: HandResult }, handB: { holeCards: PokerCard[]; description: string; bestHand?: HandResult }): number => {
    // Use stored bestHand if available, otherwise calculate it with community cards
    const bestA = handA.bestHand || getBestHand(handA.holeCards);
    const bestB = handB.bestHand || getBestHand(handB.holeCards);
    
    if (!bestA || !bestB) return 0;
    
    
    // For full house, compare trips first, then pair
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

  const compareTwoPairHands = (handA: { holeCards: PokerCard[]; description: string; bestHand?: HandResult }, handB: { holeCards: PokerCard[]; description: string; bestHand?: HandResult }): number => {
    const bestA = handA.bestHand || getBestHand(handA.holeCards);
    const bestB = handB.bestHand || getBestHand(handB.holeCards);
    
    if (!bestA || !bestB) return 0;
    
    // For two pair, compare high pair first, then low pair, then kicker
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

  const compareFourOfAKindHands = (handA: { holeCards: PokerCard[]; description: string; bestHand?: HandResult }, handB: { holeCards: PokerCard[]; description: string; bestHand?: HandResult }): number => {
    const bestA = handA.bestHand || getBestHand(handA.holeCards);
    const bestB = handB.bestHand || getBestHand(handB.holeCards);
    
    if (!bestA || !bestB) return 0;
    
    // For four of a kind, compare the four cards first, then the kicker
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

  const compareFlushHands = (handA: { holeCards: PokerCard[]; description: string; bestHand?: HandResult }, handB: { holeCards: PokerCard[]; description: string; bestHand?: HandResult }): number => {
    const bestA = handA.bestHand || getBestHand(handA.holeCards);
    const bestB = handB.bestHand || getBestHand(handB.holeCards);
    
    if (!bestA || !bestB) return 0;
    
    
    // For flush hands, compare cards from highest to lowest
    const getSortedCardValues = (hand: HandResult) => {
      return hand.cards
        .map(card => RANK_VALUES[card.rank] || 0)
        .sort((a, b) => b - a); // Sort in descending order
    };
    
    const cardsA = getSortedCardValues(bestA);
    const cardsB = getSortedCardValues(bestB);
    
    // Compare cards one by one from highest to lowest
    for (let i = 0; i < Math.min(cardsA.length, cardsB.length); i++) {
      if (cardsA[i] !== cardsB[i]) {
        return cardsB[i] - cardsA[i]; // Higher card wins
      }
    }
    
    return 0;
  };

  const compareThreeOfAKindHands = (handA: { holeCards: PokerCard[]; description: string; bestHand?: HandResult }, handB: { holeCards: PokerCard[]; description: string; bestHand?: HandResult }): number => {
    const bestA = handA.bestHand || getBestHand(handA.holeCards);
    const bestB = handB.bestHand || getBestHand(handB.holeCards);
    
    if (!bestA || !bestB) return 0;
    
    console.log(`  Comparing Three of a Kind: ${handA.holeCards.map(c => `${c.rank}${c.suit}`).join(' ')} vs ${handB.holeCards.map(c => `${c.rank}${c.suit}`).join(' ')}`);
    console.log(`    Hand A: ${bestA.cards.map(c => `${c.rank}${c.suit}`).join(' ')} -> ${bestA.description}`);
    console.log(`    Hand B: ${bestB.cards.map(c => `${c.rank}${c.suit}`).join(' ')} -> ${bestB.description}`);
    
    // Debug: Show the actual 5-card hands being compared
    console.log(`    Hand A 5-card: [${bestA.cards.map(c => `${c.rank}${c.suit}`).join(', ')}]`);
    console.log(`    Hand B 5-card: [${bestB.cards.map(c => `${c.rank}${c.suit}`).join(', ')}]`);
    
    // For three of a kind, compare trips first, then kickers
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

  const comparePairHands = (handA: { holeCards: PokerCard[]; description: string; bestHand?: HandResult }, handB: { holeCards: PokerCard[]; description: string; bestHand?: HandResult }): number => {
    const bestA = handA.bestHand || getBestHand(handA.holeCards);
    const bestB = handB.bestHand || getBestHand(handB.holeCards);
    
    if (!bestA || !bestB) return 0;
    
    // For pair, compare pair first, then kickers
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


  const compareStraightHands = (handA: { holeCards: PokerCard[]; description: string; bestHand?: HandResult }, handB: { holeCards: PokerCard[]; description: string; bestHand?: HandResult }): number => {
    const bestA = handA.bestHand || getBestHand(handA.holeCards);
    const bestB = handB.bestHand || getBestHand(handB.holeCards);
    
    if (!bestA || !bestB) return 0;
    
    
    // For straight hands, compare by highest card (top card) only
    const getTopCard = (hand: HandResult) => {
      return Math.max(...hand.cards.map(card => RANK_VALUES[card.rank] || 0));
    };
    
    const topA = getTopCard(bestA);
    const topB = getTopCard(bestB);
    
    return topB - topA; // Higher top card wins
  };

  const compareHandsByHighCard = (handA: { holeCards: PokerCard[]; description: string; bestHand?: HandResult }, handB: { holeCards: PokerCard[]; description: string; bestHand?: HandResult }): number => {
    const bestA = handA.bestHand || getBestHand(handA.holeCards);
    const bestB = handB.bestHand || getBestHand(handB.holeCards);
    
    if (!bestA || !bestB) return 0;
    
    
    // Compare by highest card in the best 5-card hand
    const getHighestCard = (hand: HandResult) => {
      return Math.max(...hand.cards.map(card => RANK_VALUES[card.rank] || 0));
    };
    
    const highestA = getHighestCard(bestA);
    const highestB = getHighestCard(bestB);
    
    return highestB - highestA;
  };

  useEffect(() => {
    generateNewCards();
  }, []);

  const handleSubmitAnswer = () => {
    setShowAnswer(true);
  };

  const handleNewCards = () => {
    generateNewCards();
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">커뮤니티 카드 학습</h1>
          <p className="text-zinc-400">커뮤니티 카드로부터 가능한 모든 족보를 역산해보세요!</p>
        </div>

        {/* Community Cards and Controls */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-center">커뮤니티 카드</h2>
          <div className="flex justify-center gap-4 mb-6">
            {communityCards.map((card, index) => (
              <Card
                key={index}
                rank={card.rank}
                suit={card.suit}
                size="lg"
                className="transform hover:scale-105 transition-transform"
              />
            ))}
          </div>
          
          <div className="text-center">
            <p className="text-zinc-400 mb-4">
              위 커뮤니티 카드로부터 각 족보별로 만들 수 있는 핸드들을 생각해보세요!<br />
              넛(1등)부터 최하위까지 순서대로 어떤 2장의 핸드가 필요한지 추측해보세요.
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={handleSubmitAnswer} variant="primary">
                정답 확인
              </Button>
              <Button onClick={handleNewCards} variant="secondary">
                새 카드
              </Button>
            </div>
          </div>
        </div>

        {/* Answer Section */}
        {showAnswer && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-center">족보별 정답 핸드들</h2>
            
            {/* Hands by Rank - Fixed height with scroll */}
            <div className="h-160 overflow-y-auto border border-zinc-700 rounded-xl bg-zinc-800/30 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800">
              <div className="space-y-3 p-3">
                {handsByRank.map((rankGroup, rankIndex) => (
                  <div key={rankIndex} className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
                    <h3 className="text-base font-semibold mb-2 text-center">
                      #{rankIndex + 1} {rankGroup.rank}
                      <span className="text-xs text-zinc-400 ml-2">
                        ({rankGroup.hands.length}가지)
                      </span>
                    </h3>
                    
                    <div className="overflow-x-auto">
                      <div className="flex gap-2 min-w-max pb-2">
                        {rankGroup.hands.map((hand, handIndex) => {
                          if (hand.isSeparator) {
                            return (
                              <div key={`separator-${handIndex}`} className="flex-shrink-0 w-2">
                                <div className="border-l border-zinc-600 h-full"></div>
                              </div>
                            );
                          }
                          
                          return (
                            <div
                              key={handIndex}
                              className={`flex-shrink-0 p-2 rounded border w-20 ${
                                rankIndex === 0 ? 'border-emerald-500 bg-emerald-500/10' :
                                rankIndex < 3 ? 'border-yellow-500 bg-yellow-500/10' :
                                rankIndex < 5 ? 'border-blue-500 bg-blue-500/10' :
                                'border-zinc-600 bg-zinc-800/50'
                              }`}
                            >
                              <div className="text-center">
                                <div className="text-xs font-semibold mb-1">
                                  #{handIndex + 1}
                                </div>
                                
                                {/* Hole Cards - Show cards with available suits */}
                                <div className="flex justify-center gap-1 mb-1">
                                  {hand.holeCards.map((card, cardIndex) => {
                                    // For flush-related hands, prioritize the suit that matches the flush
                                    const isFlushRelated = hand.description.includes('플러시') || 
                                                          hand.description.includes('Flush') || 
                                                          hand.description.includes('로얄');
                                    
                                    let displaySuit = card.suit;
                                    
                                    if (isFlushRelated) {
                                      // For flush hands, try to use the same suit as the community cards' flush suit
                                      const communitySuits = communityCards.map(c => c.suit);
                                      const flushSuit = communitySuits.find(suit => 
                                        communitySuits.filter(s => s === suit).length >= 3
                                      );
                                      
                                      if (flushSuit) {
                                        // Check if this rank is available in the flush suit
                                        const isAvailableInFlushSuit = !communityCards.some(commCard => 
                                          commCard.rank === card.rank && commCard.suit === flushSuit
                                        );
                                        
                                        if (isAvailableInFlushSuit) {
                                          displaySuit = flushSuit as Suit;
                                        } else {
                                          // Find any available suit for this rank
                                          const availableSuits = ['hearts', 'diamonds', 'clubs', 'spades'].filter(suit => 
                                            !communityCards.some(commCard => 
                                              commCard.rank === card.rank && commCard.suit === suit
                                            )
                                          );
                                          displaySuit = (availableSuits.length > 0 ? availableSuits[0] : card.suit) as Suit;
                                        }
                                      }
                                    } else {
                                      // For non-flush hands, find available suits (excluding community cards and previously used suits)
                                      const usedSuits = hand.holeCards.slice(0, cardIndex).map(prevCard => {
                                        const prevAvailableSuits = ['hearts', 'diamonds', 'clubs', 'spades'].filter(suit => 
                                          !communityCards.some(commCard => 
                                            commCard.rank === prevCard.rank && commCard.suit === suit
                                          )
                                        );
                                        return (prevAvailableSuits.length > 0 ? prevAvailableSuits[0] : prevCard.suit) as Suit;
                                      });
                                      
                                      const availableSuits = ['hearts', 'diamonds', 'clubs', 'spades'].filter(suit => 
                                        !communityCards.some(commCard => 
                                          commCard.rank === card.rank && commCard.suit === suit
                                        ) && !usedSuits.includes(suit as Suit)
                                      );
                                      
                                      displaySuit = (availableSuits.length > 0 ? availableSuits[0] : card.suit) as Suit;
                                    }
                                    
                                    return (
                                      <Card
                                        key={cardIndex}
                                        rank={card.rank}
                                        suit={displaySuit}
                                        size="sm"
                                        simple={true}
                                        className="ring-1 ring-emerald-500"
                                      />
                                    );
                                  })}
                                </div>
                                
                                {/* Card Names */}
                                <div className="text-xs text-zinc-400 mb-1">
                                  {hand.holeCards.map((card, cardIndex) => {
                                    // Use the same logic as card display
                                    const isFlushRelated = hand.description.includes('플러시') || 
                                                          hand.description.includes('Flush') || 
                                                          hand.description.includes('로얄');
                                    
                                    let displaySuit = card.suit;
                                    
                                    if (isFlushRelated) {
                                      const communitySuits = communityCards.map(c => c.suit);
                                      const flushSuit = communitySuits.find(suit => 
                                        communitySuits.filter(s => s === suit).length >= 3
                                      );
                                      
                                      if (flushSuit) {
                                        const isAvailableInFlushSuit = !communityCards.some(commCard => 
                                          commCard.rank === card.rank && commCard.suit === flushSuit
                                        );
                                        
                                        if (isAvailableInFlushSuit) {
                                          displaySuit = flushSuit as Suit;
                                        } else {
                                          const availableSuits = ['hearts', 'diamonds', 'clubs', 'spades'].filter(suit => 
                                            !communityCards.some(commCard => 
                                              commCard.rank === card.rank && commCard.suit === suit
                                            )
                                          );
                                          displaySuit = (availableSuits.length > 0 ? availableSuits[0] : card.suit) as Suit;
                                        }
                                      }
                                    } else {
                                      const usedSuits = hand.holeCards.slice(0, cardIndex).map(prevCard => {
                                        const prevAvailableSuits = ['hearts', 'diamonds', 'clubs', 'spades'].filter(suit => 
                                          !communityCards.some(commCard => 
                                            commCard.rank === prevCard.rank && commCard.suit === suit
                                          )
                                        );
                                        return (prevAvailableSuits.length > 0 ? prevAvailableSuits[0] : prevCard.suit) as Suit;
                                      });
                                      
                                      const availableSuits = ['hearts', 'diamonds', 'clubs', 'spades'].filter(suit => 
                                        !communityCards.some(commCard => 
                                          commCard.rank === card.rank && commCard.suit === suit
                                        ) && !usedSuits.includes(suit as Suit)
                                      );
                                      
                                      displaySuit = (availableSuits.length > 0 ? availableSuits[0] : card.suit) as Suit;
                                    }
                                    
                                    const cardStr = createCardStr(card.rank, displaySuit);
                                    return cardStr.replace('T', '10');
                                  }).join(' ')}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Explanation */}
            <div className="mt-6 bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
              <h3 className="text-lg font-semibold mb-3">💡 학습 포인트</h3>
              <div className="text-sm text-zinc-300 space-y-2">
                <p>• <b>넛 핸드:</b> 가장 강한 족보부터 시작해서 순서대로 나열해보세요</p>
                <p>• <b>역산 사고:</b> 주어진 커뮤니티 카드로부터 어떤 핸드가 필요한지 생각해보세요</p>
                <p>• <b>족보 조합:</b> 7장의 카드에서 5장을 선택하는 모든 경우의 수를 고려하세요</p>
                <p>• <b>실전 적용:</b> 이런 연습이 실제 게임에서 상대방의 가능한 핸드를 읽는 데 도움이 됩니다</p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-zinc-800/30 rounded-xl p-6 border border-zinc-700">
          <h3 className="text-lg font-semibold mb-3">📚 학습 방법</h3>
          <div className="text-sm text-zinc-300 space-y-2">
            <p>1. <b>커뮤니티 카드 분석:</b> 주어진 5장의 커뮤니티 카드를 자세히 관찰하세요</p>
            <p>2. <b>족보 역산:</b> 넛(로얄 플러시)부터 하이카드까지 모든 족보를 순서대로 나열해보세요</p>
            <p>3. <b>필요한 핸드 추측:</b> 각 족보를 만들기 위해 필요한 2장의 핸드를 추측해보세요</p>
            <p>4. <b>정답 확인:</b> 정답을 확인하고 실제로 가능한 모든 족보를 확인해보세요</p>
            <p>5. <b>반복 학습:</b> 다양한 커뮤니티 카드 조합으로 연습해보세요</p>
          </div>
        </div>
      </div>
    </div>
  );
};
