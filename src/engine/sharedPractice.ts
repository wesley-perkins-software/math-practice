import { buildPracticeRuntimeConfig, resolvePracticeDefinition, type PracticeDefinitionV2 } from './practiceDefinition';

export function formatPracticeSummary(definition: PracticeDefinitionV2): string {
  const { entry } = resolvePracticeDefinition(definition);
  let skill = entry.displayName;
  if (definition.practiceType === 'multiplication-facts') skill += `: ${definition.skillOptions.facts.join(', ')}`;
  if (definition.practiceType === 'division-facts') skill += `: ${definition.skillOptions.divisors.join(', ')}`;
  const session = definition.sessionOptions;
  const count = session.questionCount;
  if (session.mode === 'untimed') return `${skill} · ${count ? `${count} questions · ` : ''}Untimed`;
  const duration = session.durationSeconds < 60 ? `${session.durationSeconds} seconds` : `${session.durationSeconds / 60} ${session.durationSeconds === 60 ? 'minute' : 'minutes'}`;
  return `${skill} · ${duration}${count ? ` · Up to ${count} questions` : ''}`;
}

export function prepareSharedPractice(definition: PracticeDefinitionV2) {
  return Object.freeze({ definition, config: buildPracticeRuntimeConfig(definition), questionCount: definition.sessionOptions.questionCount, summary: formatPracticeSummary(definition) });
}
