import type { PracticeMode, QuestionCount, TimerDuration } from './types';
import { MULTIPLICATION_FACTS_CAPABILITY, toPracticeOverrides, validatePublicPracticePreset, type PublicPracticePresetV1 } from './publicPreset';
import { parsePublicPracticePresetQuery, serializePublicPracticePreset } from './publicPresetUrl';

export const ALL_FACTS = Object.freeze(Array.from({ length: 12 }, (_, index) => index + 1));

export interface MultiplicationFactsSettings {
  readonly facts: readonly number[];
  readonly mode: PracticeMode;
  readonly durationSeconds: TimerDuration;
  readonly questionCount?: QuestionCount;
}

export const DEFAULT_MULTIPLICATION_FACTS_SETTINGS: MultiplicationFactsSettings = Object.freeze({
  facts: ALL_FACTS,
  mode: 'untimed',
  durationSeconds: 60,
});

export type InitialPilotState =
  | { readonly kind: 'default'; readonly settings: MultiplicationFactsSettings }
  | { readonly kind: 'preset'; readonly settings: MultiplicationFactsSettings }
  | { readonly kind: 'invalid'; readonly settings: MultiplicationFactsSettings };

export function settingsToPreset(settings: MultiplicationFactsSettings): PublicPracticePresetV1 | undefined {
  const candidate = {
    version: 1,
    facts: [...settings.facts],
    mode: settings.mode,
    ...(settings.mode === 'timed' ? { durationSeconds: settings.durationSeconds } : {}),
    ...(settings.questionCount === undefined ? {} : { questionCount: settings.questionCount }),
  };
  const validated = validatePublicPracticePreset(candidate, MULTIPLICATION_FACTS_CAPABILITY);
  return validated.success ? validated.value : undefined;
}

export function resolveInitialPilotState(search: string): InitialPilotState {
  if (search === '' || search === '?') return { kind: 'default', settings: DEFAULT_MULTIPLICATION_FACTS_SETTINGS };
  const parsed = parsePublicPracticePresetQuery(search, MULTIPLICATION_FACTS_CAPABILITY);
  if (!parsed.success) return { kind: 'invalid', settings: DEFAULT_MULTIPLICATION_FACTS_SETTINGS };
  const overrides = toPracticeOverrides(parsed.value);
  return {
    kind: 'preset',
    settings: Object.freeze({
      facts: overrides.selectedFacts ?? ALL_FACTS,
      mode: overrides.mode ?? 'untimed',
      durationSeconds: overrides.durationSeconds ?? 60,
      ...(overrides.questionCount === undefined ? {} : { questionCount: overrides.questionCount }),
    }),
  };
}

export function buildPracticeUrl(base: URL, settings: MultiplicationFactsSettings): URL | undefined {
  const preset = settingsToPreset(settings);
  if (!preset) return undefined;
  const result = new URL(base.href);
  result.search = serializePublicPracticePreset(preset);
  result.hash = '';
  return result;
}
