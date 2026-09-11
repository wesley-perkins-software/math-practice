import type { DailyReviewGradeId } from '../engine/dailyReview';
import { trackEvent } from './analytics';

type EventParams = {
  daily_review_view: { grade: DailyReviewGradeId };
  daily_review_start: { grade: DailyReviewGradeId };
  daily_review_complete: { grade: DailyReviewGradeId; accuracy_pct: number };
};
export type DailyReviewAnalyticsEvent = keyof EventParams;

const ALLOWED_KEYS = new Set(['grade', 'accuracy_pct']);

/** Runtime allowlisting complements the event map so even untyped callers cannot leak arbitrary data — same pattern as createPracticeAnalytics.ts. Never send seeds, generated problems, answers, or learner-identifying data. */
export function safeDailyReviewEventPayload(params: object): Record<string, string | number | boolean> {
  const safe: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    if (ALLOWED_KEYS.has(key) && (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')) safe[key] = value;
  }
  return safe;
}

export function trackDailyReviewEvent<Name extends DailyReviewAnalyticsEvent>(name: Name, params: EventParams[Name]): void {
  trackEvent(name, safeDailyReviewEventPayload(params));
}
