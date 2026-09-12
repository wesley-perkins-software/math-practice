import { trackEvent } from './analytics';
import type { MultiplicationTestQuestionCount } from '@/engine/multiplicationTest';
import type { MultiplicationTestSelectionScope } from '@/engine/multiplicationTest';
import type { SessionResult } from '@/engine/types';

export interface MultiplicationTestDimensions {
  readonly problem_count: MultiplicationTestQuestionCount;
  readonly selection_scope: MultiplicationTestSelectionScope;
}

type EventParams = {
  multiplication_test_view: Record<string, never>;
  multiplication_test_start: MultiplicationTestDimensions;
  multiplication_test_complete: MultiplicationTestDimensions & { completion_reason?: NonNullable<SessionResult['completionReason']> };
  multiplication_test_retake: MultiplicationTestDimensions;
  multiplication_test_retry_missed: MultiplicationTestDimensions;
};
export type MultiplicationTestAnalyticsEvent = keyof EventParams;

const ALLOWED_KEYS = new Set(['problem_count', 'selection_scope', 'completion_reason']);

/** Runtime allowlisting complements the event map so no untyped caller can leak arbitrary data (exact facts, score, answers). */
function safeEventPayload(params: object): Record<string, string | number | boolean> {
  const safe: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    if (ALLOWED_KEYS.has(key) && (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')) safe[key] = value;
  }
  return safe;
}

export function trackMultiplicationTestEvent<Name extends MultiplicationTestAnalyticsEvent>(name: Name, params: EventParams[Name]): void {
  trackEvent(name, safeEventPayload(params));
}
