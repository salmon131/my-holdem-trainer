import React from 'react';

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K';

interface CardProps {
  rank: Rank;
  suit: Suit;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  simple?: boolean; // 간단한 카드 (숫자와 무늬만)
}

const suitSymbols = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠'
};


const sizeClasses = {
  sm: {
    card: 'w-8 h-11 text-xs',
    simple: 'w-6 h-8 text-xs'
  },
  md: {
    card: 'w-12 h-16 text-sm',
    simple: 'w-8 h-10 text-sm'
  },
  lg: {
    card: 'w-16 h-22 text-lg',
    simple: 'w-10 h-14 text-base'
  }
};

export const Card: React.FC<CardProps> = ({ 
  rank, 
  suit, 
  size = 'md', 
  className = '',
  simple = false
}) => {
  const isRed = suit === 'hearts' || suit === 'diamonds';
  const suitSymbol = suitSymbols[suit];
  const suitColor = isRed ? 'text-red-500' : 'text-black';
  const displayRank = rank === 'T' ? '10' : rank;

  if (simple) {
    return (
      <div className={`
        ${sizeClasses[size].simple}
        bg-white border border-gray-300 rounded shadow-sm
        flex items-center justify-center
        ${className}
      `}>
        <div className={`${suitColor} font-bold text-center`}>
          <div>{displayRank}</div>
          <div className="text-xs">{suitSymbol}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`
      ${sizeClasses[size].card}
      bg-white border-2 border-gray-300 rounded-lg shadow-md
      flex flex-col justify-between p-1
      ${className}
    `}>
      {/* Top-left rank and suit */}
      <div className={`${suitColor} font-bold leading-none`}>
        {displayRank}
        <div className="text-xs">{suitSymbol}</div>
      </div>
      
      {/* Center suit symbol */}
      <div className={`${suitColor} text-center flex items-center justify-center flex-1`}>
        <span className="text-2xl">{suitSymbol}</span>
      </div>
      
      {/* Bottom-right rank and suit (rotated) */}
      <div className={`${suitColor} font-bold leading-none transform rotate-180`}>
        {displayRank}
        <div className="text-xs">{suitSymbol}</div>
      </div>
    </div>
  );
};

// Helper function to parse card string like "4h", "Kd", "As"
export const parseCard = (cardStr: string): { rank: Rank; suit: Suit } => {
  const rank = cardStr[0] as Rank;
  const suitMap = {
    'h': 'hearts' as Suit,
    'd': 'diamonds' as Suit,
    'c': 'clubs' as Suit,
    's': 'spades' as Suit
  };
  const suit = suitMap[cardStr[1] as keyof typeof suitMap];
  
  return { rank, suit };
};

// Helper function to create card string from rank and suit
export const createCardStr = (rank: Rank, suit: Suit): string => {
  const suitMap = {
    'hearts': 'h',
    'diamonds': 'd',
    'clubs': 'c',
    'spades': 's'
  };
  return `${rank}${suitMap[suit]}`;
};
