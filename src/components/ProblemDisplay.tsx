import { useEffect, useState } from 'react';
import type { Problem } from '@/engine/types';

const OP_SYMBOL: Record<string, string> = {
  addition: '+',
  subtraction: '−',
  multiplication: '×',
  division: '÷',
};

interface Props {
  problem: Problem;
}

export default function ProblemDisplay({ problem }: Props) {
  const symbol = OP_SYMBOL[problem.operation];
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(false);
    const animationFrameId = requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => cancelAnimationFrame(animationFrameId);
  }, [problem.operandA, problem.operandB, problem.operation]);

  return (
    <div
      className={`select-none w-fit mx-auto min-w-[8rem] transition-opacity duration-200 ease-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-label={`What is ${problem.operandA} ${symbol} ${problem.operandB}?`}
    >
      {/* Row 1: operandA, right-aligned */}
      <div className="text-right">
        <span className="text-5xl md:text-6xl font-bold text-[#1E293B] tabular-nums">
          {problem.operandA}
        </span>
      </div>

      {/* Row 2: operator (left) + operandB (right) */}
      <div className="flex items-center justify-end gap-3">
        <span className="text-4xl font-semibold text-[#3B82F6]">
          {symbol}
        </span>
        <span className="text-5xl md:text-6xl font-bold text-[#1E293B] tabular-nums">
          {problem.operandB}
        </span>
      </div>

      {/* Rule */}
      <div className="border-t-[3px] border-[#1E293B] mt-2" />
    </div>
  );
}
