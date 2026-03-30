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

  return (
    <div
      className="select-none w-fit mx-auto min-w-[8rem]"
      aria-label={`What is ${problem.operandA} ${symbol} ${problem.operandB}?`}
    >
      {/* Row 1: operandA, right-aligned */}
      <div className="text-right">
        <span className="text-6xl md:text-7xl font-bold text-[#1E293B] tabular-nums">
          {problem.operandA}
        </span>
      </div>

      {/* Row 2: operator (left) + operandB (right) */}
      <div className="flex items-center justify-end gap-3">
        <span className="text-4xl font-semibold text-[#3B82F6]">
          {symbol}
        </span>
        <span className="text-6xl md:text-7xl font-bold text-[#1E293B] tabular-nums">
          {problem.operandB}
        </span>
      </div>

      {/* Rule */}
      <div className="border-t-[3px] border-[#1E293B] mt-2" />
    </div>
  );
}
