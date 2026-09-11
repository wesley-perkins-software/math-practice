import { useEffect, useMemo, useRef, useState } from 'react';
import PracticeWidget from './PracticeWidget';
import type { SessionResult } from '@/engine/types';
import {
  DAILY_REVIEW_GRADE_LABELS,
  type DailyReviewGradeId,
  dailyReviewStorageKey,
  generateDailyReviewProblems,
  isDailyReviewCompletedToday,
  markDailyReviewCompleted,
  todayDateKey,
} from '@/engine/dailyReview';
import { trackDailyReviewEvent } from '@/lib/dailyReviewAnalytics';

interface Props {
  gradeId: DailyReviewGradeId;
}

/**
 * Grade identity is established by the route (/daily-review/{grade}/), not
 * chosen here — this component only generates, presents, and tracks
 * completion for the grade it's given. See DailyReviewWidget's Astro caller
 * for the H1/intro that names the grade; this component stays focused on
 * the practice experience itself.
 */
export default function DailyReviewWidget({ gradeId }: Props) {
  const [dateKey, setDateKey] = useState<string>('');
  const [completedToday, setCompletedToday] = useState(false);
  const viewTrackedRef = useRef(false);

  // A static site has no per-request server logic, so "today" is computed
  // client-side once on mount.
  useEffect(() => {
    setDateKey(todayDateKey());
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

  function handleSessionComplete(result: SessionResult) {
    markDailyReviewCompleted(gradeId, dateKey);
    setCompletedToday(true);
    trackDailyReviewEvent('daily_review_complete', { grade: gradeId, accuracy_pct: result.score });
  }

  if (!dateKey) return null; // avoids a hydration mismatch between server render and the client's local date

  return (
    <div className="space-y-3">
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
