import React, { useState, useEffect } from 'react';
import { Card, parseCard, createCardStr } from '../../shared/ui/Card/Card';
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
  hands: { holeCards: PokerCard[]; description: string; isSeparator?: boolean }[];
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
    
    const handsByRankMap = new Map<string, { holeCards: PokerCard[]; description: string; subRank?: string }[]>();
    
    // Try all possible 2-card combinations
    for (let i = 0; i < availableCards.length; i++) {
      for (let j = i + 1; j < availableCards.length; j++) {
        const holeCards = [availableCards[i], availableCards[j]];
        const allHands = generateAllHands(community, holeCards);
        const bestHand = allHands[0]; // Highest hand
        
        if (bestHand) {
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
          }
          
          handsByRankMap.get(rankKey)!.push({
            holeCards,
            description: bestHand.description,
            subRank
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
        const groupedHands = new Map<string, { holeCards: PokerCard[]; description: string }[]>();
        
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
                description: hand.description
              });
            }
          } else {
            // For flush-related hands, show all suit combinations
            groupedHands.get(groupKey)!.push({
              holeCards: hand.holeCards,
              description: hand.description
            });
          }
        }
        
        // Convert grouped hands back to flat array with separators
        const finalHands: { holeCards: PokerCard[]; description: string; isSeparator?: boolean }[] = [];
        let isFirstGroup = true;
        
        for (const [subRank, groupHands] of groupedHands) {
          if (!isFirstGroup) {
            // Add separator between different sub-ranks
            finalHands.push({
              holeCards: [],
              description: '',
              isSeparator: true
            });
          }
          finalHands.push(...groupHands);
          isFirstGroup = false;
        }
        
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
                                    // Find available suits for this rank (excluding community cards and previously used suits)
                                    const usedSuits = hand.holeCards.slice(0, cardIndex).map(prevCard => {
                                      const prevAvailableSuits = ['hearts', 'diamonds', 'clubs', 'spades'].filter(suit => 
                                        !communityCards.some(commCard => 
                                          commCard.rank === prevCard.rank && commCard.suit === suit
                                        )
                                      );
                                      return prevAvailableSuits.length > 0 ? prevAvailableSuits[0] : prevCard.suit;
                                    });
                                    
                                    const availableSuits = ['hearts', 'diamonds', 'clubs', 'spades'].filter(suit => 
                                      !communityCards.some(commCard => 
                                        commCard.rank === card.rank && commCard.suit === suit
                                      ) && !usedSuits.includes(suit)
                                    );
                                    
                                    // Use the first available suit, or fallback to the original suit
                                    const displaySuit = availableSuits.length > 0 ? availableSuits[0] : card.suit;
                                    
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
                                    const usedSuits = hand.holeCards.slice(0, cardIndex).map(prevCard => {
                                      const prevAvailableSuits = ['hearts', 'diamonds', 'clubs', 'spades'].filter(suit => 
                                        !communityCards.some(commCard => 
                                          commCard.rank === prevCard.rank && commCard.suit === suit
                                        )
                                      );
                                      return prevAvailableSuits.length > 0 ? prevAvailableSuits[0] : prevCard.suit;
                                    });
                                    
                                    const availableSuits = ['hearts', 'diamonds', 'clubs', 'spades'].filter(suit => 
                                      !communityCards.some(commCard => 
                                        commCard.rank === card.rank && commCard.suit === suit
                                      ) && !usedSuits.includes(suit)
                                    );
                                    
                                    const displaySuit = availableSuits.length > 0 ? availableSuits[0] : card.suit;
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
