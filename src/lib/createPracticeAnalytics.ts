import type { PracticeDefinitionV2 } from '../engine/practiceDefinition';
import { resolvePracticeDefinition } from '../engine/practiceDefinition';
import type { PracticeCategoryId, PracticeTypeId } from '../engine/practiceTypes';
import type { QuestionCount, SessionResult, TimerDuration } from '../engine/types';
import { trackEvent } from './analytics';

export type SessionMode = 'untimed_endless' | 'untimed_finite' | 'timed_only' | 'timed_finite';
export type SelectionScope = 'single' | 'multiple' | 'all';

export interface SafePracticeDimensions {
  readonly practice_type: PracticeTypeId;
  readonly category: PracticeCategoryId;
  readonly session_mode: SessionMode;
  readonly selection_scope?: SelectionScope;
  readonly duration_seconds?: TimerDuration;
  readonly question_count?: QuestionCount;
}

export function deriveSafePracticeDimensions(definition: PracticeDefinitionV2): SafePracticeDimensions {
  const { entry } = resolvePracticeDefinition(definition);
  const { sessionOptions } = definition;
  const timed = sessionOptions.mode === 'timed';
  const finite = sessionOptions.questionCount !== undefined;
  let selectionLength: number | undefined;
  if (definition.practiceType === 'multiplication-facts') selectionLength = definition.skillOptions.facts.length;
  if (definition.practiceType === 'division-facts') selectionLength = definition.skillOptions.divisors.length;
  const selection_scope = selectionLength === undefined
    ? undefined
    : selectionLength === 1 ? 'single' : selectionLength === 12 ? 'all' : 'multiple';
  return Object.freeze({
    practice_type: definition.practiceType,
    category: entry.category,
    session_mode: timed ? (finite ? 'timed_finite' : 'timed_only') : (finite ? 'untimed_finite' : 'untimed_endless'),
    ...(selection_scope === undefined ? {} : { selection_scope }),
    ...(timed ? { duration_seconds: sessionOptions.durationSeconds } : {}),
    ...(finite ? { question_count: sessionOptions.questionCount } : {}),
  });
}

type EventParams = {
  create_practice_type_select: Pick<SafePracticeDimensions, 'practice_type' | 'category'>;
  create_practice_copy_link: SafePracticeDimensions;
  create_practice_preview: SafePracticeDimensions;
  shared_practice_open: SafePracticeDimensions;
  shared_practice_start: SafePracticeDimensions;
  shared_practice_complete: SafePracticeDimensions & { completion_reason?: NonNullable<SessionResult['completionReason']> };
  shared_practice_replay: Pick<SafePracticeDimensions, 'practice_type' | 'category' | 'session_mode'>;
};
export type CreatePracticeAnalyticsEvent = keyof EventParams;

const ALLOWED_KEYS = new Set([
  'practice_type', 'category', 'session_mode', 'selection_scope', 'duration_seconds',
  'question_count', 'completion_reason',
]);

/** Runtime allowlisting complements the event map so even untyped callers cannot leak arbitrary data. */
export function safeEventPayload(params: object): Record<string, string | number | boolean> {
  const safe: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    if (ALLOWED_KEYS.has(key) && (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')) safe[key] = value;
  }
  return safe;
}

export function trackCreatePracticeEvent<Name extends CreatePracticeAnalyticsEvent>(name: Name, params: EventParams[Name]): void {
  trackEvent(name, safeEventPayload(params));
}
