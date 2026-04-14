import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { PracticeConfig, Problem } from '@/engine/types';
import { generateProblemSet } from '@/engine/generator';

interface ConfigOption {
  label: string;
  config: PracticeConfig;
}

interface Props {
  configs: ConfigOption[];
}

const OP_SYMBOL: Record<string, string> = {
  addition: '+',
  subtraction: '−',
  multiplication: '×',
  division: '÷',
};

const COUNTS = [20, 30, 40] as const;
const LONG_DIVISION_COUNT = 12;
type Count = (typeof COUNTS)[number];

function LongDivisionProblem({ problem, showAnswer }: { problem: Problem; showAnswer: boolean }) {
  const dividendDigits = String(problem.operandA).length;

  return (
    <div className="worksheet-problem long-division-problem flex min-h-[220px] flex-col items-center justify-start rounded-xl border border-[#C7D2FE] bg-white px-4 py-5">
      <div className="long-division-figure inline-flex items-end font-mono text-[2rem] font-bold leading-none tabular-nums text-[#1E1B4B]">
        {/* Divisor — self-end keeps it vertically aligned with the dividend */}
        <span className="long-division-divisor self-end pr-3">{problem.operandB}</span>

        {/* Dividend column: answer sits directly above the bracket */}
        <div className="flex flex-col items-center">
          {showAnswer ? (
            <div className="long-division-answer mb-1 flex items-baseline gap-1 font-mono font-bold text-[#059669]">
              <span className="text-[1.75rem] leading-none">{problem.correctAnswer}</span>
              <span className="text-base leading-none">R{problem.remainder}</span>
            </div>
          ) : (
            <div className="long-division-answer-blank mb-1 h-9" aria-hidden="true" />
          )}
          <span
            className="long-division-dividend border-l-[3px] border-t-[3px] border-[#1E1B4B] pl-3 pr-1 pt-2"
            style={{ '--dividend-digits': dividendDigits } as CSSProperties}
          >
            {problem.operandA}
          </span>
        </div>
      </div>

      <div className="mt-5 h-10 w-full" aria-hidden="true" />
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
    <div className="worksheet-problem flex min-h-[120px] flex-col items-end rounded-xl border border-[#E0E7FF] bg-white p-4">
      <div className="problem-inner flex flex-col items-end">
        <div className="font-mono text-2xl font-bold tabular-nums text-[#1E1B4B]">{problem.operandA}</div>
        <div className="flex items-center gap-2 font-mono text-2xl font-bold tabular-nums text-[#1E1B4B]">
          <span className="text-[#4F46E5]">{symbol}</span>
          <span>{problem.operandB}</span>
        </div>
        <div className="mb-2 mt-1 w-full border-t-2 border-[#1E1B4B]" />
        {showAnswer ? (
          <div className="font-mono text-xl font-bold tabular-nums text-[#059669]">{answerText}</div>
        ) : (
          <div className="h-7" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

export default function WorksheetGenerator({ configs }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [count, setCount] = useState<Count>(20);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [showAnswers, setShowAnswers] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [printMode, setPrintMode] = useState<'worksheet' | 'answers' | null>(null);

  const selectedConfig = configs[selectedIndex]?.config;
  const isLongDivisionMode = Boolean(selectedConfig?.withRemainder);
  const effectiveCount = isLongDivisionMode ? LONG_DIVISION_COUNT : count;

  useEffect(() => {
    if (isLongDivisionMode && count !== COUNTS[0]) {
      setCount(COUNTS[0]);
    }
  }, [count, isLongDivisionMode]);

  function generate() {
    setProblems(generateProblemSet(selectedConfig, effectiveCount));
    setShowAnswers(false);
    setGenerated(true);
  }

  // Trigger print AFTER React has painted the new showAnswers state.
  // Double rAF guarantees the browser has committed the render to screen
  // before the print dialog opens — critical for mobile browsers.
  useEffect(() => {
    if (!printMode) return;
    let rafId: number;
    const handleAfterPrint = () => {
      setShowAnswers(false);
      setPrintMode(null);
    };
    window.addEventListener('afterprint', handleAfterPrint, { once: true });
    rafId = requestAnimationFrame(() => {
      rafId = requestAnimationFrame(() => {
        window.print();
      });
    });
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [printMode]);

  function handlePrintWorksheet() {
    setShowAnswers(false);
    setPrintMode('worksheet');
  }

  function handlePrintAnswerKey() {
    setShowAnswers(true);
    setPrintMode('answers');
  }

  return (
    <div className="space-y-6">
      <div className="no-print space-y-5 rounded-2xl border border-[#E0E7FF] bg-white p-5">
        <h2 className="text-base font-semibold text-[#1E1B4B]">Generate a Worksheet</h2>

        {configs.length > 1 && (
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              Difficulty / Type
            </label>
            <div className="flex flex-wrap gap-2">
              {configs.map((opt, i) => (
                <button
                  key={opt.label}
                  onClick={() => setSelectedIndex(i)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
                    selectedIndex === i
                      ? 'border-[#4F46E5] bg-[#4F46E5] text-white'
                      : 'border-[#E0E7FF] bg-white text-[#1E1B4B] hover:border-[#4F46E5]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
            Number of Problems
          </label>
          {isLongDivisionMode ? (
            <p className="rounded-lg border border-[#C7D2FE] bg-[#EEF2FF] px-3 py-2 text-sm font-medium text-[#3730A3]">
              Long Division worksheets use a classroom layout of {LONG_DIVISION_COUNT} problems (4 across × 3 down).
            </p>
          ) : (
            <div className="flex gap-2">
              {COUNTS.map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition-all ${
                    count === n
                      ? 'border-[#4F46E5] bg-[#4F46E5] text-white'
                      : 'border-[#E0E7FF] bg-white text-[#1E1B4B] hover:border-[#4F46E5]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={generate}
          className="w-full rounded-xl bg-[#4F46E5] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4338CA] sm:w-auto"
        >
          Generate Worksheet
        </button>
      </div>

      {generated && (
        <div className={`worksheet-area space-y-4 ${isLongDivisionMode ? 'long-division-mode' : ''}`}>
          <div className="print-only-header mb-3 hidden print:block">
            <div className="flex items-end gap-2 pb-3 text-sm text-[#1E1B4B]">
              <span>Name:</span>
              <div className="print-name-line" />
              <span className="ml-8">Date:</span>
              <div className="print-date-line" />
            </div>
          </div>

          <div className="no-print flex items-center justify-between">
            <p className="text-sm text-[#6B7280]">
              {effectiveCount} problems — <span className="font-medium text-[#1E1B4B]">{configs[selectedIndex].label}</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAnswers((v) => !v)}
                className="rounded-lg border border-[#E0E7FF] px-3 py-1.5 text-sm font-medium text-[#4F46E5] transition-all hover:border-[#4F46E5]"
              >
                {showAnswers ? 'Hide Answers' : 'Show Answer Key'}
              </button>
              <button
                onClick={handlePrintWorksheet}
                className="rounded-lg border border-[#4F46E5] px-3 py-1.5 text-sm font-medium text-[#4F46E5] transition-all hover:bg-[#EEF2FF]"
              >
                Print Worksheet
              </button>
              <button
                onClick={handlePrintAnswerKey}
                className="rounded-lg bg-[#4F46E5] px-3 py-1.5 text-sm font-medium text-white transition-all hover:bg-[#4338CA]"
              >
                Print Answer Key
              </button>
            </div>
          </div>

          <div
            className={`worksheet-grid grid ${
              isLongDivisionMode
                ? 'grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4 print:gap-0'
                : 'grid-cols-4 gap-3 print:gap-4'
            }`}
          >
            {problems.map((problem) => (
              <WorksheetProblem key={problem.id} problem={problem} showAnswer={showAnswers} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
