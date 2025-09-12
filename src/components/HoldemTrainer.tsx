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

// Minimal beginner-friendly RFI/call chart (educational, not definitive GTO!)
// Each position maps hand -> action. Missing hands default to F.
//
// Legend:
// R = open/raise, C = call (mostly vs open in blinds), M = mix, F = fold
//
// TIP: Start strict; widen later as you gain confidence.
const CHART_DATA: Record<Position, Record<string, Action>> = {
  UTG: {
    "AA":"R","KK":"R","QQ":"R","JJ":"R","TT":"R","99":"R","88":"R","77":"R",
    "AKs":"R","AQs":"R","AJs":"R","ATs":"R","KQs":"R","KJs":"M","QJs":"M",
    "AKo":"R","AQo":"R","AJo":"M",
    "A5s":"M","A4s":"M","A3s":"M","A2s":"M"
  },
  MP: {
    "AA":"R","KK":"R","QQ":"R","JJ":"R","TT":"R","99":"R","88":"R","77":"R","66":"M",
    "AKs":"R","AQs":"R","AJs":"R","ATs":"R","A9s":"M","KQs":"R","KJs":"R","QJs":"R","JTs":"R",
    "AKo":"R","AQo":"R","AJo":"R","KQo":"M",
    "A5s":"M","A4s":"M","A3s":"M","A2s":"M"
  },
  CO: {
    "AA":"R","KK":"R","QQ":"R","JJ":"R","TT":"R","99":"R","88":"R","77":"R","66":"R","55":"M",
    "AKs":"R","AQs":"R","AJs":"R","ATs":"R","A9s":"R","A8s":"M","KQs":"R","KJs":"R","KTs":"R",
    "QJs":"R","QTs":"R","JTs":"R","T9s":"R","98s":"R",
    "AKo":"R","AQo":"R","AJo":"R","ATo":"M","KQo":"R","KJo":"M","QJo":"M"
  },
  BTN: {
    "AA":"R","KK":"R","QQ":"R","JJ":"R","TT":"R","99":"R","88":"R","77":"R","66":"R","55":"R","44":"R","33":"R","22":"R",
    "AKs":"R","AQs":"R","AJs":"R","ATs":"R","A9s":"R","A8s":"R","A7s":"R","A6s":"R","A5s":"R","A4s":"R","A3s":"R","A2s":"R",
    "KQs":"R","KJs":"R","KTs":"R","K9s":"R","QJs":"R","QTs":"R","JTs":"R","T9s":"R","98s":"R","87s":"R","76s":"R","65s":"R",
    "AKo":"R","AQo":"R","AJo":"R","ATo":"R","KQo":"R","KJo":"R","QJo":"R","KTo":"M","QTo":"M","JTo":"M"
  },
  SB: {
    // Small blind opening vs folds behind (complete/raise more mixed in practice)
    "AA":"R","KK":"R","QQ":"R","JJ":"R","TT":"R","99":"R","88":"R","77":"R","66":"R","55":"R","44":"R","33":"R","22":"R",
    "AKs":"R","AQs":"R","AJs":"R","ATs":"R","A9s":"R","A8s":"R","A7s":"R","A6s":"R","A5s":"R","A4s":"R","A3s":"R","A2s":"R",
    "KQs":"R","KJs":"R","KTs":"R","QJs":"R","QTs":"R","JTs":"R","T9s":"R","98s":"R","87s":"R","76s":"R","65s":"R",
    "AKo":"R","AQo":"R","AJo":"R","ATo":"R","KQo":"R","KJo":"R","QJo":"R"
  },
  BB: {
    // Big blind: lots of calling vs opens. Here we simplify to C/R/F vs an MP open.
    "AA":"R","KK":"R","QQ":"R","JJ":"R","TT":"C","99":"C","88":"C","77":"C","66":"C","55":"C",
    "AKs":"R","AQs":"C","AJs":"C","ATs":"C","A9s":"C","A8s":"C","A5s":"C","A4s":"C","A3s":"C","A2s":"C",
    "KQs":"C","KJs":"C","QJs":"C","JTs":"C","T9s":"C","98s":"C","87s":"C",
    "AKo":"R","AQo":"C","AJo":"C","KQo":"C"
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
  const [current, setCurrent] = useState<{hand: string; action: Action}>();
  const [guess, setGuess] = useState<Action | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [quizCount, setQuizCount] = useState(5);

  // All 13x13 matrix cells
  const matrix = useMemo(() => {
    const cells: { key: string; label: string; action: Action }[][] = [];
    for (let i = 0; i < RANKS.length; i++) {
      const row: { key: string; label: string; action: Action }[] = [];
      for (let j = 0; j < RANKS.length; j++) {
        const r1 = RANKS[i];
        const r2 = RANKS[j];
        const suited = i < j ? true : i > j ? false : null; // upper tri suited, lower off, diag pairs
        const code = codeHand(r1, r2, suited);
        const action = CHART_DATA[position][code] ?? "F";
        row.push({ key: code, label: code, action });
      }
      cells.push(row);
    }
    return cells;
  }, [position]);

  // Build a random drill question from current position distribution
  const nextQuestion = () => {
    // Weight non-folds slightly higher for learning
    const weights: [string, Action, number][] = [];
    for (const r1 of RANKS) {
      for (const r2 of RANKS) {
        const suited = RANKS.indexOf(r1) < RANKS.indexOf(r2) ? true : RANKS.indexOf(r1) > RANKS.indexOf(r2) ? false : null;
        const code = codeHand(r1, r2, suited);
        const action = CHART_DATA[position][code] ?? "F";
        const w = action === "F" ? 1 : action === "M" ? 2 : 3;
        weights.push([code, action, w]);
      }
    }
    const total = weights.reduce((s, x) => s + x[2], 0);
    let t = Math.random() * total;
    for (const [code, action, w] of weights) {
      if ((t -= w) <= 0) {
        setCurrent({ hand: code, action });
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
            <div className="grid grid-cols-14">
              <div className="sticky left-0 bg-zinc-900/80 backdrop-blur px-2 py-1 border-b border-zinc-800">핸드</div>
              {RANKS.map(r => (
                <div key={`top-${r}`} className="px-2 py-1 text-center text-xs font-semibold border-b border-zinc-800 bg-zinc-900/60">{r}</div>
              ))}
              {RANKS.map((row, i) => (
                <React.Fragment key={`row-${row}`}>
                  <div className="sticky left-0 bg-zinc-900/80 backdrop-blur px-2 py-1 text-xs font-semibold border-b border-zinc-800">{row}</div>
                  {matrix[i].map(cell => (
                    <div
                      key={cell.key}
                      title={`${cell.label} • ${ACTION_LABEL[cell.action]}`}
                      className={`h-9 text-[11px] flex items-center justify-center border-b border-r border-zinc-800 cursor-default ${ACTION_STYLE[cell.action]}`}
                    >{cell.label}</div>
                  ))}
                </React.Fragment>
              ))}
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
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button onClick={() => { if (quizCount > 1) { setQuizCount(quizCount-1); nextQuestion(); } else { setMode("chart"); } setGuess(null); }}
                          className="px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800">{quizCount>1?"다음":"끝내기"}</button>
                  <button onClick={resetQuiz} className="px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800">리셋</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer tips */}
        <div className="mt-6 text-sm text-zinc-400 leading-relaxed">
          <p className="mb-1">※ v1 학습 팁: 먼저 <b>CO/BTN</b> 차트부터 암기 → 이후 UTG/MP로 확장 → 마지막으로 SB/BB 수비 범위를 익히세요.</p>
          <p>※ 고급: 이 컴포넌트의 <code>CHART_DATA</code>를 GTO 결과로 교체하거나, 포지션/상황(3-bet pot, vs 2.5x open 등)을 프리셋으로 추가해 보세요.</p>
        </div>
      </div>
    </div>
  );
}