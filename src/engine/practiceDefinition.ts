import type { PracticeConfig, QuestionCount, TimerDuration } from './types';
import {
  getPracticeTypeEntry,
  type PracticeTypeId,
  type PracticeTypeRegistryEntry,
  type PracticeTypeSkillOptions,
} from './practiceTypes';

export const PRACTICE_DEFINITION_VERSION = 2 as const;

export type PracticeSessionOptions =
  | { readonly mode: 'untimed'; readonly questionCount?: QuestionCount }
  | { readonly mode: 'timed'; readonly durationSeconds: TimerDuration; readonly questionCount?: QuestionCount };

export type PracticeDefinitionV2 = {
  [Id in PracticeTypeId]: {
    readonly version: typeof PRACTICE_DEFINITION_VERSION;
    readonly practiceType: Id;
    readonly skillOptions: PracticeTypeSkillOptions[Id];
    readonly sessionOptions: PracticeSessionOptions;
  }
}[PracticeTypeId];

export type PracticeDefinitionValidationResult =
  | { readonly success: true; readonly value: PracticeDefinitionV2 }
  | { readonly success: false; readonly error: { readonly field: string; readonly reason: string } };

export interface ResolvedPracticeDefinition {
  readonly entry: PracticeTypeRegistryEntry;
  readonly baseConfig: PracticeConfig;
  readonly skillOptions: PracticeDefinitionV2['skillOptions'];
  readonly sessionOptions: PracticeSessionOptions;
}

const durations: readonly TimerDuration[] = [30, 60, 120, 300];
const questionCounts: readonly QuestionCount[] = [10, 20, 30, 50];
const hasExactKeys = (input: object, required: readonly string[], optional: readonly string[] = []) => {
  const keys = Object.keys(input);
  return required.every((key) => keys.includes(key)) && keys.every((key) => required.includes(key) || optional.includes(key));
};
const failure = (field: string, reason: string): PracticeDefinitionValidationResult => ({ success: false, error: { field, reason } });

function validateSessionOptions(input: unknown): PracticeSessionOptions | undefined {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return undefined;
  const value = input as Record<string, unknown>;
  if (!hasExactKeys(value, ['mode'], ['durationSeconds', 'questionCount'])) return undefined;
  if (value.questionCount !== undefined && !questionCounts.includes(value.questionCount as QuestionCount)) return undefined;
  if (value.mode === 'untimed') {
    if ('durationSeconds' in value) return undefined;
    return Object.freeze({ mode: 'untimed', ...(value.questionCount === undefined ? {} : { questionCount: value.questionCount as QuestionCount }) });
  }
  if (value.mode === 'timed' && durations.includes(value.durationSeconds as TimerDuration)) {
    return Object.freeze({ mode: 'timed', durationSeconds: value.durationSeconds as TimerDuration, ...(value.questionCount === undefined ? {} : { questionCount: value.questionCount as QuestionCount }) });
  }
  return undefined;
}

/** Strictly validates untrusted V2 objects and returns a normalized, frozen definition. */
export function validatePracticeDefinitionV2(input: unknown): PracticeDefinitionValidationResult {
  try {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) return failure('definition', 'Expected an object');
    const candidate = input as Record<string, unknown>;
    if (!hasExactKeys(candidate, ['version', 'practiceType', 'skillOptions', 'sessionOptions'])) return failure('definition', 'Definition fields are missing or unknown');
    if (candidate.version !== PRACTICE_DEFINITION_VERSION) return failure('version', 'Only PracticeDefinition version 2 is supported');
    const entry = getPracticeTypeEntry(candidate.practiceType);
    if (!entry) return failure('practiceType', 'Practice type is unknown');
    const skill = entry.validateSkillOptions(candidate.skillOptions);
    if (!skill.success) return failure('skillOptions', skill.reason);
    const sessionOptions = validateSessionOptions(candidate.sessionOptions);
    if (!sessionOptions) return failure('sessionOptions', 'Session options are invalid');
    return {
      success: true,
      value: Object.freeze({ version: PRACTICE_DEFINITION_VERSION, practiceType: entry.id, skillOptions: skill.value, sessionOptions }) as PracticeDefinitionV2,
    };
  } catch {
    return failure('definition', 'Definition could not be safely inspected');
  }
}

/** Resolves only a previously validated definition; internal identity always comes from the registry. */
export function resolvePracticeDefinition(definition: PracticeDefinitionV2): ResolvedPracticeDefinition {
  const entry = getPracticeTypeEntry(definition.practiceType);
  if (!entry) throw new Error('Validated practice type is not registered');
  return Object.freeze({ entry, baseConfig: entry.baseConfig, skillOptions: definition.skillOptions, sessionOptions: definition.sessionOptions });
}
