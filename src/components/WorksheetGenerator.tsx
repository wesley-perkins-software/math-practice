import { useMemo, useState } from 'react';
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

function formatAnswer(problem: Problem) {
  return problem.remainder !== undefined
    ? `${problem.correctAnswer} R${problem.remainder}`
    : String(problem.correctAnswer);
}

function getPrintDensityClass(count: Count) {
  if (count === 20) return 'worksheet-density-20';
  if (count === 30) return 'worksheet-density-30';
  return 'worksheet-density-40';
}

function WorksheetProblem({ problem, index }: { problem: Problem; index: number }) {
  const symbol = OP_SYMBOL[problem.operation];

  return (
    <div className="worksheet-problem rounded-xl border border-[#E0E7FF] bg-white p-3.5 print:rounded-none print:border-none print:bg-transparent print:p-0">
      <div className="mb-2 text-xs font-semibold text-[#6366F1] print:mb-1 print:text-[10px] print:text-black">{index + 1}.</div>
      <div className="worksheet-problem-stack flex flex-col items-end text-[#1E1B4B]">
        <div className="font-mono text-2xl font-bold leading-tight tabular-nums print:text-[24px]">{problem.operandA}</div>
        <div className="font-mono text-2xl font-bold leading-tight tabular-nums print:text-[24px]">
          <span className="mr-2">{symbol}</span>
          <span>{problem.operandB}</span>
        </div>
        <div className="mt-1 h-[2px] w-full bg-[#1E1B4B] print:mt-1.5" />
        <div className="worksheet-answer-space mt-2 h-9 w-full print:mt-1" aria-hidden="true" />
      </div>
    </div>
  );
}

export default function WorksheetGenerator({ configs, title = 'Worksheet Generator' }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [count, setCount] = useState<Count>(20);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [showAnswerKeyPreview, setShowAnswerKeyPreview] = useState(false);
  const [includeAnswerKeyInPrint, setIncludeAnswerKeyInPrint] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string>('');

  const selectedLabel = configs[selectedIndex]?.label ?? '';

  const worksheetHeading = useMemo(
    () => `${selectedLabel} ${title}`.replace(/\s+/g, ' ').trim(),
    [selectedLabel, title],
  );

  function generate() {
    const { config } = configs[selectedIndex];
    setProblems(generateProblemSet(config, count));
    setGeneratedAt(new Date().toLocaleDateString());
  }

  function handlePrint() {
    window.print();
  }

  const hasWorksheet = problems.length > 0;
  const printDensityClass = getPrintDensityClass(count);

  return (
    <section className="space-y-6">
      <div className="no-print rounded-2xl border border-[#E0E7FF] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[#1E1B4B]">Build your worksheet</h2>
        <p className="mt-1 text-sm text-[#6B7280]">Choose worksheet options, generate problems, then print.</p>

        <div className="mt-5 space-y-5">
          <fieldset>
            <legend className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              Worksheet Type
            </legend>
            <div className="flex flex-wrap gap-2">
              {configs.map((opt, i) => (
                <button
                  key={opt.label}
                  onClick={() => setSelectedIndex(i)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                    selectedIndex === i
                      ? 'border-[#4338CA] bg-[#EEF2FF] text-[#312E81] ring-2 ring-[#C7D2FE]'
                      : 'border-[#E0E7FF] bg-white text-[#1E1B4B] hover:border-[#4F46E5]'
                  }`}
                  aria-pressed={selectedIndex === i}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              Problem Count
            </legend>
            <div className="flex flex-wrap gap-2">
              {COUNTS.map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                    count === n
                      ? 'border-[#4338CA] bg-[#EEF2FF] text-[#312E81] ring-2 ring-[#C7D2FE]'
                      : 'border-[#E0E7FF] bg-white text-[#1E1B4B] hover:border-[#4F46E5]'
                  }`}
                  aria-pressed={count === n}
                >
                  {n}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={generate}
              className="rounded-xl bg-[#4F46E5] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4338CA]"
            >
              Generate Worksheet
            </button>
            {hasWorksheet && (
              <>
                <button
                  onClick={handlePrint}
                  className="rounded-xl border border-[#4F46E5] px-5 py-2.5 text-sm font-semibold text-[#4F46E5] transition-colors hover:bg-[#EEF2FF]"
                >
                  Print Worksheet
                </button>
                <label className="inline-flex items-center gap-2 rounded-lg border border-[#E0E7FF] bg-[#FAFAFF] px-3 py-2 text-sm text-[#312E81]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#4F46E5]"
                    checked={includeAnswerKeyInPrint}
                    onChange={(event) => setIncludeAnswerKeyInPrint(event.target.checked)}
                  />
                  Include answer key when printing
                </label>
                <button
                  onClick={() => setShowAnswerKeyPreview((value) => !value)}
                  className="rounded-lg border border-[#E0E7FF] px-3 py-2 text-sm font-medium text-[#4F46E5] transition-colors hover:border-[#4F46E5]"
                >
                  {showAnswerKeyPreview ? 'Hide answer key preview' : 'Show answer key preview'}
                </button>
              </>
            )}
          </div>

          {hasWorksheet && (
            <p className="text-xs text-[#6B7280]">
              Printing includes only the worksheet and optional answer key. Site navigation and controls are excluded.
            </p>
          )}
        </div>
      </div>

      {hasWorksheet && (
        <div className="worksheet-print-root space-y-6">
          <article className={`worksheet-page rounded-2xl border border-[#E0E7FF] bg-white p-5 shadow-sm print:p-0 print:shadow-none ${printDensityClass}`}>
            <header className="worksheet-header border-b border-[#CBD5E1] pb-3 print:pb-2">
              <h3 className="text-xl font-bold text-[#1E1B4B] print:text-[20px] print:text-black">{worksheetHeading}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#475569] print:text-[12px] print:text-black">
                <span>{count} Problems</span>
                <span>Type: {selectedLabel}</span>
                {generatedAt && <span>Generated: {generatedAt}</span>}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm text-[#334155] print:mt-2 print:text-[12px] print:text-black">
                <span>Name: ______________________________</span>
                <span>Date: __________________</span>
              </div>
              <p className="mt-2 text-sm text-[#64748B] print:text-[12px] print:text-black">Solve each problem. Show your work when needed.</p>
            </header>

            <div className="worksheet-grid mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 print:mt-3 print:grid-cols-4 print:gap-x-6 print:gap-y-4">
              {problems.map((problem, i) => (
                <WorksheetProblem key={problem.id} problem={problem} index={i} />
              ))}
            </div>
          </article>

          <section className="worksheet-answer-key rounded-2xl border border-[#E0E7FF] bg-white p-5 shadow-sm print:shadow-none">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-[#1E1B4B] print:text-[18px] print:text-black">Answer Key</h4>
              <span className="text-xs font-medium uppercase tracking-wide text-[#6366F1] print:text-[11px] print:text-black">Match by problem number</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-[#1E293B] sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-4 print:gap-x-5 print:gap-y-1 print:text-[12px] print:text-black">
              {problems.map((problem, index) => (
                <div key={`${problem.id}-answer`} className="font-mono tabular-nums">
                  <span className="font-semibold">{index + 1}.</span> {formatAnswer(problem)}
                </div>
              ))}
            </div>
          </section>

          {!showAnswerKeyPreview && (
            <p className="no-print text-sm text-[#6B7280]">
              Answer key is hidden in preview. Use “Show answer key preview” or print with “Include answer key when printing”.
            </p>
          )}
        </div>
      )}

      {hasWorksheet && !showAnswerKeyPreview && (
        <style>{`.worksheet-answer-key { display: none; }`}</style>
      )}

      {hasWorksheet && (
        <style>{`
          @media print {
            .worksheet-answer-key {
              display: ${includeAnswerKeyInPrint ? 'block' : 'none'} !important;
              break-before: page;
              page-break-before: always;
            }
          }
        `}</style>
      )}
    </section>
  );
}
