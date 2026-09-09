import { useEffect, useState } from 'react';
import PracticeWidget from './PracticeWidget';
import { parsePracticeDefinitionV2Query } from '@/engine/practiceDefinitionUrl';
import { prepareSharedPractice } from '@/engine/sharedPractice';

type State = { status: 'initializing' } | { status: 'invalid' } | { status: 'valid'; practice: ReturnType<typeof prepareSharedPractice> };

export default function SharedPracticeRunner() {
  const [state, setState] = useState<State>({ status: 'initializing' });
  useEffect(() => {
    const parsed = parsePracticeDefinitionV2Query(window.location.search);
    setState(parsed.success ? { status: 'valid', practice: prepareSharedPractice(parsed.value) } : { status: 'invalid' });
  }, []);
  if (state.status === 'initializing') return <div className="min-h-64 flex items-center justify-center text-[#64748B]" role="status">Loading practice…</div>;
  if (state.status === 'invalid') return (
    <section className="max-w-xl mx-auto bg-white border border-[#E4E1F5] rounded-2xl p-6 sm:p-8 text-center shadow-sm">
      <h1 className="text-2xl font-bold text-[#1E293B]">This practice link is invalid or no longer supported.</h1>
      <p className="mt-3 text-[#475569]">Check that the full link was copied correctly.</p>
      <a className="inline-flex mt-6 rounded-lg bg-[#4F46E5] px-4 py-2.5 text-white font-semibold hover:bg-[#4338CA]" href="/">Browse math practice</a>
    </section>
  );
  const { config, questionCount, summary } = state.practice;
  return <section aria-labelledby="shared-practice-title"><div className="text-center mb-5"><h1 id="shared-practice-title" className="text-2xl sm:text-3xl font-bold text-[#1E293B]">Shared Practice</h1><p className="mt-2 text-sm sm:text-base font-medium text-[#475569]">{summary}</p></div><PracticeWidget config={config} questionCount={questionCount} /></section>;
}
