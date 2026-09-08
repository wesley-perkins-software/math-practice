import {
  validatePublicPracticePreset,
  type PublicPracticePresetV1,
  type PublicPresetField,
  type PublicPresetValidationResult,
  type RoutePracticeCapability,
} from './publicPreset';

const PARAMETER_FIELDS = {
  v: 'version',
  facts: 'facts',
  operations: 'operations',
  mode: 'mode',
  duration: 'durationSeconds',
  questions: 'questionCount',
} as const satisfies Record<string, PublicPresetField>;

type PublicPresetParameter = keyof typeof PARAMETER_FIELDS;

function failure(field: PublicPresetField, reason: string): PublicPresetValidationResult {
  return { success: false, error: { field, reason } };
}

function parseInteger(value: string): number | undefined {
  // Leading signs, decimal points, whitespace, exponents, and leading zeroes
  // are deliberately outside the canonical public URL grammar.
  return /^[1-9]\d*$/.test(value) ? Number(value) : undefined;
}

/**
 * Decodes an untrusted public-preset query and then delegates all semantic and
 * route-specific decisions to validatePublicPracticePreset. Unknown and
 * duplicate parameters are rejected so a misspelled shared setting cannot be
 * silently ignored. Invalid input never produces a partial preset.
 *
 * A future page consumer should treat a failure as "no public preset" and keep
 * using its normal route defaults; this codec does not alter page state.
 */
export function parsePublicPracticePresetQuery(
  query: string | URLSearchParams,
  capability: RoutePracticeCapability,
): PublicPresetValidationResult {
  try {
    const searchParams = typeof query === 'string' ? new URLSearchParams(query) : query;
    const values = new Map<PublicPresetParameter, string>();

    for (const [key, value] of searchParams) {
      if (!(key in PARAMETER_FIELDS)) return failure('preset', `Unknown public preset parameter: ${key}`);
      const parameter = key as PublicPresetParameter;
      if (values.has(parameter)) return failure(PARAMETER_FIELDS[parameter], `Duplicate parameter: ${key}`);
      if (value === '') return failure(PARAMETER_FIELDS[parameter], `Empty parameter: ${key}`);
      values.set(parameter, value);
    }

    if (values.get('v') !== '1') return failure('version', 'Public preset URLs require v=1');

    const candidate: Record<string, unknown> = { version: 1 };
    const facts = values.get('facts');
    if (facts !== undefined) {
      const parsed = facts.split(',').map(parseInteger);
      if (parsed.some((value) => value === undefined)) return failure('facts', 'Facts must be comma-separated integers');
      candidate.facts = parsed;
    }

    const operations = values.get('operations');
    if (operations !== undefined) candidate.operations = operations.split(',');
    const mode = values.get('mode');
    if (mode !== undefined) candidate.mode = mode;

    const duration = values.get('duration');
    if (duration !== undefined) {
      const parsed = parseInteger(duration);
      if (parsed === undefined) return failure('durationSeconds', 'Duration must be a plain positive integer');
      candidate.durationSeconds = parsed;
    }

    const questions = values.get('questions');
    if (questions !== undefined) {
      const parsed = parseInteger(questions);
      if (parsed === undefined) return failure('questionCount', 'Questions must be a plain positive integer');
      candidate.questionCount = parsed;
    }

    return validatePublicPracticePreset(candidate, capability);
  } catch {
    return failure('preset', 'Query could not be safely inspected');
  }
}

/** Serializes an already validated and normalized V1 preset without defaults. */
export function serializePublicPracticePreset(preset: PublicPracticePresetV1): string {
  const searchParams = new URLSearchParams();
  searchParams.set('v', String(preset.version));
  if (preset.facts !== undefined) searchParams.set('facts', preset.facts.join(','));
  if (preset.operations !== undefined) searchParams.set('operations', preset.operations.join(','));
  if (preset.mode !== undefined) searchParams.set('mode', preset.mode);
  if (preset.durationSeconds !== undefined) searchParams.set('duration', String(preset.durationSeconds));
  if (preset.questionCount !== undefined) searchParams.set('questions', String(preset.questionCount));
  // URLSearchParams safely escapes values, but commas are the deliberate,
  // readable separators in this contract rather than opaque data.
  return searchParams.toString().replaceAll('%2C', ',');
}
