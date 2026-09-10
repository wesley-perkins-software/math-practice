import { buildPracticeRuntimeConfig, resolvePracticeDefinition, type PracticeDefinitionV2 } from './practiceDefinition';

export interface SharedPracticeHeading {
  title: string;
  details: readonly string[];
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  const minutes = seconds / 60;
  return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
}

const FULL_SELECTION_SIZE = 12;

function formatNaturalList(values: readonly number[]): string {
  if (values.length === 1) return `${values[0]}`;
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(', ')}, and ${values[values.length - 1]}`;
}

export interface FormatSharedPracticeHeadingOptions {
  /** When the full 1–12 range is selected, 'label' (default) shows "All facts"/"All divisors"; 'omit' drops the detail entirely (the runner's H1 already names the skill). */
  readonly fullSelectionDetail?: 'label' | 'omit';
}

export function formatSharedPracticeHeading(definition: PracticeDefinitionV2, options?: FormatSharedPracticeHeadingOptions): SharedPracticeHeading {
  const { entry } = resolvePracticeDefinition(definition);
  const omitFullSelection = options?.fullSelectionDetail === 'omit';
  const details: string[] = [];
  if (definition.practiceType === 'multiplication-facts') {
    const { facts } = definition.skillOptions;
    if (facts.length >= FULL_SELECTION_SIZE) { if (!omitFullSelection) details.push('All facts'); }
    else details.push(`${formatNaturalList(facts)} facts`);
  }
  if (definition.practiceType === 'division-facts') {
    const { divisors } = definition.skillOptions;
    if (divisors.length >= FULL_SELECTION_SIZE) { if (!omitFullSelection) details.push('All divisors'); }
    else details.push(`Divide by ${formatNaturalList(divisors)}`);
  }
  const session = definition.sessionOptions;
  const count = session.questionCount;
  if (session.mode === 'untimed') {
    if (count) details.push(`${count} questions`);
    details.push('Untimed');
  } else {
    details.push(formatDuration(session.durationSeconds));
    if (count) details.push(`Up to ${count} questions`);
  }
  return Object.freeze({ title: entry.displayName, details: Object.freeze(details) });
}

export function prepareSharedPractice(definition: PracticeDefinitionV2) {
  return Object.freeze({
    definition,
    config: buildPracticeRuntimeConfig(definition),
    questionCount: definition.sessionOptions.questionCount,
    heading: formatSharedPracticeHeading(definition, { fullSelectionDetail: 'omit' }),
  });
}
