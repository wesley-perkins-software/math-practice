import { useEffect, useMemo, useRef, useState } from 'react';
import PracticeWidget from './PracticeWidget';
import type { Problem, SessionResult } from '@/engine/types';
import {
  DAILY_REVIEW_GRADE_IDS,
  DAILY_REVIEW_GRADE_LABELS,
  DAILY_REVIEW_GRADE_SUBTITLES,
  type DailyReviewGradeId,
  dailyReviewStorageKey,
  generateDailyReviewProblems,
  isDailyReviewCompletedToday,
  isDailyReviewGradeId,
  loadDailyReviewPrefs,
  markDailyReviewCompleted,
  saveDailyReviewLastSelection,
  todayDateKey,
} from '@/engine/dailyReview';
import { trackDailyReviewEvent } from '@/lib/dailyReviewAnalytics';

const DEFAULT_GRADE: DailyReviewGradeId = 'g3';

const OP_SYMBOL: Record<string, string> = {
  addition: '+',
  subtraction: '−',
  multiplication: '×',
  division: '÷',
};

function PrintProblem({ problem, showAnswer }: { problem: Problem; showAnswer: boolean }) {
  const symbol = OP_SYMBOL[problem.operation];
  return (
    <div className="print-problem flex min-h-[100px] flex-col items-end rounded-xl border border-[#E0E7FF] bg-white p-4">
      <div className="font-mono text-xl font-bold tabular-nums text-[#1E1B4B]">{problem.operandA}</div>
      <div className="flex items-center gap-2 font-mono text-xl font-bold tabular-nums text-[#1E1B4B]">
        <span className="text-[#4F46E5]">{symbol}</span>
        <span>{problem.operandB}</span>
      </div>
      <div className="mb-2 mt-1 w-full border-t-2 border-[#1E1B4B]" />
      {showAnswer ? (
        <div className="font-mono text-lg font-bold tabular-nums text-[#059669]">
          {problem.remainder !== undefined ? `${problem.correctAnswer} r${problem.remainder}` : problem.correctAnswer}
        </div>
      ) : (
        <div className="h-6" aria-hidden="true" />
      )}
    </div>
  );
}

function readInitialGrade(): DailyReviewGradeId {
  if (typeof window === 'undefined') return DEFAULT_GRADE;
  const params = new URLSearchParams(window.location.search);
  const queryGrade = params.get('grade');
  if (isDailyReviewGradeId(queryGrade)) return queryGrade;
  const prefs = loadDailyReviewPrefs();
  return isDailyReviewGradeId(prefs.lastSelection) ? prefs.lastSelection : DEFAULT_GRADE;
}

export default function DailyReviewWidget() {
  const [gradeId, setGradeId] = useState<DailyReviewGradeId>(DEFAULT_GRADE);
  const [dateKey, setDateKey] = useState<string>('');
  const [completedToday, setCompletedToday] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [printMode, setPrintMode] = useState<'review' | 'answer_key' | null>(null);
  const viewTrackedRef = useRef(false);

  // Resolve the initial grade (query preselect > saved preference > default)
  // and today's local date once on mount — a static site has no per-request
  // server logic, so "today" is computed client-side.
  useEffect(() => {
    const initialGrade = readInitialGrade();
    setGradeId(initialGrade);
    setDateKey(todayDateKey());
    saveDailyReviewLastSelection(initialGrade);
  }, []);

  useEffect(() => {
    if (!dateKey) return;
    setCompletedToday(isDailyReviewCompletedToday(gradeId, dateKey));
  }, [gradeId, dateKey]);

  useEffect(() => {
    if (!dateKey || viewTrackedRef.current) return;
    viewTrackedRef.current = true;
    trackDailyReviewEvent('daily_review_view', { grade: gradeId });
  }, [dateKey, gradeId]);

  const problems = useMemo(() => (dateKey ? generateDailyReviewProblems(dateKey, gradeId) : []), [dateKey, gradeId]);

  useEffect(() => {
    if (!printMode) return;
    let rafId: number;
    const handleAfterPrint = () => setPrintMode(null);
    window.addEventListener('afterprint', handleAfterPrint, { once: true });
    rafId = requestAnimationFrame(() => {
      rafId = requestAnimationFrame(() => window.print());
    });
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [printMode]);

  function handleGradeSelect(next: DailyReviewGradeId) {
    if (next === gradeId) return;
    setGradeId(next);
    saveDailyReviewLastSelection(next);
    trackDailyReviewEvent('daily_review_grade_select', { grade: next });
  }

  function handleSessionComplete(result: SessionResult) {
    markDailyReviewCompleted(gradeId, dateKey);
    setCompletedToday(true);
    trackDailyReviewEvent('daily_review_complete', { grade: gradeId, accuracy_pct: result.score });
  }

  function handlePrint(mode: 'review' | 'answer_key') {
    setShowAnswers(mode === 'answer_key');
    setPrintMode(mode);
    trackDailyReviewEvent('daily_review_print', { grade: gradeId, mode });
  }

  if (!dateKey) return null; // avoids a hydration mismatch between server render and the client's local date

  const printDate = new Date(`${dateKey}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap gap-2" role="group" aria-label="Choose a grade">
        {DAILY_REVIEW_GRADE_IDS.map((id) => (
          <button
            key={id}
            onClick={() => handleGradeSelect(id)}
            aria-pressed={id === gradeId}
            className={`rounded-lg border px-3 py-2 text-left text-sm font-medium transition-all ${
              id === gradeId
                ? 'border-[#4F46E5] bg-[#4F46E5] text-white'
                : 'border-[#E0E7FF] bg-white text-[#1E1B4B] hover:border-[#4F46E5]'
            }`}
          >
            <div className="font-semibold">{DAILY_REVIEW_GRADE_LABELS[id]}</div>
            <div className={`text-xs ${id === gradeId ? 'text-[#E0E7FF]' : 'text-[#6B7280]'}`}>{DAILY_REVIEW_GRADE_SUBTITLES[id]}</div>
          </button>
        ))}
      </div>

      {completedToday && (
        <div className="no-print rounded-xl border border-[#C7D2FE] bg-[#F5F3FF] px-4 py-3 text-sm font-medium text-[#3730A3]" role="status">
          Today's {DAILY_REVIEW_GRADE_LABELS[gradeId]} review is complete — replay below to practice the same set again.
        </div>
      )}

      <PracticeWidget
        key={`${gradeId}-${dateKey}`}
        config={{
          storageKey: dailyReviewStorageKey(gradeId),
          label: `${DAILY_REVIEW_GRADE_LABELS[gradeId]} Daily Review`,
          path: '/daily-review/',
          operation: 'mixed',
          mode: 'untimed',
          timerDuration: 60,
        }}
        problems={problems}
        questionCount={10}
        variant="prototype"
        sessionPresentation="shared"
        onFirstAcceptedAnswer={() => trackDailyReviewEvent('daily_review_start', { grade: gradeId })}
        onSessionComplete={handleSessionComplete}
      />

      <div className="no-print flex flex-wrap gap-2">
        <button
          onClick={() => handlePrint('review')}
          className="rounded-lg border border-[#4F46E5] px-3 py-1.5 text-sm font-medium text-[#4F46E5] transition-all hover:bg-[#EEF2FF]"
        >
          Print Review
        </button>
        <button
          onClick={() => handlePrint('answer_key')}
          className="rounded-lg bg-[#4F46E5] px-3 py-1.5 text-sm font-medium text-white transition-all hover:bg-[#4338CA]"
        >
          Print Answer Key
        </button>
      </div>

      {/* Print-only view: renders the exact same `problems` array shown
          interactively above — never a separately generated set. */}
      <div className="hidden print:block">
        <div className="print-only-header mb-3">
          <h2 className="text-lg font-bold text-[#1E1B4B]">
            {DAILY_REVIEW_GRADE_LABELS[gradeId]} Daily Math Review — {printDate}
            {showAnswers ? ' — Answer Key' : ''}
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {problems.map((problem) => (
            <PrintProblem key={problem.id} problem={problem} showAnswer={showAnswers} />
          ))}
        </div>
      </div>
    </div>
  );
}
