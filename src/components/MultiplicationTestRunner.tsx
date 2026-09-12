import { useEffect, useMemo, useRef, useState } from 'react';
import PracticeWidget from './PracticeWidget';
import TestResultsCard from './TestResultsCard';
import { MULTIPLICATION_FACTS } from '@/engine/presets';
import {
  DEFAULT_MULTIPLICATION_TEST_CONFIG,
  MULTIPLICATION_TEST_QUESTION_COUNTS,
  buildMultiplicationTestResult,
  buildMultiplicationTestRuntimeConfig,
  createMultiplicationTestSeed,
  buildMultiplicationTestProblems,
  deriveMultiplicationTestSelectionScope,
  normalizeMultiplicationTestConfig,
  parseMultiplicationTestQuery,
  serializeMultiplicationTestQuery,
  type MultiplicationTestConfig,
  type MultiplicationTestQuestionCount,
  type MultiplicationTestResult,
} from '@/engine/multiplicationTest';
import { trackMultiplicationTestEvent } from '@/lib/multiplicationTestAnalytics';
import type { Problem, QuestionCount, SessionResult } from '@/engine/types';

const ALL_TABLES = Array.from({ length: 12 }, (_, i) => i + 1);

type Phase = 'config' | 'active' | 'complete' | 'missed-practice';

function FactsGrid({ selected, onChange }: { selected: readonly number[]; onChange: (values: number[]) => void }) {
  const toggle = (value: number) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };
  return (
    <fieldset className="border-0 p-0 m-0">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <legend className="static block text-sm font-semibold text-[#211D4F]">Choose tables</legend>
        <div className="flex gap-3">
          <button type="button" className="text-xs font-semibold text-[#4F46E5] hover:text-[#3E35C7]" onClick={() => onChange(ALL_TABLES)}>Select all</button>
          <button type="button" className="text-xs font-semibold text-[#4F46E5] hover:text-[#3E35C7]" onClick={() => onChange([])}>Clear all</button>
        </div>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {ALL_TABLES.map((value) => {
          const checked = selected.includes(value);
          return (
            <button
              key={value}
              type="button"
              aria-pressed={checked}
              onClick={() => toggle(value)}
              className={`min-h-[44px] rounded-lg border text-sm font-bold transition-all ${
                checked ? 'border-[#4F46E5] bg-[#F5F3FF] text-[#211D4F]' : 'border-[#D8D4EE] bg-white text-[#211D4F] hover:border-[#4F46E5]'
              }`}
            >
              {value}
              <span className="sr-only">{checked ? ' selected' : ' not selected'}</span>
            </button>
          );
        })}
      </div>
      {selected.length === 0 && <p className="mt-2 text-sm font-semibold text-red-700" role="alert">Choose at least one table.</p>}
    </fieldset>
  );
}

export default function MultiplicationTestRunner() {
  const [phase, setPhase] = useState<Phase>('config');
  const [config, setConfig] = useState<MultiplicationTestConfig>(DEFAULT_MULTIPLICATION_TEST_CONFIG);
  const [attempt, setAttempt] = useState<{ id: number; problems: Problem[] } | null>(null);
  const [result, setResult] = useState<MultiplicationTestResult | null>(null);
  const missedRef = useRef<Problem[]>([]);
  const viewTracked = useRef(false);
  const attemptCounter = useRef(0);

  // Load configuration from the URL on mount (configuration only — no seed/result/score ever lives here).
  useEffect(() => {
    const parsed = parseMultiplicationTestQuery(window.location.search);
    if (parsed) setConfig(parsed);
  }, []);

  useEffect(() => {
    if (viewTracked.current) return;
    viewTracked.current = true;
    trackMultiplicationTestEvent('multiplication_test_view', {});
  }, []);

  const dimensions = useMemo(() => ({
    problem_count: config.questionCount,
    selection_scope: deriveMultiplicationTestSelectionScope(config.facts),
  }), [config]);

  // Local edits are applied directly, not re-validated through normalizeMultiplicationTestConfig:
  // that function's job is to make an untrusted/external config (the URL query) safe, and its
  // strict "non-empty facts" rule would otherwise silently snap a mid-edit "Clear all" back to
  // all 12 tables. The UI itself only ever produces well-formed values (toggled 1–12 facts, a
  // literal question count), and Start Test is disabled while facts is empty.
  function updateConfig(next: Partial<{ facts: number[]; questionCount: MultiplicationTestQuestionCount }>) {
    setConfig((prev) => ({ ...prev, ...next }));
  }

  function launchAttempt() {
    if (config.facts.length === 0) return;
    const seed = createMultiplicationTestSeed();
    const problems = buildMultiplicationTestProblems(config, seed);
    missedRef.current = [];
    attemptCounter.current += 1;
    setAttempt({ id: attemptCounter.current, problems });
    setResult(null);
    setPhase('active');
    // Mirror configuration into the URL for shareability — never the seed, problems, or result — and stay self-canonical to /multiplication/test/.
    try {
      const query = serializeMultiplicationTestQuery(config);
      const url = query ? `${window.location.pathname}?${query}` : window.location.pathname;
      window.history.replaceState(null, '', url);
    } catch {
      // Best-effort only — the test still runs correctly without a mirrored URL.
    }
  }

  function handleComplete(session: SessionResult) {
    const testResult = buildMultiplicationTestResult(session, missedRef.current, config);
    setResult(testResult);
    setPhase('complete');
    trackMultiplicationTestEvent('multiplication_test_complete', {
      ...dimensions,
      ...(session.completionReason === undefined ? {} : { completion_reason: session.completionReason }),
    });
  }

  function handleRetake() {
    trackMultiplicationTestEvent('multiplication_test_retake', dimensions);
    launchAttempt();
  }

  function handlePracticeMissed() {
    trackMultiplicationTestEvent('multiplication_test_retry_missed', dimensions);
    setPhase('missed-practice');
  }

  if (phase === 'config') {
    return (
      <div className="w-full max-w-[length:var(--practice-card-max-w)] mx-auto font-practice">
        <p className="text-sm sm:text-base text-body leading-relaxed mb-5">
          A free, scored multiplication facts test. Choose your tables and question count, then see your score and missed facts at the end — no signup required.
        </p>

        <div className="mb-5">
          <FactsGrid selected={config.facts} onChange={(facts) => updateConfig({ facts })} />
        </div>

        <fieldset className="border-0 p-0 m-0 mb-6">
          <legend className="static block mb-2 text-sm font-semibold text-[#211D4F]">Questions</legend>
          <div className="grid grid-cols-3 gap-2">
            {MULTIPLICATION_TEST_QUESTION_COUNTS.map((count) => (
              <button
                key={count}
                type="button"
                aria-pressed={config.questionCount === count}
                onClick={() => updateConfig({ questionCount: count })}
                className={`min-h-[44px] rounded-lg border text-sm font-bold transition-all ${
                  config.questionCount === count ? 'border-[#4F46E5] bg-[#F5F3FF] text-[#211D4F]' : 'border-[#D8D4EE] bg-white text-[#211D4F] hover:border-[#4F46E5]'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </fieldset>

        <button
          onClick={launchAttempt}
          disabled={config.facts.length === 0}
          className="w-full py-3.5 px-6 bg-[#4F46E5] hover:bg-[#3E35C7] disabled:opacity-50 disabled:cursor-not-allowed active:shadow-none active:translate-y-[2px] text-white font-bold rounded-xl transition-all shadow-[0_3px_0_0_#3730A3,0_4px_12px_rgba(79,70,229,0.30)] hover:shadow-[0_3px_0_0_#312E81,0_6px_16px_rgba(79,70,229,0.40)]"
        >
          Start Test
        </button>
      </div>
    );
  }

  if ((phase === 'active' || phase === 'complete') && attempt) {
    return (
      <div>
        {phase === 'active' && (
          <PracticeWidget
            key={attempt.id}
            config={buildMultiplicationTestRuntimeConfig(config)}
            problems={attempt.problems}
            questionCount={config.questionCount}
            variant="prototype"
            feedbackVisibility="hidden"
            writesProgress={false}
            sessionPresentation="shared"
            onFirstAcceptedAnswer={() => trackMultiplicationTestEvent('multiplication_test_start', dimensions)}
            onAnswerSubmit={(problem, isCorrect) => {
              if (!isCorrect) missedRef.current.push(problem);
            }}
            onSessionComplete={handleComplete}
          />
        )}
        {phase === 'complete' && result && (
          <TestResultsCard result={result} onRetake={handleRetake} onPracticeMissed={handlePracticeMissed} />
        )}
        {phase === 'complete' && (
          <div className="mt-4 text-center font-practice">
            <button
              onClick={() => setPhase('config')}
              className="text-sm text-[#211D4F] hover:text-[#4F46E5] transition-colors"
            >
              ← Change configuration
            </button>
          </div>
        )}
      </div>
    );
  }

  if (phase === 'missed-practice' && result) {
    // Exact missed equations, fed straight into the normal practice runtime — feedback restored,
    // no assessment semantics. questionCount is cast because the missed-set size is inherently
    // variable, outside the shared 10|20|30|50 QuestionCount union; session.ts only ever compares
    // it numerically, so this is safe at runtime.
    const missedQuestionCount = result.missed.length as QuestionCount;
    return (
      <div>
        <PracticeWidget
          config={MULTIPLICATION_FACTS}
          problems={[...result.missed]}
          questionCount={missedQuestionCount}
          variant="prototype"
          sessionPresentation="shared"
        />
        <div className="mt-4 text-center font-practice">
          <button
            onClick={() => setPhase('complete')}
            className="text-sm text-[#211D4F] hover:text-[#4F46E5] transition-colors"
          >
            ← Back to results
          </button>
        </div>
      </div>
    );
  }

  return null;
}
