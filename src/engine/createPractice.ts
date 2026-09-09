import { validatePracticeDefinitionV2, type PracticeDefinitionV2 } from './practiceDefinition';
import { serializePracticeDefinitionV2 } from './practiceDefinitionUrl';
import { getPracticeTypeEntry, type PracticeTypeId } from './practiceTypes';
import type { PracticeMode, QuestionCount, TimerDuration } from './types';

export interface CreatePracticeState {
  readonly practiceType?: PracticeTypeId;
  readonly skillOptions: object;
  readonly mode: PracticeMode;
  readonly durationSeconds: TimerDuration;
  readonly questionCount?: QuestionCount;
}

export const DEFAULT_CREATE_PRACTICE_STATE: CreatePracticeState = Object.freeze({
  skillOptions: Object.freeze({}), mode: 'untimed', durationSeconds: 60, questionCount: 20,
});

/** Selects a registry entry while retaining only the common session controls. */
export function selectCreatePracticeType(state: CreatePracticeState, practiceType: PracticeTypeId): CreatePracticeState {
  const entry = getPracticeTypeEntry(practiceType);
  if (!entry) return state;
  return Object.freeze({ ...state, practiceType, skillOptions: structuredClone(entry.defaultSkillOptions) });
}

/** The validator, not the form, is the final authority for the live definition. */
export function deriveCreatePractice(state: CreatePracticeState):
  | { readonly success: true; readonly definition: PracticeDefinitionV2; readonly query: string; readonly relativeUrl: string }
  | { readonly success: false } {
  if (!state.practiceType) return { success: false };
  const sessionOptions = state.mode === 'timed'
    ? { mode: 'timed', durationSeconds: state.durationSeconds, ...(state.questionCount === undefined ? {} : { questionCount: state.questionCount }) }
    : { mode: 'untimed', ...(state.questionCount === undefined ? {} : { questionCount: state.questionCount }) };
  const validated = validatePracticeDefinitionV2({ version: 2, practiceType: state.practiceType, skillOptions: state.skillOptions, sessionOptions });
  if (!validated.success) return { success: false };
  const query = serializePracticeDefinitionV2(validated.value);
  return Object.freeze({ success: true, definition: validated.value, query, relativeUrl: `/practice/?${query}` });
}

export function absolutePracticeUrl(relativeUrl: string, origin: string): string {
  return new URL(relativeUrl, origin).href;
}
