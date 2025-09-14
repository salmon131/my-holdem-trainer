import { RANKS } from './constants';

// 핸드 코드 생성 함수
export function codeHand(r1: string, r2: string, suited: boolean | null): string {
  if (r1 === r2) return `${r1}${r2}`; // pair e.g., 77
  const hi = RANKS.indexOf(r1 as any) < RANKS.indexOf(r2 as any) ? r1 : r2;
  const lo = hi === r1 ? r2 : r1;
  return `${hi}${lo}${suited === null ? "" : suited ? "s" : "o"}`; // AKs / AKo
}

// 랜덤 선택 함수
export function pick<T>(arr: T[]): T { 
  return arr[Math.floor(Math.random() * arr.length)]; 
}
