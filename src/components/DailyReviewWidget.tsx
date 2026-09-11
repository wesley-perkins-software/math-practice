import { useEffect, useMemo, useRef, useState } from 'react';
import PracticeWidget from './PracticeWidget';
import type { SessionResult } from '@/engine/types';
import {
  DAILY_REVIEW_GRADE_IDS,
  DAILY_REVIEW_GRADE_LABELS,
  DAILY_REVIEW_GRADE_SHORT_LABELS,
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

  if (!dateKey) return null; // avoids a hydration mismatch between server render and the client's local date

  return (
    <div className="space-y-3">
      {/* Compact grade selector: a single pill row, not six configuration
          cards — the practice experience below is the point of this page,
          not the grade choice. */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex gap-1 rounded-xl border border-[#E0E7FF] bg-white p-1" role="group" aria-label="Choose a grade">
          {DAILY_REVIEW_GRADE_IDS.map((id) => (
            <button
              key={id}
              onClick={() => handleGradeSelect(id)}
              aria-pressed={id === gradeId}
              aria-label={DAILY_REVIEW_GRADE_LABELS[id]}
              className={`min-w-[2.25rem] rounded-lg px-3 py-1.5 text-sm font-bold transition-all ${
                id === gradeId
                  ? 'bg-[#4F46E5] text-white'
                  : 'text-[#1E1B4B] hover:bg-[#F5F3FF]'
              }`}
            >
              {DAILY_REVIEW_GRADE_SHORT_LABELS[id]}
            </button>
          ))}
        </div>
        <p className="text-sm font-medium text-[#475569]">
          {DAILY_REVIEW_GRADE_LABELS[gradeId]} · {DAILY_REVIEW_GRADE_SUBTITLES[gradeId]}
        </p>
      </div>

      {completedToday && (
        <div className="rounded-xl border border-[#C7D2FE] bg-[#F5F3FF] px-4 py-3 text-sm font-medium text-[#3730A3]" role="status">
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
    </div>
  );
}
