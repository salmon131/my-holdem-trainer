import React, { useMemo, useState, useEffect } from "react";

/**
 * Holdem Chart Trainer – single-file React component
 * - Position-aware starting hand chart (13x13)
 * - Flashcard drill (action: Raise / Call / Fold)
 * - Quick Quiz (5 questions)
 * - Lightweight, Tailwind-only, no external data fetching
 *
 * How to use:
 * 1) Put this file in your React app and export default component.
 * 2) Ensure Tailwind is enabled (or swap classNames to your CSS).
 * 3) Optional: replace CHART_DATA with your preferred ranges.
 */

// --- Utilities
const POSITIONS = ["UTG", "MP", "CO", "BTN", "SB", "BB"] as const;
export type Position = typeof POSITIONS[number];

// Hand codes like "AKs", "QJo", "77"
const RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"] as const;

// Chart cell state: R = Raise, C = Call, F = Fold, M = Mixed (raise/call or raise/fold)
// Keep it simple for v1. You can refine per solver later.
export type Action = "R" | "C" | "F" | "M";

// Chart data with reasons for educational purposes
export type ChartEntry = {
  action: Action;
  reason: string;
};

// Minimal beginner-friendly RFI/call chart (educational, not definitive GTO!)
// Each position maps hand -> action + reason. Missing hands default to F.
//
// Legend:
// R = open/raise, C = call (mostly vs open in blinds), M = mix, F = fold
//
// TIP: Start strict; widen later as you gain confidence.
const CHART_DATA: Record<Position, Record<string, ChartEntry>> = {
  UTG: {
    "AA": { action: "R", reason: "최강 핸드. 어떤 포지션에서도 무조건 레이즈. 가치 극대화 필수." },
    "KK": { action: "R", reason: "AA 다음으로 강한 핸드. 멀티웨이에서도 승률 높음." },
    "QQ": { action: "R", reason: "프리미엄 페어. 뒤에 6명이 남아있어도 충분히 강함." },
    "JJ": { action: "R", reason: "강한 페어. UTG에서도 레이즈 가치 있음." },
    "TT": { action: "R", reason: "중상급 페어. UTG에서 레이즈 가능." },
    "99": { action: "R", reason: "중급 페어. UTG에서 레이즈." },
    "88": { action: "R", reason: "중급 페어. UTG에서 레이즈." },
    "77": { action: "R", reason: "중급 페어. UTG에서 레이즈." },
    "AKs": { action: "R", reason: "최강 오프수트. 에이스 하이 + 플러시 드로우 가능." },
    "AQs": { action: "R", reason: "강한 수딧 핸드. 에이스 하이 + 플러시 드로우." },
    "AJs": { action: "R", reason: "수딧 에이스. 플러시 드로우 가능." },
    "ATs": { action: "R", reason: "수딧 에이스. 플러시 드로우 가능." },
    "KQs": { action: "R", reason: "강한 수딧 핸드. 킹 하이 + 플러시 드로우." },
    "KJs": { action: "M", reason: "수딧 킹. UTG에서는 약간 애매. 상황에 따라 레이즈/폴드." },
    "QJs": { action: "M", reason: "수딧 퀸. UTG에서는 애매. 상황에 따라 레이즈/폴드." },
    "AKo": { action: "R", reason: "최강 오프수트. 에이스 하이 + 콤보 많음." },
    "AQo": { action: "R", reason: "강한 오프수트. 에이스 하이." },
    "AJo": { action: "M", reason: "오프수트 에이스. UTG에서는 애매. 상황에 따라 레이즈/폴드." },
    "A5s": { action: "M", reason: "수딧 에이스. UTG에서는 애매. 상황에 따라 레이즈/폴드." },
    "A4s": { action: "M", reason: "수딧 에이스. UTG에서는 애매. 상황에 따라 레이즈/폴드." },
    "A3s": { action: "M", reason: "수딧 에이스. UTG에서는 애매. 상황에 따라 레이즈/폴드." },
    "A2s": { action: "M", reason: "수딧 에이스. UTG에서는 애매. 상황에 따라 레이즈/폴드." }
  },
  MP: {
    "AA": { action: "R", reason: "최강 핸드. MP에서도 무조건 레이즈." },
    "KK": { action: "R", reason: "AA 다음으로 강한 핸드. MP에서 레이즈." },
    "QQ": { action: "R", reason: "프리미엄 페어. MP에서 레이즈." },
    "JJ": { action: "R", reason: "강한 페어. MP에서 레이즈." },
    "TT": { action: "R", reason: "중상급 페어. MP에서 레이즈." },
    "99": { action: "R", reason: "중급 페어. MP에서 레이즈." },
    "88": { action: "R", reason: "중급 페어. MP에서 레이즈." },
    "77": { action: "R", reason: "중급 페어. MP에서 레이즈." },
    "66": { action: "M", reason: "중급 페어. MP에서는 애매. 상황에 따라 레이즈/폴드." },
    "AKs": { action: "R", reason: "최강 오프수트. MP에서 레이즈." },
    "AQs": { action: "R", reason: "강한 수딧 핸드. MP에서 레이즈." },
    "AJs": { action: "R", reason: "수딧 에이스. MP에서 레이즈." },
    "ATs": { action: "R", reason: "수딧 에이스. MP에서 레이즈." },
    "A9s": { action: "M", reason: "수딧 에이스. MP에서는 애매. 상황에 따라 레이즈/폴드." },
    "KQs": { action: "R", reason: "강한 수딧 핸드. MP에서 레이즈." },
    "KJs": { action: "R", reason: "수딧 킹. MP에서 레이즈." },
    "QJs": { action: "R", reason: "수딧 퀸. MP에서 레이즈." },
    "JTs": { action: "R", reason: "수딧 커넥터. MP에서 레이즈." },
    "AKo": { action: "R", reason: "최강 오프수트. MP에서 레이즈." },
    "AQo": { action: "R", reason: "강한 오프수트. MP에서 레이즈." },
    "AJo": { action: "R", reason: "오프수트 에이스. MP에서 레이즈." },
    "KQo": { action: "M", reason: "오프수트 킹. MP에서는 애매. 상황에 따라 레이즈/폴드." },
    "A5s": { action: "M", reason: "수딧 에이스. MP에서는 애매. 상황에 따라 레이즈/폴드." },
    "A4s": { action: "M", reason: "수딧 에이스. MP에서는 애매. 상황에 따라 레이즈/폴드." },
    "A3s": { action: "M", reason: "수딧 에이스. MP에서는 애매. 상황에 따라 레이즈/폴드." },
    "A2s": { action: "M", reason: "수딧 에이스. MP에서는 애매. 상황에 따라 레이즈/폴드." }
  },
  CO: {
    "AA": { action: "R", reason: "최강 핸드. CO에서 무조건 레이즈." },
    "KK": { action: "R", reason: "AA 다음으로 강한 핸드. CO에서 레이즈." },
    "QQ": { action: "R", reason: "프리미엄 페어. CO에서 레이즈." },
    "JJ": { action: "R", reason: "강한 페어. CO에서 레이즈." },
    "TT": { action: "R", reason: "중상급 페어. CO에서 레이즈." },
    "99": { action: "R", reason: "중급 페어. CO에서 레이즈." },
    "88": { action: "R", reason: "중급 페어. CO에서 레이즈." },
    "77": { action: "R", reason: "중급 페어. CO에서 레이즈." },
    "66": { action: "R", reason: "중급 페어. CO에서 레이즈." },
    "55": { action: "M", reason: "중급 페어. CO에서는 애매. 상황에 따라 레이즈/폴드." },
    "AKs": { action: "R", reason: "최강 오프수트. CO에서 레이즈." },
    "AQs": { action: "R", reason: "강한 수딧 핸드. CO에서 레이즈." },
    "AJs": { action: "R", reason: "수딧 에이스. CO에서 레이즈." },
    "ATs": { action: "R", reason: "수딧 에이스. CO에서 레이즈." },
    "A9s": { action: "R", reason: "수딧 에이스. CO에서 레이즈." },
    "A8s": { action: "M", reason: "수딧 에이스. CO에서는 애매. 상황에 따라 레이즈/폴드." },
    "KQs": { action: "R", reason: "강한 수딧 핸드. CO에서 레이즈." },
    "KJs": { action: "R", reason: "수딧 킹. CO에서 레이즈." },
    "KTs": { action: "R", reason: "수딧 킹. CO에서 레이즈." },
    "QJs": { action: "R", reason: "수딧 퀸. CO에서 레이즈." },
    "QTs": { action: "R", reason: "수딧 퀸. CO에서 레이즈." },
    "JTs": { action: "R", reason: "수딧 커넥터. CO에서 레이즈." },
    "T9s": { action: "R", reason: "수딧 커넥터. CO에서 레이즈." },
    "98s": { action: "R", reason: "수딧 커넥터. CO에서 레이즈." },
    "AKo": { action: "R", reason: "최강 오프수트. CO에서 레이즈." },
    "AQo": { action: "R", reason: "강한 오프수트. CO에서 레이즈." },
    "AJo": { action: "R", reason: "오프수트 에이스. CO에서 레이즈." },
    "ATo": { action: "M", reason: "오프수트 에이스. CO에서는 애매. 상황에 따라 레이즈/폴드." },
    "KQo": { action: "R", reason: "오프수트 킹. CO에서 레이즈." },
    "KJo": { action: "M", reason: "오프수트 킹. CO에서는 애매. 상황에 따라 레이즈/폴드." },
    "QJo": { action: "M", reason: "오프수트 퀸. CO에서는 애매. 상황에 따라 레이즈/폴드." }
  },
  BTN: {
    "AA": { action: "R", reason: "최강 핸드. BTN에서 무조건 레이즈." },
    "KK": { action: "R", reason: "AA 다음으로 강한 핸드. BTN에서 레이즈." },
    "QQ": { action: "R", reason: "프리미엄 페어. BTN에서 레이즈." },
    "JJ": { action: "R", reason: "강한 페어. BTN에서 레이즈." },
    "TT": { action: "R", reason: "중상급 페어. BTN에서 레이즈." },
    "99": { action: "R", reason: "중급 페어. BTN에서 레이즈." },
    "88": { action: "R", reason: "중급 페어. BTN에서 레이즈." },
    "77": { action: "R", reason: "중급 페어. BTN에서 레이즈." },
    "66": { action: "R", reason: "중급 페어. BTN에서 레이즈." },
    "55": { action: "R", reason: "중급 페어. BTN에서 레이즈." },
    "44": { action: "R", reason: "중급 페어. BTN에서 레이즈." },
    "33": { action: "R", reason: "중급 페어. BTN에서 레이즈." },
    "22": { action: "R", reason: "중급 페어. BTN에서 레이즈." },
    "AKs": { action: "R", reason: "최강 오프수트. BTN에서 레이즈." },
    "AQs": { action: "R", reason: "강한 수딧 핸드. BTN에서 레이즈." },
    "AJs": { action: "R", reason: "수딧 에이스. BTN에서 레이즈." },
    "ATs": { action: "R", reason: "수딧 에이스. BTN에서 레이즈." },
    "A9s": { action: "R", reason: "수딧 에이스. BTN에서 레이즈." },
    "A8s": { action: "R", reason: "수딧 에이스. BTN에서 레이즈." },
    "A7s": { action: "R", reason: "수딧 에이스. BTN에서 레이즈." },
    "A6s": { action: "R", reason: "수딧 에이스. BTN에서 레이즈." },
    "A5s": { action: "R", reason: "수딧 에이스. BTN에서 레이즈." },
    "A4s": { action: "R", reason: "수딧 에이스. BTN에서 레이즈." },
    "A3s": { action: "R", reason: "수딧 에이스. BTN에서 레이즈." },
    "A2s": { action: "R", reason: "수딧 에이스. BTN에서 레이즈." },
    "KQs": { action: "R", reason: "강한 수딧 핸드. BTN에서 레이즈." },
    "KJs": { action: "R", reason: "수딧 킹. BTN에서 레이즈." },
    "KTs": { action: "R", reason: "수딧 킹. BTN에서 레이즈." },
    "K9s": { action: "R", reason: "수딧 킹. BTN에서 레이즈." },
    "QJs": { action: "R", reason: "수딧 퀸. BTN에서 레이즈." },
    "QTs": { action: "R", reason: "수딧 퀸. BTN에서 레이즈." },
    "JTs": { action: "R", reason: "수딧 커넥터. BTN에서 레이즈." },
    "T9s": { action: "R", reason: "수딧 커넥터. BTN에서 레이즈." },
    "98s": { action: "R", reason: "수딧 커넥터. BTN에서 레이즈." },
    "87s": { action: "R", reason: "수딧 커넥터. BTN에서 레이즈." },
    "76s": { action: "R", reason: "수딧 커넥터. BTN에서 레이즈." },
    "65s": { action: "R", reason: "수딧 커넥터. BTN에서 레이즈." },
    "AKo": { action: "R", reason: "최강 오프수트. BTN에서 레이즈." },
    "AQo": { action: "R", reason: "강한 오프수트. BTN에서 레이즈." },
    "AJo": { action: "R", reason: "오프수트 에이스. BTN에서 레이즈." },
    "ATo": { action: "R", reason: "오프수트 에이스. BTN에서 레이즈." },
    "KQo": { action: "R", reason: "오프수트 킹. BTN에서 레이즈." },
    "KJo": { action: "R", reason: "오프수트 킹. BTN에서 레이즈." },
    "QJo": { action: "R", reason: "오프수트 퀸. BTN에서 레이즈." },
    "KTo": { action: "M", reason: "오프수트 킹. BTN에서는 애매. 상황에 따라 레이즈/폴드." },
    "QTo": { action: "M", reason: "오프수트 퀸. BTN에서는 애매. 상황에 따라 레이즈/폴드." },
    "JTo": { action: "M", reason: "오프수트 잭. BTN에서는 애매. 상황에 따라 레이즈/폴드." }
  },
  SB: {
    "AA": { action: "R", reason: "최강 핸드. SB에서 무조건 레이즈." },
    "KK": { action: "R", reason: "AA 다음으로 강한 핸드. SB에서 레이즈." },
    "QQ": { action: "R", reason: "프리미엄 페어. SB에서 레이즈." },
    "JJ": { action: "R", reason: "강한 페어. SB에서 레이즈." },
    "TT": { action: "R", reason: "중상급 페어. SB에서 레이즈." },
    "99": { action: "R", reason: "중급 페어. SB에서 레이즈." },
    "88": { action: "R", reason: "중급 페어. SB에서 레이즈." },
    "77": { action: "R", reason: "중급 페어. SB에서 레이즈." },
    "66": { action: "R", reason: "중급 페어. SB에서 레이즈." },
    "55": { action: "R", reason: "중급 페어. SB에서 레이즈." },
    "44": { action: "R", reason: "중급 페어. SB에서 레이즈." },
    "33": { action: "R", reason: "중급 페어. SB에서 레이즈." },
    "22": { action: "R", reason: "중급 페어. SB에서 레이즈." },
    "AKs": { action: "R", reason: "최강 오프수트. SB에서 레이즈." },
    "AQs": { action: "R", reason: "강한 수딧 핸드. SB에서 레이즈." },
    "AJs": { action: "R", reason: "수딧 에이스. SB에서 레이즈." },
    "ATs": { action: "R", reason: "수딧 에이스. SB에서 레이즈." },
    "A9s": { action: "R", reason: "수딧 에이스. SB에서 레이즈." },
    "A8s": { action: "R", reason: "수딧 에이스. SB에서 레이즈." },
    "A7s": { action: "R", reason: "수딧 에이스. SB에서 레이즈." },
    "A6s": { action: "R", reason: "수딧 에이스. SB에서 레이즈." },
    "A5s": { action: "R", reason: "수딧 에이스. SB에서 레이즈." },
    "A4s": { action: "R", reason: "수딧 에이스. SB에서 레이즈." },
    "A3s": { action: "R", reason: "수딧 에이스. SB에서 레이즈." },
    "A2s": { action: "R", reason: "수딧 에이스. SB에서 레이즈." },
    "KQs": { action: "R", reason: "강한 수딧 핸드. SB에서 레이즈." },
    "KJs": { action: "R", reason: "수딧 킹. SB에서 레이즈." },
    "KTs": { action: "R", reason: "수딧 킹. SB에서 레이즈." },
    "QJs": { action: "R", reason: "수딧 퀸. SB에서 레이즈." },
    "QTs": { action: "R", reason: "수딧 퀸. SB에서 레이즈." },
    "JTs": { action: "R", reason: "수딧 커넥터. SB에서 레이즈." },
    "T9s": { action: "R", reason: "수딧 커넥터. SB에서 레이즈." },
    "98s": { action: "R", reason: "수딧 커넥터. SB에서 레이즈." },
    "87s": { action: "R", reason: "수딧 커넥터. SB에서 레이즈." },
    "76s": { action: "R", reason: "수딧 커넥터. SB에서 레이즈." },
    "65s": { action: "R", reason: "수딧 커넥터. SB에서 레이즈." },
    "AKo": { action: "R", reason: "최강 오프수트. SB에서 레이즈." },
    "AQo": { action: "R", reason: "강한 오프수트. SB에서 레이즈." },
    "AJo": { action: "R", reason: "오프수트 에이스. SB에서 레이즈." },
    "ATo": { action: "R", reason: "오프수트 에이스. SB에서 레이즈." },
    "KQo": { action: "R", reason: "오프수트 킹. SB에서 레이즈." },
    "KJo": { action: "R", reason: "오프수트 킹. SB에서 레이즈." },
    "QJo": { action: "R", reason: "오프수트 퀸. SB에서 레이즈." }
  },
  BB: {
    "AA": { action: "R", reason: "최강 핸드. BB에서 3-bet 레이즈." },
    "KK": { action: "R", reason: "AA 다음으로 강한 핸드. BB에서 3-bet 레이즈." },
    "QQ": { action: "R", reason: "프리미엄 페어. BB에서 3-bet 레이즈." },
    "JJ": { action: "R", reason: "강한 페어. BB에서 3-bet 레이즈." },
    "TT": { action: "C", reason: "중상급 페어. BB에서 콜." },
    "99": { action: "C", reason: "중급 페어. BB에서 콜." },
    "88": { action: "C", reason: "중급 페어. BB에서 콜." },
    "77": { action: "C", reason: "중급 페어. BB에서 콜." },
    "66": { action: "C", reason: "중급 페어. BB에서 콜." },
    "55": { action: "C", reason: "중급 페어. BB에서 콜." },
    "AKs": { action: "R", reason: "최강 오프수트. BB에서 3-bet 레이즈." },
    "AQs": { action: "C", reason: "강한 수딧 핸드. BB에서 콜." },
    "AJs": { action: "C", reason: "수딧 에이스. BB에서 콜." },
    "ATs": { action: "C", reason: "수딧 에이스. BB에서 콜." },
    "A9s": { action: "C", reason: "수딧 에이스. BB에서 콜." },
    "A8s": { action: "C", reason: "수딧 에이스. BB에서 콜." },
    "A5s": { action: "C", reason: "수딧 에이스. BB에서 콜." },
    "A4s": { action: "C", reason: "수딧 에이스. BB에서 콜." },
    "A3s": { action: "C", reason: "수딧 에이스. BB에서 콜." },
    "A2s": { action: "C", reason: "수딧 에이스. BB에서 콜." },
    "KQs": { action: "C", reason: "강한 수딧 핸드. BB에서 콜." },
    "KJs": { action: "C", reason: "수딧 킹. BB에서 콜." },
    "QJs": { action: "C", reason: "수딧 퀸. BB에서 콜." },
    "JTs": { action: "C", reason: "수딧 커넥터. BB에서 콜." },
    "T9s": { action: "C", reason: "수딧 커넥터. BB에서 콜." },
    "98s": { action: "C", reason: "수딧 커넥터. BB에서 콜." },
    "87s": { action: "C", reason: "수딧 커넥터. BB에서 콜." },
    "AKo": { action: "R", reason: "최강 오프수트. BB에서 3-bet 레이즈." },
    "AQo": { action: "C", reason: "강한 오프수트. BB에서 콜." },
    "AJo": { action: "C", reason: "오프수트 에이스. BB에서 콜." },
    "KQo": { action: "C", reason: "오프수트 킹. BB에서 콜." }
  }
};

function codeHand(r1: string, r2: string, suited: boolean | null): string {
  if (r1 === r2) return `${r1}${r2}`; // pair e.g., 77
  const hi = RANKS.indexOf(r1 as any) < RANKS.indexOf(r2 as any) ? r1 : r2;
  const lo = hi === r1 ? r2 : r1;
  return `${hi}${lo}${suited === null ? "" : suited ? "s" : "o"}`; // AKs / AKo
}

// function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

// Pretty label
const ACTION_LABEL: Record<Action, string> = { R: "Raise", C: "Call", F: "Fold", M: "Mix" };

// Color classes per action
const ACTION_STYLE: Record<Action, string> = {
  R: "bg-emerald-500/80 hover:bg-emerald-500",
  C: "bg-indigo-500/80 hover:bg-indigo-500",
  F: "bg-zinc-700/70 hover:bg-zinc-700",
  M: "bg-amber-500/80 hover:bg-amber-500",
};

// --- Component
export default function HoldemTrainer() {
  const [position, setPosition] = useState<Position>("CO");
  const [mode, setMode] = useState<"chart" | "flash" | "quiz">("chart");

  // Flash/Quiz state
  const [current, setCurrent] = useState<{hand: string; action: Action; reason: string}>();
  const [guess, setGuess] = useState<Action | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [quizCount, setQuizCount] = useState(5);

  // All 13x13 matrix cells
  const matrix = useMemo(() => {
    const cells: { key: string; label: string; action: Action; reason: string }[][] = [];
    for (let i = 0; i < RANKS.length; i++) {
      const row: { key: string; label: string; action: Action; reason: string }[] = [];
      for (let j = 0; j < RANKS.length; j++) {
        const r1 = RANKS[i];
        const r2 = RANKS[j];
        const suited = i < j ? true : i > j ? false : null; // upper tri suited, lower off, diag pairs
        const code = codeHand(r1, r2, suited);
        const entry = CHART_DATA[position][code] ?? { action: "F", reason: "폴드. 이 핸드는 이 포지션에서 플레이하기에 너무 약함." };
        row.push({ key: code, label: code, action: entry.action, reason: entry.reason });
      }
      cells.push(row);
    }
    return cells;
  }, [position]);

  // Build a random drill question from current position distribution
  const nextQuestion = () => {
    // Weight non-folds slightly higher for learning
    const weights: [string, Action, string, number][] = [];
    for (const r1 of RANKS) {
      for (const r2 of RANKS) {
        const suited = RANKS.indexOf(r1) < RANKS.indexOf(r2) ? true : RANKS.indexOf(r1) > RANKS.indexOf(r2) ? false : null;
        const code = codeHand(r1, r2, suited);
        const entry = CHART_DATA[position][code] ?? { action: "F", reason: "폴드. 이 핸드는 이 포지션에서 플레이하기에 너무 약함." };
        const w = entry.action === "F" ? 1 : entry.action === "M" ? 2 : 3;
        weights.push([code, entry.action, entry.reason, w]);
      }
    }
    const total = weights.reduce((s, x) => s + x[3], 0);
    let t = Math.random() * total;
    for (const [code, action, reason, w] of weights) {
      if ((t -= w) <= 0) {
        setCurrent({ hand: code, action, reason });
        setGuess(null);
        return;
      }
    }
  };

  useEffect(() => { if (mode !== "chart") nextQuestion(); }, [mode, position]);

  const submitGuess = (a: Action) => {
    if (!current) return;
    if (guess) return; // already answered
    setGuess(a);
    const ok = a === current.action || (current.action === "M" && (a === "R" || a === "C"));
    setScore(s => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }));
  };

  const resetQuiz = () => { setScore({ correct: 0, total: 0 }); setQuizCount(5); nextQuestion(); };

  const actionButton = (a: Action, extra="") => (
    <button
      key={a}
      onClick={() => submitGuess(a)}
      className={`px-4 py-2 rounded-xl text-white font-medium shadow ${ACTION_STYLE[a]} ${extra}`}
    >{ACTION_LABEL[a]}</button>
  );

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Holdem Chart Trainer</h1>
            <p className="text-zinc-400">차트 암기 & 기본기 연습용 미니 웹앱 (v1)</p>
          </div>
          <div className="flex gap-2">
            {(["chart","flash","quiz"] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-2 rounded-xl border border-zinc-700 ${mode===m?"bg-zinc-800":"bg-zinc-900 hover:bg-zinc-800"}`}
              >{m === "chart" ? "Chart" : m === "flash" ? "Flashcards" : "Quick Quiz"}</button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <span className="text-zinc-400">Position</span>
          <div className="flex flex-wrap gap-2">
            {POSITIONS.map(p => (
              <button
                key={p}
                onClick={() => setPosition(p)}
                className={`px-3 py-1.5 rounded-full text-sm border ${position===p?"border-emerald-400 bg-emerald-900/30":"border-zinc-700 bg-zinc-900 hover:bg-zinc-800"}`}
              >{p}</button>
            ))}
          </div>
          <div className="ml-auto text-sm text-zinc-400 flex items-center gap-3">
            <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-emerald-500" />Raise</span>
            <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-indigo-500" />Call</span>
            <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-amber-500" />Mix</span>
            <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-zinc-700" />Fold</span>
          </div>
        </div>

        {/* Modes */}
        {mode === "chart" && (
          <div className="rounded-2xl border border-zinc-800 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="bg-zinc-900/80 backdrop-blur px-2 py-1 text-center text-xs font-semibold border-b border-r border-zinc-800">핸드</th>
                    {RANKS.map(r => (
                      <th key={`top-${r}`} className="px-2 py-1 text-center text-xs font-semibold border-b border-r border-zinc-800 bg-zinc-900/60">{r}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RANKS.map((row, i) => (
                    <tr key={`row-${row}`}>
                      <td className="bg-zinc-900/80 backdrop-blur px-2 py-1 text-center text-xs font-semibold border-b border-r border-zinc-800">{row}</td>
                      {matrix[i].map(cell => (
                        <td
                          key={cell.key}
                          title={`${cell.label} • ${ACTION_LABEL[cell.action]}\n\n${cell.reason}`}
                          className={`h-8 text-[10px] text-center border-b border-r border-zinc-800 cursor-default ${ACTION_STYLE[cell.action]} hover:scale-105 transition-transform`}
                        >{cell.label}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {mode === "flash" && current && (
          <div className="rounded-2xl border border-zinc-800 p-6 grid gap-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-zinc-400">Position</div>
                <div className="text-xl font-semibold">{position}</div>
              </div>
              <div className="text-sm text-zinc-400">점수: <span className="text-white font-semibold">{score.correct}</span> / {score.total}</div>
            </div>

            <div className="text-center py-8">
              <div className="text-zinc-400 mb-1">핸드</div>
              <div className="text-5xl font-extrabold tracking-tight">{current.hand}</div>
            </div>

            <div className="flex items-center justify-center gap-3">
              {actionButton("R")}
              {actionButton("C")}
              {actionButton("F")}
            </div>

            {guess && (
              <div className="text-center mt-4">
                <div className={`inline-block px-3 py-1 rounded-full text-sm ${guess === current.action || (current.action === "M" && (guess === "R" || guess === "C")) ? "bg-emerald-600" : "bg-rose-600"}`}>
                  {guess === current.action || (current.action === "M" && (guess === "R" || guess === "C")) ? "정답!" : "오답"}
                </div>
                <div className="mt-2 text-zinc-300">정답: <b>{ACTION_LABEL[current.action]}</b></div>
                <div className="mt-3 p-3 bg-zinc-800/50 rounded-lg text-sm text-zinc-200 max-w-md mx-auto">
                  <div className="font-semibold text-zinc-100 mb-1">💡 이유:</div>
                  <div>{current.reason}</div>
                </div>
                <button onClick={nextQuestion} className="mt-4 px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800">다음 문제</button>
              </div>
            )}
          </div>
        )}

        {mode === "quiz" && current && (
          <div className="rounded-2xl border border-zinc-800 p-6 grid gap-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-zinc-400">Quick Quiz</div>
                <div className="text-xl font-semibold">{position} • 남은 문제 {quizCount}</div>
              </div>
              <div className="text-sm text-zinc-400">점수: <span className="text-white font-semibold">{score.correct}</span> / {score.total}</div>
            </div>

            <div className="text-center py-8">
              <div className="text-zinc-400 mb-1">핸드</div>
              <div className="text-5xl font-extrabold tracking-tight">{current.hand}</div>
            </div>

            <div className="flex items-center justify-center gap-3">
              {actionButton("R", "w-28")}
              {actionButton("C", "w-28")}
              {actionButton("F", "w-28")}
            </div>

            {guess && (
              <div className="text-center mt-4">
                <div className={`inline-block px-3 py-1 rounded-full text-sm ${guess === current.action || (current.action === "M" && (guess === "R" || guess === "C")) ? "bg-emerald-600" : "bg-rose-600"}`}>
                  {guess === current.action || (current.action === "M" && (guess === "R" || guess === "C")) ? "정답!" : "오답"}
                </div>
                <div className="mt-2 text-zinc-300">정답: <b>{ACTION_LABEL[current.action]}</b></div>
                <div className="mt-3 p-3 bg-zinc-800/50 rounded-lg text-sm text-zinc-200 max-w-md mx-auto">
                  <div className="font-semibold text-zinc-100 mb-1">💡 이유:</div>
                  <div>{current.reason}</div>
                </div>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button onClick={() => { if (quizCount > 1) { setQuizCount(quizCount-1); nextQuestion(); } else { setMode("chart"); } setGuess(null); }}
                          className="px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800">{quizCount>1?"다음":"끝내기"}</button>
                  <button onClick={resetQuiz} className="px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800">리셋</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Position explanation */}
        <div className="mt-6 p-4 bg-zinc-800/30 rounded-xl border border-zinc-700">
          <h3 className="text-lg font-semibold text-zinc-100 mb-3">📍 {position} 포지션 특징</h3>
          <div className="text-sm text-zinc-300 space-y-2">
            {position === "UTG" && (
              <div>
                <p><b>언더 더 건 (UTG)</b> - 가장 앞자리, 뒤에 6명이 남아있음</p>
                <p>• <span className="text-emerald-400">레이즈</span>: 최강 핸드만 (AA, KK, QQ, JJ, TT, AKs, AQs 등)</p>
                <p>• <span className="text-amber-400">믹스</span>: 애매한 핸드들 (KJs, QJs, AJo 등)</p>
                <p>• <span className="text-zinc-500">폴드</span>: 약한 핸드들은 멀티웨이 위험으로 폴드</p>
              </div>
            )}
            {position === "MP" && (
              <div>
                <p><b>미들 포지션 (MP)</b> - 중간 자리, 뒤에 4-5명이 남아있음</p>
                <p>• <span className="text-emerald-400">레이즈</span>: UTG보다 약간 더 넓은 범위</p>
                <p>• <span className="text-amber-400">믹스</span>: 중급 핸드들 (66, A9s, KQo 등)</p>
                <p>• <span className="text-zinc-500">폴드</span>: 여전히 약한 핸드들은 폴드</p>
              </div>
            )}
            {position === "CO" && (
              <div>
                <p><b>커터 오프 (CO)</b> - 버튼 바로 앞, 뒤에 2명만 남음</p>
                <p>• <span className="text-emerald-400">레이즈</span>: 스틸 기회가 많아 범위 확장</p>
                <p>• <span className="text-amber-400">믹스</span>: 약간 애매한 핸드들 (55, A8s, ATo 등)</p>
                <p>• <span className="text-zinc-500">폴드</span>: 정말 약한 핸드들만 폴드</p>
              </div>
            )}
            {position === "BTN" && (
              <div>
                <p><b>버튼 (BTN)</b> - 가장 좋은 포지션, 뒤에 2명만 남음</p>
                <p>• <span className="text-emerald-400">레이즈</span>: 스틸 기회 최대, 가장 넓은 범위</p>
                <p>• <span className="text-amber-400">믹스</span>: 정말 애매한 핸드들만 (KTo, QTo, JTo)</p>
                <p>• <span className="text-zinc-500">폴드</span>: 거의 모든 핸드가 레이즈 가치</p>
              </div>
            )}
            {position === "SB" && (
              <div>
                <p><b>스몰 블라인드 (SB)</b> - 버튼 다음, 뒤에 1명만 남음</p>
                <p>• <span className="text-emerald-400">레이즈</span>: BTN과 비슷하게 넓은 범위</p>
                <p>• <span className="text-zinc-500">폴드</span>: 정말 약한 핸드들만 폴드</p>
                <p>• 포지션 불리하지만 스틸 기회가 있어 범위 유지</p>
              </div>
            )}
            {position === "BB" && (
              <div>
                <p><b>빅 블라인드 (BB)</b> - 수비 포지션, 이미 돈을 넣은 상태</p>
                <p>• <span className="text-emerald-400">3-bet</span>: 최강 핸드들 (AA, KK, QQ, JJ, AKs)</p>
                <p>• <span className="text-indigo-400">콜</span>: 중급 핸드들 (TT, 99, AQs, AJs 등)</p>
                <p>• <span className="text-zinc-500">폴드</span>: 약한 핸드들은 폴드</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer tips */}
        <div className="mt-6 text-sm text-zinc-400 leading-relaxed">
          <p className="mb-1">※ v1 학습 팁: 먼저 <b>CO/BTN</b> 차트부터 암기 → 이후 UTG/MP로 확장 → 마지막으로 SB/BB 수비 범위를 익히세요.</p>
          <p>※ 고급: 이 컴포넌트의 <code>CHART_DATA</code>를 GTO 결과로 교체하거나, 포지션/상황(3-bet pot, vs 2.5x open 등)을 프리셋으로 추가해 보세요.</p>
        </div>
      </div>
    </div>
  );
}