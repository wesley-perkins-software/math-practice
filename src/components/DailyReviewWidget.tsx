import { useEffect, useMemo, useRef, useState } from 'react';
import PracticeWidget from './PracticeWidget';
import type { SessionResult } from '@/engine/types';
import {
  DAILY_REVIEW_GRADE_LABELS,
  type DailyReviewGradeId,
  dailyReviewStorageKey,
  generateDailyReviewProblems,
  markDailyReviewCompleted,
  millisecondsUntilNextLocalMidnight,
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
  const viewTrackedRef = useRef(false);

  // A static site has no per-request server logic, so "today" is computed
  // client-side. A page left open across local midnight must still roll
  // over to the new day's set without a manual refresh: a timeout fires
  // just after the next local midnight (recomputed from calendar
  // components each time, so DST/variable-length days are handled by the
  // Date implementation, not assumed to be 24h), and a visibilitychange
  // listener re-checks immediately on tab/device resume in case background
  // timer throttling delayed the timeout past the actual boundary.
  useEffect(() => {
    setDateKey(todayDateKey());

    let timeoutId: ReturnType<typeof setTimeout>;
    function scheduleNextMidnightCheck() {
      timeoutId = setTimeout(() => {
        setDateKey(todayDateKey());
        scheduleNextMidnightCheck();
      }, millisecondsUntilNextLocalMidnight() + 1000);
    }
    scheduleNextMidnightCheck();

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') setDateKey(todayDateKey());
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!dateKey || viewTrackedRef.current) return;
    viewTrackedRef.current = true;
    trackDailyReviewEvent('daily_review_view', { grade: gradeId });
  }, [dateKey, gradeId]);

  const problems = useMemo(() => (dateKey ? generateDailyReviewProblems(dateKey, gradeId) : []), [dateKey, gradeId]);

  function handleSessionComplete(result: SessionResult) {
    markDailyReviewCompleted(gradeId, dateKey);
    trackDailyReviewEvent('daily_review_complete', { grade: gradeId, accuracy_pct: result.score });
  }

  if (!dateKey) return null; // avoids a hydration mismatch between server render and the client's local date

  return (
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
  );
}
