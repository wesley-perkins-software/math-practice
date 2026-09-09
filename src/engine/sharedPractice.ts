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

export function formatSharedPracticeHeading(definition: PracticeDefinitionV2): SharedPracticeHeading {
  const { entry } = resolvePracticeDefinition(definition);
  const details: string[] = [];
  if (definition.practiceType === 'multiplication-facts') details.push(`${definition.skillOptions.facts.join(', ')} facts`);
  if (definition.practiceType === 'division-facts') details.push(`Divide by ${definition.skillOptions.divisors.join(', ')}`);
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
  return Object.freeze({ definition, config: buildPracticeRuntimeConfig(definition), questionCount: definition.sessionOptions.questionCount, heading: formatSharedPracticeHeading(definition) });
}
