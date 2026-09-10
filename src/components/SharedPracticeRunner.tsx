import { useEffect, useRef, useState } from 'react';
import PracticeWidget from './PracticeWidget';
import { parsePracticeDefinitionV2Query } from '@/engine/practiceDefinitionUrl';
import { prepareSharedPractice } from '@/engine/sharedPractice';
import { deriveSafePracticeDimensions, trackCreatePracticeEvent } from '@/lib/createPracticeAnalytics';
import type { SessionResult } from '@/engine/types';

type State = { status: 'initializing' } | { status: 'invalid' } | { status: 'valid'; practice: ReturnType<typeof prepareSharedPractice> };

export default function SharedPracticeRunner() {
  const [state, setState] = useState<State>({ status: 'initializing' });
  const openTracked = useRef(false);
  useEffect(() => {
    const parsed = parsePracticeDefinitionV2Query(window.location.search);
    setState(parsed.success ? { status: 'valid', practice: prepareSharedPractice(parsed.value) } : { status: 'invalid' });
  }, []);
  useEffect(() => {
    if (state.status !== 'valid' || openTracked.current) return;
    openTracked.current = true;
    trackCreatePracticeEvent('shared_practice_open', deriveSafePracticeDimensions(state.practice.definition));
  }, [state]);
  if (state.status === 'initializing') return <div className="min-h-64 flex items-center justify-center text-[#64748B]" role="status">Loading practice…</div>;
  if (state.status === 'invalid') return (
    <section className="max-w-xl mx-auto bg-white border border-[#E4E1F5] rounded-2xl p-6 sm:p-8 text-center shadow-sm">
      <h1 className="text-2xl font-bold text-[#1E293B]">This practice link is invalid or no longer supported.</h1>
      <p className="mt-3 text-base text-[#334155]">Check that the full link was copied correctly.</p>
      <a className="inline-flex mt-6 rounded-lg bg-[#4F46E5] px-4 py-2.5 text-white font-semibold hover:bg-[#4338CA]" href="/">Browse math practice</a>
    </section>
  );
  const { config, questionCount, heading } = state.practice;
  const dimensions = deriveSafePracticeDimensions(state.practice.definition);
  const handleComplete = (result: SessionResult) => trackCreatePracticeEvent('shared_practice_complete', {
    ...dimensions,
    ...(result.completionReason === undefined ? {} : { completion_reason: result.completionReason }),
  });
  return (
    <section aria-labelledby="shared-practice-title">
      <header className="mx-auto mb-3 max-w-3xl px-2 text-center">
        <h1 id="shared-practice-title" className="text-xl sm:text-2xl font-bold leading-tight text-[#1E293B]">{heading.title}</h1>
        <ul aria-label="Assignment details" className="mt-1 flex flex-wrap justify-center gap-x-2 gap-y-1 text-sm font-medium text-[#334155]">
          {heading.details.map((detail, index) => <li key={detail}>{index > 0 && <span aria-hidden="true" className="mr-2">·</span>}{detail}</li>)}
        </ul>
      </header>
      <PracticeWidget config={config} questionCount={questionCount} variant="prototype" sessionPresentation="shared"
        onFirstAcceptedAnswer={() => trackCreatePracticeEvent('shared_practice_start', dimensions)}
        onSessionComplete={handleComplete}
        onReplay={() => trackCreatePracticeEvent('shared_practice_replay', { practice_type: dimensions.practice_type, category: dimensions.category, session_mode: dimensions.session_mode })} />
    </section>
  );
}
