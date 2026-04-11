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

function LongDivisionProblem({ problem, showAnswer }: { problem: Problem; showAnswer: boolean }) {
  return (
    <div className="worksheet-problem flex flex-col border border-[#E0E7FF] rounded-xl p-4 bg-white min-h-[120px] justify-end">
      {showAnswer ? (
        <div className="font-mono text-xl font-bold text-[#059669] text-right mb-1 tabular-nums">
          {problem.correctAnswer} R{problem.remainder}
        </div>
      ) : (
        <div className="h-7 mb-1" aria-hidden="true" />
      )}
      <div className="flex items-stretch">
        <div className="font-mono text-2xl font-bold text-[#1E1B4B] border-r-2 border-b-2 border-[#1E1B4B] pr-2 pb-1 tabular-nums leading-tight self-end">
          {problem.operandB}
        </div>
        <div className="font-mono text-2xl font-bold text-[#1E1B4B] border-t-2 border-[#1E1B4B] pl-2 pt-1 flex-1 tabular-nums leading-tight">
          {problem.operandA}
        </div>
      </div>
    </div>
  );
}

function WorksheetProblem({ problem, showAnswer }: { problem: Problem; showAnswer: boolean }) {
  if (problem.remainder !== undefined) {
    return <LongDivisionProblem problem={problem} showAnswer={showAnswer} />;
  }

  const symbol = OP_SYMBOL[problem.operation];
  const answerText = String(problem.correctAnswer);

  return (
    <div className="worksheet-problem flex flex-col items-end border border-[#E0E7FF] rounded-xl p-4 bg-white min-h-[120px]">
      <div className="problem-inner flex flex-col items-end">
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

  function handlePrintWorksheet() {
    setShowAnswers(false);
    setTimeout(() => window.print(), 50);
  }

  function handlePrintAnswerKey() {
    setShowAnswers(true);
    setTimeout(() => {
      window.print();
      setShowAnswers(false);
    }, 50);
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
          <div className="print-only-header hidden print:block mb-5">
            <div className="flex items-end gap-2 text-sm text-[#1E1B4B] pb-2">
              <span>Name:</span>
              <div className="print-name-line" />
              <span className="ml-8">Date:</span>
              <div className="print-date-line" />
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
                onClick={handlePrintWorksheet}
                className="px-3 py-1.5 text-sm font-medium border border-[#4F46E5] text-[#4F46E5] rounded-lg hover:bg-[#EEF2FF] transition-all"
              >
                Print Worksheet
              </button>
              <button
                onClick={handlePrintAnswerKey}
                className="px-3 py-1.5 text-sm font-medium bg-[#4F46E5] text-white rounded-lg hover:bg-[#4338CA] transition-all"
              >
                Print Answer Key
              </button>
            </div>
          </div>

          {/* Problem grid */}
          <div className="grid grid-cols-4 gap-3 print:gap-4">
            {problems.map((problem, i) => (
              <WorksheetProblem
                key={problem.id}
                problem={problem}
                showAnswer={showAnswers}
              />
            ))}
          </div>

        </div>
      )}
    </div>
  );
}
