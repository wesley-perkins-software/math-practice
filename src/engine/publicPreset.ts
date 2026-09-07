/**
 * The deliberately small, versioned vocabulary accepted from future public
 * configuration. This type is separate from the internal Operation union so a
 * future internal-only operation cannot accidentally become public input.
 *
 * Route identity, generation semantics, storage, rendering, feedback, and
 * metadata are intentionally absent. Those values remain owned by the route's
 * PracticeConfig.
 */
export type PublicOperation = 'addition' | 'subtraction' | 'multiplication' | 'division';
export type PublicPracticeMode = 'untimed' | 'timed';
export type PublicTimerDuration = 30 | 60 | 120 | 300;
export type PublicQuestionCount = 10 | 20 | 30 | 50;

export interface PublicPracticePresetV1 {
  readonly version: 1;
  readonly facts?: readonly number[];
  readonly operations?: readonly PublicOperation[];
  readonly mode?: PublicPracticeMode;
  readonly durationSeconds?: PublicTimerDuration;
  /** Valid public state for a later session consumer; currently no page uses it. */
  readonly questionCount?: PublicQuestionCount;
}

/** A route opts into only the public choices it can safely interpret. */
export interface RoutePracticeCapability {
  readonly facts?: { readonly allowed: readonly number[] };
  readonly operations?: { readonly allowed: readonly PublicOperation[] };
  readonly mode?: boolean;
  readonly durations?: readonly PublicTimerDuration[];
  readonly questionCounts?: readonly PublicQuestionCount[];
}

export type PublicPresetField =
  | 'preset'
  | 'version'
  | 'facts'
  | 'operations'
  | 'mode'
  | 'durationSeconds'
  | 'questionCount';

export type PublicPresetValidationResult =
  | { readonly success: true; readonly value: PublicPracticePresetV1 }
  | { readonly success: false; readonly error: { readonly field: PublicPresetField; readonly reason: string } };

/**
 * Approved values that future session/generation code may consume. It is not a
 * PracticeConfig and physically cannot carry route or internal identity fields.
 */
export interface ResolvedPracticeOverrides {
  readonly selectedFacts?: readonly number[];
  readonly operations?: readonly PublicOperation[];
  readonly mode?: PublicPracticeMode;
  readonly durationSeconds?: PublicTimerDuration;
  readonly questionCount?: PublicQuestionCount;
}

const PUBLIC_OPERATIONS: readonly PublicOperation[] = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
];
const PUBLIC_MODES: readonly PublicPracticeMode[] = ['untimed', 'timed'];
const PUBLIC_DURATIONS: readonly PublicTimerDuration[] = [30, 60, 120, 300];
const PUBLIC_QUESTION_COUNTS: readonly PublicQuestionCount[] = [10, 20, 30, 50];
const FACTS_1_TO_12 = Object.freeze(Array.from({ length: 12 }, (_, index) => index + 1));

/** Named policy for the pilot route; it is intentionally not wired to a page yet. */
export const MULTIPLICATION_FACTS_CAPABILITY: RoutePracticeCapability = Object.freeze({
  facts: Object.freeze({ allowed: FACTS_1_TO_12 }),
  operations: Object.freeze({ allowed: Object.freeze(['multiplication'] as PublicOperation[]) }),
  mode: true,
  durations: Object.freeze([...PUBLIC_DURATIONS]),
  questionCounts: Object.freeze([...PUBLIC_QUESTION_COUNTS]),
});

function failure(field: PublicPresetField, reason: string): PublicPresetValidationResult {
  return { success: false, error: { field, reason } };
}

function hasOwn(input: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(input, key);
}

function isAllowed<T>(value: unknown, values: readonly T[]): value is T {
  return values.some((allowed) => value === allowed);
}

/**
 * Validates already-structured, untrusted data. Recognized fields fail as a
 * unit; unrelated keys are ignored and are never copied into the result.
 * Timed mode requires a duration, while untimed mode and an omitted mode forbid
 * one, keeping timer intent explicit.
 */
export function validatePublicPracticePreset(
  input: unknown,
  capability: RoutePracticeCapability,
): PublicPresetValidationResult {
  try {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      return failure('preset', 'Expected an object');
    }

    const candidate = input as Record<string, unknown>;
    if (!hasOwn(candidate, 'version') || candidate.version !== 1) {
      return failure('version', 'Only public preset version 1 is supported');
    }

    let facts: readonly number[] | undefined;
    if (hasOwn(candidate, 'facts')) {
      if (!capability.facts) return failure('facts', 'Facts are locked by this route');
      if (!Array.isArray(candidate.facts) || candidate.facts.length === 0 || candidate.facts.length > 12) {
        return failure('facts', 'Facts must contain between 1 and 12 values');
      }
      if (candidate.facts.some((fact) => !Number.isInteger(fact) || fact < 1 || fact > 12)) {
        return failure('facts', 'Facts must be integers from 1 through 12');
      }
      const numericFacts = candidate.facts as number[];
      if (new Set(numericFacts).size !== numericFacts.length) {
        return failure('facts', 'Duplicate facts are not allowed');
      }
      if (numericFacts.some((fact) => !capability.facts!.allowed.includes(fact))) {
        return failure('facts', 'A fact is not supported by this route');
      }
      facts = Object.freeze([...numericFacts].sort((left, right) => left - right));
    }

    let operations: readonly PublicOperation[] | undefined;
    if (hasOwn(candidate, 'operations')) {
      if (!capability.operations) return failure('operations', 'Operations are locked by this route');
      if (!Array.isArray(candidate.operations) || candidate.operations.length === 0 || candidate.operations.length > 4) {
        return failure('operations', 'Operations must contain between 1 and 4 values');
      }
      if (candidate.operations.some((operation) => !isAllowed(operation, PUBLIC_OPERATIONS))) {
        return failure('operations', 'An operation is unknown');
      }
      const publicOperations = candidate.operations as PublicOperation[];
      if (new Set(publicOperations).size !== publicOperations.length) {
        return failure('operations', 'Duplicate operations are not allowed');
      }
      if (publicOperations.some((operation) => !capability.operations!.allowed.includes(operation))) {
        return failure('operations', 'An operation is locked by this route');
      }
      operations = Object.freeze(
        [...publicOperations].sort(
          (left, right) => PUBLIC_OPERATIONS.indexOf(left) - PUBLIC_OPERATIONS.indexOf(right),
        ),
      );
    }

    let mode: PublicPracticeMode | undefined;
    if (hasOwn(candidate, 'mode')) {
      if (!capability.mode) return failure('mode', 'Mode is locked by this route');
      if (!isAllowed(candidate.mode, PUBLIC_MODES)) return failure('mode', 'Mode is invalid');
      mode = candidate.mode;
    }

    let durationSeconds: PublicTimerDuration | undefined;
    if (hasOwn(candidate, 'durationSeconds')) {
      if (!capability.durations) return failure('durationSeconds', 'Duration is locked by this route');
      if (!isAllowed(candidate.durationSeconds, PUBLIC_DURATIONS)) {
        return failure('durationSeconds', 'Duration is not a supported V1 value');
      }
      if (!capability.durations.includes(candidate.durationSeconds)) {
        return failure('durationSeconds', 'Duration is not supported by this route');
      }
      durationSeconds = candidate.durationSeconds;
    }
    if (mode === 'timed' && durationSeconds === undefined) {
      return failure('durationSeconds', 'Timed mode requires a duration');
    }
    if (mode !== 'timed' && durationSeconds !== undefined) {
      return failure('durationSeconds', 'Duration requires timed mode');
    }

    let questionCount: PublicQuestionCount | undefined;
    if (hasOwn(candidate, 'questionCount')) {
      if (!capability.questionCounts) return failure('questionCount', 'Question count is locked by this route');
      if (!isAllowed(candidate.questionCount, PUBLIC_QUESTION_COUNTS)) {
        return failure('questionCount', 'Question count is not a supported V1 value');
      }
      if (!capability.questionCounts.includes(candidate.questionCount)) {
        return failure('questionCount', 'Question count is not supported by this route');
      }
      questionCount = candidate.questionCount;
    }

    return {
      success: true,
      value: Object.freeze({
        version: 1,
        ...(facts === undefined ? {} : { facts }),
        ...(operations === undefined ? {} : { operations }),
        ...(mode === undefined ? {} : { mode }),
        ...(durationSeconds === undefined ? {} : { durationSeconds }),
        ...(questionCount === undefined ? {} : { questionCount }),
      }),
    };
  } catch {
    // Getters and proxies can throw even while inspecting an apparent object.
    return failure('preset', 'Preset could not be safely inspected');
  }
}

/** Copies only the explicitly public, validated override vocabulary. */
export function toPracticeOverrides(preset: PublicPracticePresetV1): ResolvedPracticeOverrides {
  return Object.freeze({
    ...(preset.facts === undefined ? {} : { selectedFacts: Object.freeze([...preset.facts]) }),
    ...(preset.operations === undefined ? {} : { operations: Object.freeze([...preset.operations]) }),
    ...(preset.mode === undefined ? {} : { mode: preset.mode }),
    ...(preset.durationSeconds === undefined ? {} : { durationSeconds: preset.durationSeconds }),
    ...(preset.questionCount === undefined ? {} : { questionCount: preset.questionCount }),
  });
}
