// 포지션 상수
export const POSITIONS = ["UTG", "MP", "CO", "BTN", "SB", "BB"] as const;
export type Position = typeof POSITIONS[number];

// 카드 랭크 상수
export const RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"] as const;

// 액션 타입
export type Action = "R" | "C" | "F" | "M";

// 액션 라벨
export const ACTION_LABEL: Record<Action, string> = { 
  R: "Raise", 
  C: "Call", 
  F: "Fold", 
  M: "Mix" 
};

// 액션 스타일 (Tailwind 클래스)
export const ACTION_STYLE: Record<Action, string> = {
  R: "bg-emerald-500/80 hover:bg-emerald-500",
  C: "bg-indigo-500/80 hover:bg-indigo-500",
  F: "bg-zinc-700/70 hover:bg-zinc-700",
  M: "bg-amber-500/80 hover:bg-amber-500",
};
