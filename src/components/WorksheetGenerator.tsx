import { useState } from 'react';
import type { PracticeConfig, Problem } from '@/engine/types';
import { generateProblemSet } from '@/engine/generator';

interface ConfigOption {
  label: string;
  config: PracticeConfig;
}

interface Props {
  configs: ConfigOption[];
  title?: string;
}

const OP_SYMBOL: Record<string, string> = {
  addition: '+',
  subtraction: '−',
  multiplication: '×',
  division: '÷',
};

const COUNTS = [20, 30, 40] as const;
type Count = (typeof COUNTS)[number];

function WorksheetProblem({ problem, index, showAnswer }: { problem: Problem; index: number; showAnswer: boolean }) {
  const symbol = OP_SYMBOL[problem.operation];
  const answerText = problem.remainder !== undefined
    ? `${problem.correctAnswer} R${problem.remainder}`
    : String(problem.correctAnswer);

  return (
    <div className="worksheet-problem flex flex-col items-end border border-[#E0E7FF] rounded-xl p-4 bg-white min-h-[120px]">
      <div className="text-xs text-[#A5B4FC] font-medium self-start mb-1">{index + 1}.</div>
      <div className="font-mono text-2xl font-bold text-[#1E1B4B] tabular-nums">{problem.operandA}</div>
      <div className="font-mono text-2xl font-bold text-[#1E1B4B] tabular-nums flex items-center gap-2">
        <span className="text-[#4F46E5]">{symbol}</span>
        <span>{problem.operandB}</span>
      </div>
      <div className="border-t-2 border-[#1E1B4B] w-full mt-1 mb-2" />
      {showAnswer ? (
        <div className="font-mono text-xl font-bold text-[#059669] tabular-nums">{answerText}</div>
      ) : (
        <div className="h-7" aria-hidden="true" />
      )}
    </div>
  );
}

export default function WorksheetGenerator({ configs, title = 'Worksheet Generator' }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [count, setCount] = useState<Count>(20);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [showAnswers, setShowAnswers] = useState(false);
  const [generated, setGenerated] = useState(false);

  function generate() {
    const { config } = configs[selectedIndex];
    setProblems(generateProblemSet(config, count));
    setShowAnswers(false);
    setGenerated(true);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-6">
      {/* Controls panel — hidden when printing */}
      <div className="no-print bg-white border border-[#E0E7FF] rounded-2xl p-5 space-y-5">
        <h2 className="text-base font-semibold text-[#1E1B4B]">Generate a Worksheet</h2>

        {/* Config selector */}
        <div>
          <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">
            Difficulty / Type
          </label>
          <div className="flex flex-wrap gap-2">
            {configs.map((opt, i) => (
              <button
                key={opt.label}
                onClick={() => setSelectedIndex(i)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  selectedIndex === i
                    ? 'bg-[#4F46E5] text-white border-[#4F46E5]'
                    : 'bg-white text-[#1E1B4B] border-[#E0E7FF] hover:border-[#4F46E5]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Problem count */}
        <div>
          <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">
            Number of Problems
          </label>
          <div className="flex gap-2">
            {COUNTS.map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  count === n
                    ? 'bg-[#4F46E5] text-white border-[#4F46E5]'
                    : 'bg-white text-[#1E1B4B] border-[#E0E7FF] hover:border-[#4F46E5]'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={generate}
          className="w-full sm:w-auto px-6 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold rounded-xl text-sm transition-colors"
        >
          Generate Worksheet
        </button>
      </div>

      {/* Worksheet area — shown on screen and when printing */}
      {generated && (
        <div className="worksheet-area space-y-4">
          {/* Worksheet header — print only */}
          <div className="print-only-header hidden print:block mb-4">
            <div className="flex gap-10 text-sm text-[#1E1B4B] border-b-2 border-[#1E1B4B] pb-2">
              <span>Name: ____________________________</span>
              <span>Date: ________________</span>
            </div>
          </div>

          {/* Screen-only toolbar */}
          <div className="no-print flex items-center justify-between">
            <p className="text-sm text-[#6B7280]">
              {count} problems — <span className="font-medium text-[#1E1B4B]">{configs[selectedIndex].label}</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAnswers((v) => !v)}
                className="px-3 py-1.5 text-sm font-medium border border-[#E0E7FF] rounded-lg text-[#4F46E5] hover:border-[#4F46E5] transition-all"
              >
                {showAnswers ? 'Hide Answers' : 'Show Answer Key'}
              </button>
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 text-sm font-medium bg-[#4F46E5] text-white rounded-lg hover:bg-[#4338CA] transition-all"
              >
                Print
              </button>
            </div>
          </div>

          {/* Problem grid */}
          <div className="grid grid-cols-4 gap-3 print:gap-4">
            {problems.map((problem, i) => (
              <WorksheetProblem
                key={problem.id}
                problem={problem}
                index={i}
                showAnswer={showAnswers}
              />
            ))}
          </div>

          {/* Print answer key — always shown when printing if answers toggled, or as separate section */}
          <div className="no-print mt-6 border-t border-[#E0E7FF] pt-4">
            <p className="text-xs text-[#A5B4FC] text-center">
              Click <strong>Show Answer Key</strong> then <strong>Print</strong> to include answers on the printout.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
