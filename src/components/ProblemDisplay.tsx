import { useEffect, useMemo, useState } from 'react';
import type { Problem } from '@/engine/types';

const OP_SYMBOL: Record<string, string> = {
  addition: '+',
  subtraction: '−',
  multiplication: '×',
  division: '÷',
};

type AnswerFeedbackState = 'correct' | 'incorrect' | 'idle';

interface Props {
  problem: Problem;
  answerValue?: string;
  answerFeedbackState?: AnswerFeedbackState;
  answerMaxDigits?: number;
  showAlignedAnswer?: boolean;
}

export default function ProblemDisplay({
  problem,
  answerValue = '',
  answerFeedbackState = 'idle',
  answerMaxDigits = 3,
  showAlignedAnswer = false,
}: Props) {
  const symbol = OP_SYMBOL[problem.operation];
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(false);
    const animationFrameId = requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => cancelAnimationFrame(animationFrameId);
  }, [problem.operandA, problem.operandB, problem.operation]);

  const columnCount = useMemo(() => {
    if (!showAlignedAnswer) return 1;
    return Math.max(
      String(problem.operandA).length,
      String(problem.operandB).length,
      answerMaxDigits,
    );
  }, [answerMaxDigits, problem.operandA, problem.operandB, showAlignedAnswer]);

  const displayAnswer = answerValue.slice(-columnCount).padStart(columnCount, '·');

  const alignedAnswerStateStyles =
    answerFeedbackState === 'correct'
      ? 'border-[#22C55E] bg-[#F0FDF4] ring-[3px] ring-[#22C55E]/25'
      : answerFeedbackState === 'incorrect'
      ? 'border-[#EF4444] bg-[#FEF2F2] ring-[3px] ring-[#EF4444]/20'
      : answerValue.length > 0
      ? 'border-[#60A5FA] bg-[#F8FAFC] ring-[3px] ring-[#3B82F6]/15'
      : 'border-[#CBD5E1] bg-white';

  return (
    <div
      className={`select-none w-fit mx-auto min-w-[8rem] transition-opacity duration-200 ease-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-label={`What is ${problem.operandA} ${symbol} ${problem.operandB}?`}
    >
      <div className="text-right">
        <span className="text-5xl md:text-6xl font-bold text-[#1E293B] tabular-nums">
          {problem.operandA}
        </span>
      </div>

      <div className="flex items-center justify-end gap-3">
        <span className="text-4xl font-semibold text-[#3B82F6]">
          {symbol}
        </span>
        <span className="text-5xl md:text-6xl font-bold text-[#1E293B] tabular-nums">
          {problem.operandB}
        </span>
      </div>

      <div className="border-t-[3px] border-[#1E293B] mt-2" />

      {showAlignedAnswer && (
        <div
          className={`mt-2 rounded-lg border-2 px-3 py-1.5 transition-all duration-150 ${alignedAnswerStateStyles}`}
          aria-live="polite"
          aria-label="Your entered answer"
        >
          <div className="text-right text-5xl md:text-6xl font-bold tabular-nums tracking-[0.06em] text-[#1E293B]">
            {displayAnswer.split('').map((char, idx) => (
              <span key={`${char}-${idx}`} className={char === '·' ? 'text-[#CBD5E1]' : ''}>
                {char}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
