import React from 'react';
import { Button } from '../../shared/ui/Button/Button';
import type { Action } from '../../shared/lib/constants';

interface QuizCardProps {
  hand: string;
  action: Action;
  detailedReason: string;
  examples: string[];
  position: string;
  onAnswer: (answer: Action) => void;
  guess: Action | null;
  isCorrect: boolean | null;
  onNext: () => void;
  onReset?: () => void;
  quizCount?: number;
  score: { correct: number; total: number };
}

export const QuizCard: React.FC<QuizCardProps> = ({
  hand,
  action,
  detailedReason,
  examples,
  position,
  onAnswer,
  guess,
  isCorrect,
  onNext,
  onReset,
  quizCount,
  score
}) => {
  const actionButton = (actionType: Action, extra = "") => (
    <Button
      key={actionType}
      onClick={() => onAnswer(actionType)}
      variant="action"
      action={actionType}
      className={`${extra} ${guess ? 'opacity-50 cursor-not-allowed' : ''} text-sm sm:text-base px-2 sm:px-4 py-2 sm:py-2`}
      disabled={!!guess}
    >
      {actionType === 'R' ? 'Raise' : actionType === 'C' ? 'Call' : actionType === 'F' ? 'Fold' : 'Mix'}
    </Button>
  );

  return (
    <div className="rounded-2xl border border-zinc-800 p-4 sm:p-6 grid gap-4 sm:gap-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-zinc-400">Position</div>
          <div className="text-lg sm:text-xl font-semibold">{position}</div>
        </div>
        <div className="text-xs sm:text-sm text-zinc-400 text-right">
          점수: <span className="text-white font-semibold">{score.correct}</span> / {score.total}
          {quizCount && <div className="mt-1">• 남은 문제 {quizCount}</div>}
        </div>
      </div>

      <div className="text-center py-6 sm:py-8">
        <div className="text-zinc-400 mb-1">핸드</div>
        <div className="text-4xl sm:text-5xl font-extrabold tracking-tight">{hand}</div>
      </div>

      <div className="flex items-center justify-center gap-2 sm:gap-3">
        {actionButton("R", "flex-1 min-w-0")}
        {actionButton("C", "flex-1 min-w-0")}
        {actionButton("F", "flex-1 min-w-0")}
      </div>

      {guess && (
        <div className="text-center mt-4">
          <div className={`inline-block px-3 py-1 rounded-full text-sm ${
            isCorrect ? "bg-emerald-600" : "bg-rose-600"
          }`}>
            {isCorrect ? "정답!" : "오답"}
          </div>
          <div className="mt-2 text-zinc-300">정답: <b>{action === 'R' ? 'Raise' : action === 'C' ? 'Call' : action === 'F' ? 'Fold' : 'Mix'}</b></div>
          
          <div className="mt-4 p-3 sm:p-4 bg-zinc-800/50 rounded-lg text-xs sm:text-sm text-zinc-200 max-w-2xl mx-auto">
            <div className="font-semibold text-zinc-100 mb-2">💡 이유:</div>
            <div className="mb-3">{detailedReason}</div>
            <div className="font-semibold text-zinc-100 mb-2">📋 핵심 포인트:</div>
            <ul className="text-left space-y-1">
              {examples.map((example, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-emerald-400 mr-2">•</span>
                  <span>{example}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            <Button onClick={onNext} variant="secondary" className="text-sm px-3 sm:px-4 py-2">
              {quizCount && quizCount > 1 ? "다음" : "끝내기"}
            </Button>
            {onReset && (
              <Button onClick={onReset} variant="secondary" className="text-sm px-3 sm:px-4 py-2">
                리셋
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
