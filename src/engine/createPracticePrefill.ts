import { DEFAULT_CREATE_PRACTICE_STATE, selectCreatePracticeType, type CreatePracticeState } from './createPractice';
import { getPracticeTypeEntry } from './practiceTypes';

const SKILL_PARAMETER: Readonly<Record<string, 'facts' | 'divisors' | undefined>> = Object.freeze({
  'multiplication-facts': 'facts',
  'division-facts': 'divisors',
});

// Deliberately much smaller than the /practice/ V2 query grammar: this exists
// only to seed the /create/ builder's initial state (skill + selection), not
// to represent a durable, shareable practice definition. No version
// parameter, no session options, no error surface — any parameter this
// contract doesn't recognize fails the whole prefill, and the caller falls
// back to the normal blank creator rather than showing an error.
const MAX_QUERY_LENGTH = 4096;
const MAX_PARAMETER_LENGTH = 256;
const MAX_SELECTION_VALUES = 12;

function parseInteger(value: string): number | undefined {
  return /^[1-9]\d*$/.test(value) ? Number(value) : undefined;
}

/**
 * Reads only `skill` (and, when relevant, its matching `facts`/`divisors`)
 * from an untrusted query string to seed the /create/ builder's initial
 * state. Returns undefined for anything invalid or unrecognized so the
 * caller can silently fall back to DEFAULT_CREATE_PRACTICE_STATE — this is
 * convenience state, not a shared assignment link.
 */
export function parseCreatePracticePrefill(query: string | URLSearchParams): CreatePracticeState | undefined {
  try {
    if (typeof query === 'string' && query.length > MAX_QUERY_LENGTH) return undefined;
    const params = typeof query === 'string' ? new URLSearchParams(query) : query;
    const values = new Map<string, string>();
    for (const [key, value] of params) {
      if (key.length > MAX_PARAMETER_LENGTH || value.length > MAX_PARAMETER_LENGTH) return undefined;
      if (values.has(key)) return undefined;
      if (value === '') return undefined;
      values.set(key, value);
    }

    const skill = values.get('skill');
    if (!skill) return undefined;
    const entry = getPracticeTypeEntry(skill);
    if (!entry) return undefined;

    const skillParameter = SKILL_PARAMETER[entry.id];
    const allowed = new Set<string>(['skill']);
    if (skillParameter) allowed.add(skillParameter);
    for (const key of values.keys()) if (!allowed.has(key)) return undefined;

    const base = selectCreatePracticeType(DEFAULT_CREATE_PRACTICE_STATE, entry.id);
    if (!skillParameter) return base;

    const raw = values.get(skillParameter);
    if (raw === undefined) return base; // Skill-only prefill keeps the registry's normal default selection.

    if (raw.split(',', MAX_SELECTION_VALUES + 1).length > MAX_SELECTION_VALUES) return undefined;
    const tokens = raw.split(',');
    const parsed = tokens.map(parseInteger);
    if (parsed.some((value) => value === undefined)) return undefined;
    const numbers = parsed as number[];
    if (numbers.length === 0) return undefined;
    if (numbers.some((value) => value < 1 || value > 12)) return undefined;
    if (new Set(numbers).size !== numbers.length) return undefined;
    const normalized = Object.freeze([...numbers].sort((a, b) => a - b));

    return Object.freeze({ ...base, skillOptions: Object.freeze({ [skillParameter]: normalized }) });
  } catch {
    return undefined;
  }
}

/** Builds a contextual /create/ prefill href for a single-value fact/divisor selection. */
export function buildCreatePracticePrefillHref(practiceType: 'multiplication-facts' | 'division-facts', values: readonly number[]): string {
  const key = SKILL_PARAMETER[practiceType]!;
  const params = new URLSearchParams();
  params.set('skill', practiceType);
  params.set(key, values.join(','));
  return `/create/?${params.toString().replaceAll('%2C', ',')}`;
}
