import {
  ADDITION_1_DIGIT,
  ADDITION_2_DIGIT,
  ADDITION_2_DIGIT_CARRYING,
  DIVISION_FACTS,
  DIVISION_REMAINDERS,
  MULTIPLICATION_FACTS,
  SUBTRACTION_1_DIGIT,
  SUBTRACTION_2_DIGIT,
  SUBTRACTION_2_DIGIT_BORROWING,
} from './presets';
import type { PracticeConfig } from './types';

export const PRACTICE_CATEGORY_IDS = ['addition', 'subtraction', 'multiplication', 'division'] as const;
export type PracticeCategoryId = (typeof PRACTICE_CATEGORY_IDS)[number];

export const PRACTICE_TYPE_IDS = [
  'addition-1-digit',
  'addition-2digit-no-regrouping',
  'addition-2digit-regrouping',
  'subtraction-1-digit',
  'subtraction-2digit-no-regrouping',
  'subtraction-2digit-regrouping',
  'multiplication-facts',
  'division-facts',
  'division-remainders',
] as const;
export type PracticeTypeId = (typeof PRACTICE_TYPE_IDS)[number];

export type EmptySkillOptions = Readonly<Record<string, never>>;
export interface MultiplicationFactsSkillOptions { readonly facts: readonly number[] }
export interface DivisionFactsSkillOptions { readonly divisors: readonly number[] }

export interface PracticeTypeSkillOptions {
  'addition-1-digit': EmptySkillOptions;
  'addition-2digit-no-regrouping': EmptySkillOptions;
  'addition-2digit-regrouping': EmptySkillOptions;
  'subtraction-1-digit': EmptySkillOptions;
  'subtraction-2digit-no-regrouping': EmptySkillOptions;
  'subtraction-2digit-regrouping': EmptySkillOptions;
  'multiplication-facts': MultiplicationFactsSkillOptions;
  'division-facts': DivisionFactsSkillOptions;
  'division-remainders': EmptySkillOptions;
}

export type SkillOptionsValidationResult<T> =
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly reason: string };

export interface PracticeTypeRegistryEntry<Id extends PracticeTypeId = PracticeTypeId> {
  readonly id: Id;
  readonly displayName: string;
  readonly category: PracticeCategoryId;
  readonly canonicalPath: `/${string}/`;
  /** Trusted internal configuration owns generation, rendering, and progress identity. */
  readonly baseConfig: PracticeConfig;
  readonly defaultSkillOptions: PracticeTypeSkillOptions[Id];
  readonly validateSkillOptions: (input: unknown) => SkillOptionsValidationResult<PracticeTypeSkillOptions[Id]>;
}

const ownKeysAre = (input: object, expected: readonly string[]) => {
  const keys = Object.keys(input);
  return keys.length === expected.length && keys.every((key) => expected.includes(key));
};

const validateEmpty = (input: unknown): SkillOptionsValidationResult<EmptySkillOptions> => {
  if (typeof input !== 'object' || input === null || Array.isArray(input) || !ownKeysAre(input, [])) {
    return { success: false, reason: 'Skill options must be an empty object' };
  }
  return { success: true, value: Object.freeze({}) };
};

function validateSelection<Key extends 'facts' | 'divisors'>(
  input: unknown,
  key: Key,
): SkillOptionsValidationResult<Readonly<Record<Key, readonly number[]>>> {
  if (typeof input !== 'object' || input === null || Array.isArray(input) || !ownKeysAre(input, [key])) {
    return { success: false, reason: `Skill options must contain only ${key}` };
  }
  const values = (input as Record<string, unknown>)[key];
  if (!Array.isArray(values) || values.length === 0 || values.length > 12) {
    return { success: false, reason: `${key} must contain between 1 and 12 values` };
  }
  if (values.some((value) => !Number.isInteger(value) || value < 1 || value > 12)) {
    return { success: false, reason: `${key} must be integers from 1 through 12` };
  }
  if (new Set(values).size !== values.length) {
    return { success: false, reason: `Duplicate ${key} are not allowed` };
  }
  return {
    success: true,
    value: Object.freeze({ [key]: Object.freeze([...(values as number[])].sort((a, b) => a - b)) }) as Readonly<Record<Key, readonly number[]>>,
  };
}

const empty = Object.freeze({});
const allFacts = Object.freeze(Array.from({ length: 12 }, (_, index) => index + 1));

function entry<Id extends PracticeTypeId>(value: PracticeTypeRegistryEntry<Id>): PracticeTypeRegistryEntry<Id> {
  return Object.freeze(value);
}

/** Plain domain registry. It is internal: public definitions contain only an entry's stable ID. */
export const PRACTICE_TYPE_REGISTRY = Object.freeze([
  entry({ id: 'addition-1-digit', displayName: '1-Digit Addition', category: 'addition', canonicalPath: '/addition/1-digit/', baseConfig: ADDITION_1_DIGIT, defaultSkillOptions: empty, validateSkillOptions: validateEmpty }),
  entry({ id: 'addition-2digit-no-regrouping', displayName: '2-Digit Addition Without Regrouping', category: 'addition', canonicalPath: '/addition/2-digit-without-regrouping/', baseConfig: ADDITION_2_DIGIT, defaultSkillOptions: empty, validateSkillOptions: validateEmpty }),
  entry({ id: 'addition-2digit-regrouping', displayName: '2-Digit Addition With Regrouping', category: 'addition', canonicalPath: '/addition/2-digit-with-regrouping/', baseConfig: ADDITION_2_DIGIT_CARRYING, defaultSkillOptions: empty, validateSkillOptions: validateEmpty }),
  entry({ id: 'subtraction-1-digit', displayName: '1-Digit Subtraction', category: 'subtraction', canonicalPath: '/subtraction/1-digit/', baseConfig: SUBTRACTION_1_DIGIT, defaultSkillOptions: empty, validateSkillOptions: validateEmpty }),
  entry({ id: 'subtraction-2digit-no-regrouping', displayName: '2-Digit Subtraction Without Regrouping', category: 'subtraction', canonicalPath: '/subtraction/2-digit-without-regrouping/', baseConfig: SUBTRACTION_2_DIGIT, defaultSkillOptions: empty, validateSkillOptions: validateEmpty }),
  entry({ id: 'subtraction-2digit-regrouping', displayName: '2-Digit Subtraction With Regrouping', category: 'subtraction', canonicalPath: '/subtraction/2-digit-with-regrouping/', baseConfig: SUBTRACTION_2_DIGIT_BORROWING, defaultSkillOptions: empty, validateSkillOptions: validateEmpty }),
  entry({ id: 'multiplication-facts', displayName: 'Multiplication Facts', category: 'multiplication', canonicalPath: '/multiplication/facts/', baseConfig: MULTIPLICATION_FACTS, defaultSkillOptions: Object.freeze({ facts: allFacts }), validateSkillOptions: (input) => validateSelection(input, 'facts') }),
  entry({ id: 'division-facts', displayName: 'Division Facts', category: 'division', canonicalPath: '/division/facts/', baseConfig: DIVISION_FACTS, defaultSkillOptions: Object.freeze({ divisors: allFacts }), validateSkillOptions: (input) => validateSelection(input, 'divisors') }),
  entry({ id: 'division-remainders', displayName: 'Division With Remainders', category: 'division', canonicalPath: '/division/remainders/', baseConfig: DIVISION_REMAINDERS, defaultSkillOptions: empty, validateSkillOptions: validateEmpty }),
] satisfies readonly PracticeTypeRegistryEntry[]);

export function getPracticeTypeEntry(id: unknown): PracticeTypeRegistryEntry | undefined {
  return PRACTICE_TYPE_REGISTRY.find((candidate) => candidate.id === id) as PracticeTypeRegistryEntry | undefined;
}
