import { useMemo, useState, useEffect } from "react";
import { POSITIONS, RANKS, type Action } from "../../shared/lib/constants";
import { codeHand } from "../../shared/lib/utils";
import type { MatrixCell } from "../../entities/chart/types";
import { CHART_DATA } from "../../entities/chart/data";
import { ChartTable } from "../../features/chart/ChartTable";
import { QuizCard } from "../../features/quiz/QuizCard";
import { Button } from "../../shared/ui/Button/Button";

export default function HoldemTrainer() {
  const [position, setPosition] = useState<"UTG" | "MP" | "CO" | "BTN" | "SB" | "BB">("CO");
  const [mode, setMode] = useState<"chart" | "flash" | "quiz">("chart");

  // Flash/Quiz state
  const [current, setCurrent] = useState<{hand: string; action: Action; detailedReason: string; examples: string[]}>();
  const [guess, setGuess] = useState<Action | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [quizCount, setQuizCount] = useState(5);
  
  // Chart state
  const [selectedCell, setSelectedCell] = useState<MatrixCell | null>(null);

  // All 13x13 matrix cells
  const matrix = useMemo(() => {
    const cells: MatrixCell[][] = [];
    for (let i = 0; i < RANKS.length; i++) {
      const row: MatrixCell[] = [];
      for (let j = 0; j < RANKS.length; j++) {
        const r1 = RANKS[i];
        const r2 = RANKS[j];
        const suited = i < j ? true : i > j ? false : null;
        const code = codeHand(r1, r2, suited);
        const entry = CHART_DATA[position][code] ?? { 
          action: "F", 
          reason: "폴드. 이 핸드는 이 포지션에서 플레이하기에 너무 약함.",
          detailedReason: "이 핸드는 현재 포지션에서 플레이하기에 너무 약합니다. 더 강한 핸드로 기다리는 것이 좋습니다.",
          examples: ["더 강한 핸드로 기다리기", "포지션에 맞는 핸드 선택하기"]
        };
        row.push({ 
          key: code, 
          label: code, 
          action: entry.action, 
          reason: entry.reason,
          detailedReason: entry.detailedReason,
          examples: entry.examples
        });
      }
      cells.push(row);
    }
    return cells;
  }, [position]);

  // Build a random drill question from current position distribution
  const nextQuestion = () => {
    const weights: [string, Action, string, string, string[], number][] = [];
    for (const r1 of RANKS) {
      for (const r2 of RANKS) {
        const suited = RANKS.indexOf(r1) < RANKS.indexOf(r2) ? true : RANKS.indexOf(r1) > RANKS.indexOf(r2) ? false : null;
        const code = codeHand(r1, r2, suited);
        const entry = CHART_DATA[position][code] ?? { 
          action: "F", 
          reason: "폴드. 이 핸드는 이 포지션에서 플레이하기에 너무 약함.",
          detailedReason: "이 핸드는 현재 포지션에서 플레이하기에 너무 약합니다.",
          examples: ["더 강한 핸드로 기다리기"]
        };
        const w = entry.action === "F" ? 1 : entry.action === "M" ? 2 : 3;
        weights.push([code, entry.action, entry.reason, entry.detailedReason, entry.examples, w]);
      }
    }
    const total = weights.reduce((s, x) => s + x[5], 0);
    let t = Math.random() * total;
    for (const [code, action, , detailedReason, examples, w] of weights) {
      if ((t -= w) <= 0) {
        setCurrent({ hand: code, action, detailedReason, examples });
        setGuess(null);
        return;
      }
    }
  };

  useEffect(() => { if (mode !== "chart") nextQuestion(); }, [mode, position]);

  const submitGuess = (a: Action) => {
    if (!current) return;
    if (guess) return;
    setGuess(a);
    const ok = a === current.action || (current.action === "M" && (a === "R" || a === "C"));
    setScore(s => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }));
  };

  const resetQuiz = () => { 
    setScore({ correct: 0, total: 0 }); 
    setQuizCount(5); 
    nextQuestion(); 
  };

  // Reset selected cell when position changes
  useEffect(() => {
    setSelectedCell(null);
  }, [position]);

  const isCorrect = guess ? (guess === current?.action || (current?.action === "M" && (guess === "R" || guess === "C"))) : null;

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Holdem Chart Trainer</h1>
            <p className="text-zinc-400">차트 암기 & 기본기 연습용 미니 웹앱 (v2)</p>
          </div>
          <div className="flex gap-2">
            {(["chart","flash","quiz"] as const).map(m => (
              <Button
                key={m}
                onClick={() => setMode(m)}
                variant={mode === m ? "primary" : "secondary"}
              >
                {m === "chart" ? "Chart" : m === "flash" ? "Flashcards" : "Quick Quiz"}
              </Button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <span className="text-zinc-400">Position</span>
          <div className="flex flex-wrap gap-2">
            {POSITIONS.map(p => (
              <Button
                key={p}
                onClick={() => setPosition(p as any)}
                variant={position === p ? "primary" : "secondary"}
                className={`px-3 py-1.5 text-sm ${position === p ? "border-emerald-400 bg-emerald-900/30" : ""}`}
              >
                {p}
              </Button>
            ))}
          </div>
          <div className="ml-auto text-sm text-zinc-400 flex items-center gap-3">
            <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-emerald-500" />Raise</span>
            <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-indigo-500" />Call</span>
            <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-amber-500" />Mix</span>
            <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-zinc-700" />Fold</span>
          </div>
        </div>

        {/* Position explanation - moved above chart */}
        <div className="mb-6 p-4 bg-zinc-800/30 rounded-xl border border-zinc-700">
          <h3 className="text-lg font-semibold text-zinc-100 mb-3">📍 {position} 포지션 특징</h3>
          <div className="text-sm text-zinc-300 space-y-2">
            {position === "UTG" && (
              <div>
                <p><b>언더 더 건 (UTG)</b> - 가장 앞자리, 뒤에 6명이 남아있음</p>
                <p>• <span className="text-emerald-400">레이즈</span>: 최강 핸드만 (AA, KK, QQ, JJ, TT, AKs, AQs 등)</p>
                <p>• <span className="text-amber-400">믹스</span>: 애매한 핸드들 (KJs, QJs, AJo 등)</p>
                <p>• <span className="text-zinc-500">폴드</span>: 약한 핸드들은 멀티웨이 위험으로 폴드</p>
                <p className="mt-2 text-zinc-400">💡 <b>핵심:</b> 뒤에 많은 사람이 남아있어서 최강 핸드만 플레이. 멀티웨이 위험 때문에 범위가 좁음.</p>
              </div>
            )}
            {position === "MP" && (
              <div>
                <p><b>미들 포지션 (MP)</b> - 중간 자리, 뒤에 4-5명이 남아있음</p>
                <p>• <span className="text-emerald-400">레이즈</span>: UTG보다 약간 더 넓은 범위</p>
                <p>• <span className="text-amber-400">믹스</span>: 중급 핸드들 (66, A9s, KQo 등)</p>
                <p>• <span className="text-zinc-500">폴드</span>: 여전히 약한 핸드들은 폴드</p>
                <p className="mt-2 text-zinc-400">💡 <b>핵심:</b> UTG보다는 넓지만 여전히 조심스럽게 플레이. 중급 핸드들도 상황에 따라 플레이.</p>
              </div>
            )}
            {position === "CO" && (
              <div>
                <p><b>커터 오프 (CO)</b> - 버튼 바로 앞, 뒤에 2명만 남음</p>
                <p>• <span className="text-emerald-400">레이즈</span>: 스틸 기회가 많아 범위 확장</p>
                <p>• <span className="text-amber-400">믹스</span>: 약간 애매한 핸드들 (55, A8s, ATo 등)</p>
                <p>• <span className="text-zinc-500">폴드</span>: 정말 약한 핸드들만 폴드</p>
                <p className="mt-2 text-zinc-400">💡 <b>핵심:</b> 스틸 기회가 많아서 범위가 넓어짐. A5s 같은 핸드도 레이즈 가능.</p>
              </div>
            )}
            {position === "BTN" && (
              <div>
                <p><b>버튼 (BTN)</b> - 가장 좋은 포지션, 뒤에 2명만 남음</p>
                <p>• <span className="text-emerald-400">레이즈</span>: 스틸 기회 최대, 가장 넓은 범위</p>
                <p>• <span className="text-amber-400">믹스</span>: 정말 애매한 핸드들만 (KTo, QTo, JTo)</p>
                <p>• <span className="text-zinc-500">폴드</span>: 거의 모든 핸드가 레이즈 가치</p>
                <p className="mt-2 text-zinc-400">💡 <b>핵심:</b> 가장 좋은 포지션이라서 거의 모든 핸드 레이즈. 98s 같은 핸드도 레이즈 가능.</p>
              </div>
            )}
            {position === "SB" && (
              <div>
                <p><b>스몰 블라인드 (SB)</b> - 버튼 다음, 뒤에 1명만 남음</p>
                <p>• <span className="text-emerald-400">레이즈</span>: BTN과 비슷하게 넓은 범위</p>
                <p>• <span className="text-zinc-500">폴드</span>: 정말 약한 핸드들만 폴드</p>
                <p className="mt-2 text-zinc-400">💡 <b>핵심:</b> 포지션은 불리하지만 스틸 기회가 있어서 범위 유지. BB만 남아있어서 위험 낮음.</p>
              </div>
            )}
            {position === "BB" && (
              <div>
                <p><b>빅 블라인드 (BB)</b> - 수비 포지션, 이미 돈을 넣은 상태</p>
                <p>• <span className="text-emerald-400">3-bet</span>: 최강 핸드들 (AA, KK, QQ, JJ, AKs)</p>
                <p>• <span className="text-indigo-400">콜</span>: 중급 핸드들 (TT, 99, AQs, AJs 등)</p>
                <p>• <span className="text-zinc-500">폴드</span>: 약한 핸드들은 폴드</p>
                <p className="mt-2 text-zinc-400">💡 <b>핵심:</b> 이미 돈을 넣은 상태라서 콜할 수 있는 핸드가 많음. 3-bet은 최강 핸드만.</p>
              </div>
            )}
          </div>
        </div>

        {/* Modes */}
        {mode === "chart" && <ChartTable matrix={matrix} selectedCell={selectedCell} onCellClick={setSelectedCell} />}

        {/* Selected cell explanation */}
        {mode === "chart" && selectedCell && (
          <div className="mt-6 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
            <h3 className="text-lg font-semibold text-zinc-100 mb-3">🎯 {selectedCell.label} 핸드 분석</h3>
            <div className="text-sm text-zinc-300 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">액션:</span>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  selectedCell.action === 'R' ? 'bg-emerald-500/80 text-white' :
                  selectedCell.action === 'C' ? 'bg-indigo-500/80 text-white' :
                  selectedCell.action === 'F' ? 'bg-zinc-700/70 text-white' :
                  'bg-amber-500/80 text-white'
                }`}>
                  {selectedCell.action === 'R' ? 'Raise' : 
                   selectedCell.action === 'C' ? 'Call' : 
                   selectedCell.action === 'F' ? 'Fold' : 'Mix'}
                </span>
                <span className="text-zinc-400">•</span>
                <span className="text-zinc-300">{selectedCell.reason}</span>
              </div>
              
              <div>
                <div className="font-semibold text-zinc-100 mb-2">💡 상세 이유:</div>
                <div className="text-zinc-300">{selectedCell.detailedReason}</div>
              </div>
              
              <div>
                <div className="font-semibold text-zinc-100 mb-2">📋 핵심 포인트:</div>
                <ul className="text-zinc-300 space-y-1">
                  {selectedCell.examples.map((example, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-emerald-400 mr-2">•</span>
                      <span>{example}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {mode === "flash" && current && (
          <QuizCard
            hand={current.hand}
            action={current.action}
            detailedReason={current.detailedReason}
            examples={current.examples}
            position={position}
            onAnswer={submitGuess}
            guess={guess}
            isCorrect={isCorrect}
            onNext={nextQuestion}
            score={score}
          />
        )}

        {mode === "quiz" && current && (
          <QuizCard
            hand={current.hand}
            action={current.action}
            detailedReason={current.detailedReason}
            examples={current.examples}
            position={position}
            onAnswer={submitGuess}
            guess={guess}
            isCorrect={isCorrect}
            onNext={() => { 
              if (quizCount > 1) { 
                setQuizCount(quizCount-1); 
                nextQuestion(); 
              } else { 
                setMode("chart"); 
              } 
              setGuess(null); 
            }}
            onReset={resetQuiz}
            quizCount={quizCount}
            score={score}
          />
        )}


        {/* Footer tips */}
        <div className="mt-6 text-sm text-zinc-400 leading-relaxed">
          <p className="mb-1">※ v2 학습 팁: 먼저 <b>CO/BTN</b> 차트부터 암기 → 이후 UTG/MP로 확장 → 마지막으로 SB/BB 수비 범위를 익히세요.</p>
          <p>※ 고급: 이 컴포넌트의 <code>CHART_DATA</code>를 GTO 결과로 교체하거나, 포지션/상황(3-bet pot, vs 2.5x open 등)을 프리셋으로 추가해 보세요.</p>
        </div>
      </div>
    </div>
  );
}
