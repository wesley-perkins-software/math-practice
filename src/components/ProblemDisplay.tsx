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
    <div className="flex items-center justify-center gap-3 select-none" aria-label={`What is ${problem.operandA} ${symbol} ${problem.operandB}?`}>
      <span className="text-6xl md:text-7xl font-bold text-[#1E293B] tabular-nums">
        {problem.operandA}
      </span>
      <span className="text-5xl md:text-6xl font-light text-[#64748B]">
        {symbol}
      </span>
      <span className="text-6xl md:text-7xl font-bold text-[#1E293B] tabular-nums">
        {problem.operandB}
      </span>
      <span className="text-5xl md:text-6xl font-light text-[#64748B]">=</span>
      <span className="text-5xl md:text-6xl font-bold text-[#3B82F6]">?</span>
    </div>
  );
}
