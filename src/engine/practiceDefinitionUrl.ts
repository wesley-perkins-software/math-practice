import {
  PRACTICE_DEFINITION_VERSION,
  validatePracticeDefinitionV2,
  type PracticeDefinitionV2,
  type PracticeDefinitionValidationResult,
} from './practiceDefinition';
import { getPracticeTypeEntry } from './practiceTypes';

const COMMON_PARAMETERS = new Set(['v', 'skill', 'mode', 'duration', 'problems']);
const SKILL_PARAMETER: Readonly<Record<string, 'facts' | 'divisors' | undefined>> = Object.freeze({
  'multiplication-facts': 'facts',
  'division-facts': 'divisors',
});

// Public definitions are tiny (at most 12 selected values). Reject excessive
// transport input before doing list work; URLSearchParams inputs receive the
// same per-field and parameter-count checks as raw query strings.
const MAX_QUERY_LENGTH = 4096;
const MAX_PARAMETER_LENGTH = 256;
const MAX_PARAMETERS = 8;
const MAX_SELECTION_VALUES = 12;

const failure = (field: string, reason: string): PracticeDefinitionValidationResult =>
  ({ success: false, error: { field, reason } });

function parseInteger(value: string): number | undefined {
  return /^[1-9]\d*$/.test(value) ? Number(value) : undefined;
}

/** Strictly decodes URL grammar, then delegates every domain rule to the V2 validator. */
export function parsePracticeDefinitionV2Query(query: string | URLSearchParams): PracticeDefinitionValidationResult {
  try {
    if (typeof query === 'string' && query.length > MAX_QUERY_LENGTH) return failure('definition', 'Query is too long');
    const params = typeof query === 'string' ? new URLSearchParams(query) : query;
    const values = new Map<string, string>();
    for (const [key, value] of params) {
      if (values.size >= MAX_PARAMETERS) return failure('definition', 'Query has too many parameters');
      if (key.length > MAX_PARAMETER_LENGTH || value.length > MAX_PARAMETER_LENGTH) return failure('definition', 'Query parameter is too long');
      if (values.has(key)) return failure(key, `Duplicate parameter: ${key}`);
      if (value === '') return failure(key, `Empty parameter: ${key}`);
      values.set(key, value);
    }
    if (values.get('v') !== String(PRACTICE_DEFINITION_VERSION)) return failure('version', 'Practice links require v=2');
    const skill = values.get('skill');
    if (!skill) return failure('practiceType', 'Practice type is required');
    const entry = getPracticeTypeEntry(skill);
    if (!entry) return failure('practiceType', 'Practice type is unknown');
    const skillParameter = SKILL_PARAMETER[entry.id];
    const allowed = new Set(COMMON_PARAMETERS);
    if (skillParameter) allowed.add(skillParameter);
    for (const key of values.keys()) if (!allowed.has(key)) return failure(key, `Unknown parameter: ${key}`);

    let skillOptions: Record<string, unknown> = {};
    if (skillParameter) {
      const raw = values.get(skillParameter);
      if (raw === undefined) return failure('skillOptions', `${skillParameter} is required`);
      if (raw.split(',', MAX_SELECTION_VALUES + 1).length > MAX_SELECTION_VALUES) {
        return failure('skillOptions', `${skillParameter} has too many values`);
      }
      const parsed = raw.split(',').map(parseInteger);
      if (parsed.some((item) => item === undefined)) return failure('skillOptions', `${skillParameter} must be comma-separated integers`);
      skillOptions = { [skillParameter]: parsed };
    }
    const mode = values.get('mode');
    if (!mode) return failure('sessionOptions', 'Mode is required');
    const sessionOptions: Record<string, unknown> = { mode };
    const duration = values.get('duration');
    if (duration !== undefined) {
      const parsed = parseInteger(duration);
      if (parsed === undefined) return failure('sessionOptions', 'Duration must be a plain positive integer');
      sessionOptions.durationSeconds = parsed;
    }
    const problems = values.get('problems');
    if (problems !== undefined) {
      const parsed = parseInteger(problems);
      if (parsed === undefined) return failure('sessionOptions', 'Problems must be a plain positive integer');
      sessionOptions.questionCount = parsed;
    }
    return validatePracticeDefinitionV2({ version: 2, practiceType: skill, skillOptions, sessionOptions });
  } catch {
    return failure('definition', 'Query could not be safely inspected');
  }
}

/** Serializes an already validated/normalized definition in canonical parameter order. */
export function serializePracticeDefinitionV2(definition: PracticeDefinitionV2): string {
  const params = new URLSearchParams();
  params.set('v', '2');
  params.set('skill', definition.practiceType);
  if (definition.practiceType === 'multiplication-facts') params.set('facts', definition.skillOptions.facts.join(','));
  if (definition.practiceType === 'division-facts') params.set('divisors', definition.skillOptions.divisors.join(','));
  params.set('mode', definition.sessionOptions.mode);
  if (definition.sessionOptions.mode === 'timed') params.set('duration', String(definition.sessionOptions.durationSeconds));
  if (definition.sessionOptions.questionCount !== undefined) params.set('problems', String(definition.sessionOptions.questionCount));
  return params.toString().replaceAll('%2C', ',');
}
