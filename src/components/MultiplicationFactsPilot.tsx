import { useMemo, useRef, useState } from 'react';
import PracticeWidget from './PracticeWidget';
import { MULTIPLICATION_FACTS } from '@/engine/presets';
import {
  ALL_FACTS,
  buildPracticeUrl,
  resolveInitialPilotState,
  settingsToPreset,
  type MultiplicationFactsSettings,
} from '@/engine/multiplicationFactsPilot';
import type { PracticeConfig, PracticeMode, QuestionCount, TimerDuration } from '@/engine/types';

const DURATIONS: readonly { value: TimerDuration; label: string }[] = [
  { value: 30, label: '30 seconds' }, { value: 60, label: '1 minute' },
  { value: 120, label: '2 minutes' }, { value: 300, label: '5 minutes' },
];
const QUESTION_COUNTS: readonly (QuestionCount | 'endless')[] = ['endless', 10, 20, 30, 50];

function editable(settings: MultiplicationFactsSettings): MultiplicationFactsSettings {
  return { ...settings, facts: [...settings.facts] };
}

export default function MultiplicationFactsPilot() {
  // This island is client-only so the query is resolved before PracticeWidget
  // ever mounts: there is no default problem flash or phantom session.
  const initial = useMemo(() => resolveInitialPilotState(window.location.search), []);
  const [active, setActive] = useState(() => editable(initial.settings));
  const [draft, setDraft] = useState(() => editable(initial.settings));
  const [isCustomized, setIsCustomized] = useState(initial.kind === 'preset');
  const [revision, setRevision] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [message, setMessage] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  const validDraft = settingsToPreset(draft) !== undefined;
  const config: PracticeConfig = {
    storageKey: MULTIPLICATION_FACTS.storageKey,
    label: MULTIPLICATION_FACTS.label,
    path: MULTIPLICATION_FACTS.path,
    operation: MULTIPLICATION_FACTS.operation,
    mode: active.mode,
    timerDuration: active.durationSeconds,
    fixedTimerDuration: isCustomized && active.mode === 'timed',
    operandA: MULTIPLICATION_FACTS.operandA,
    operandB: MULTIPLICATION_FACTS.operandB,
    factsMode: MULTIPLICATION_FACTS.factsMode,
    maxFactor: MULTIPLICATION_FACTS.maxFactor,
  };

  function toggleFact(fact: number) {
    const facts = draft.facts.includes(fact)
      ? draft.facts.filter((value) => value !== fact)
      : [...draft.facts, fact].sort((a, b) => a - b);
    setDraft({ ...draft, facts });
    setMessage('');
  }

  function updateMode(mode: PracticeMode) {
    setDraft({ ...draft, mode });
    setMessage('');
  }

  function startPractice() {
    const url = buildPracticeUrl(new URL(window.location.href), draft);
    if (!url) {
      setMessage('Select at least one fact family.');
      return;
    }
    setActive(editable(draft));
    setIsCustomized(true);
    setRevision((value) => value + 1);
    window.history.replaceState(window.history.state, '', url);
    setMessage('Practice restarted with these settings.');
    setExpanded(false);
    requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-practice-instrument] input')?.focus());
  }

  async function copyLink() {
    const url = buildPracticeUrl(new URL(window.location.href), active);
    if (!url) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url.href);
      } else {
        const input = document.createElement('textarea');
        input.value = url.href;
        input.style.position = 'fixed'; input.style.opacity = '0';
        document.body.append(input); input.select();
        if (!document.execCommand('copy')) throw new Error('Copy unavailable');
        input.remove();
      }
      setMessage('Practice link copied.');
    } catch {
      setMessage('Could not copy the link. You can copy it from the address bar.');
    }
  }

  return (
    <div className="w-full space-y-3">
      {initial.kind === 'invalid' && (
        <p role="status" className="max-w-lg mx-auto rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          We couldn&apos;t load those shared practice settings, so default multiplication facts practice is shown.
        </p>
      )}
      <PracticeWidget
        key={revision}
        config={config}
        variant="prototype"
        questionCount={active.questionCount}
        generationOptions={isCustomized ? { selectedFacts: active.facts } : undefined}
      />

      <div ref={panelRef} className="max-w-lg mx-auto rounded-2xl border border-[#E0E7FF] bg-white shadow-sm overflow-hidden">
        <button type="button" aria-expanded={expanded} aria-controls="practice-customizer" onClick={() => setExpanded(!expanded)}
          className="w-full min-h-12 flex items-center justify-between px-4 py-3 text-left font-semibold text-[#312E81] hover:bg-[#F8FAFF] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#4F46E5]">
          <span>Customize practice</span><span aria-hidden="true">{expanded ? '−' : '+'}</span>
        </button>
        {expanded && (
          <div id="practice-customizer" className="border-t border-[#E0E7FF] px-4 py-4 space-y-5">
            <fieldset>
              <legend className="font-semibold text-sm text-[#1E293B]">Fact families</legend>
              <div className="flex items-center justify-end gap-3 mb-2">
                <button type="button" onClick={() => setDraft({ ...draft, facts: [...ALL_FACTS] })} className="text-sm font-semibold text-[#4F46E5] underline-offset-2 hover:underline">Select all</button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {ALL_FACTS.map((fact) => <label key={fact} className={`min-h-11 rounded-lg border flex items-center justify-center gap-1.5 cursor-pointer font-semibold focus-within:ring-2 focus-within:ring-[#4F46E5] ${draft.facts.includes(fact) ? 'border-[#4F46E5] bg-[#EEF2FF] text-[#3730A3]' : 'border-[#CBD5E1] text-[#475569]'}`}>
                  <input className="accent-[#4F46E5]" type="checkbox" checked={draft.facts.includes(fact)} onChange={() => toggleFact(fact)} /> {fact}
                </label>)}
              </div>
              {!draft.facts.length && <p role="alert" className="mt-2 text-sm font-medium text-red-700">Select at least one fact family.</p>}
            </fieldset>

            <fieldset><legend className="font-semibold text-sm text-[#1E293B] mb-2">Practice mode</legend>
              <div className="grid grid-cols-2 gap-2">{(['untimed', 'timed'] as PracticeMode[]).map(mode => <label key={mode} className="flex min-h-11 items-center gap-2 rounded-lg border border-[#CBD5E1] px-3 capitalize cursor-pointer"><input type="radio" name="pilot-mode" checked={draft.mode === mode} onChange={() => updateMode(mode)} />{mode}</label>)}</div>
            </fieldset>

            {draft.mode === 'timed' && <fieldset><legend className="font-semibold text-sm text-[#1E293B] mb-2">Timer duration</legend>
              <div className="grid grid-cols-2 gap-2">{DURATIONS.map(option => <label key={option.value} className="flex min-h-11 items-center gap-2 rounded-lg border border-[#CBD5E1] px-3 text-sm cursor-pointer"><input type="radio" name="pilot-duration" checked={draft.durationSeconds === option.value} onChange={() => setDraft({ ...draft, durationSeconds: option.value })} />{option.label}</label>)}</div>
            </fieldset>}

            <fieldset><legend className="font-semibold text-sm text-[#1E293B] mb-2">Session length</legend>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{QUESTION_COUNTS.map(count => <label key={count} className="flex min-h-11 items-center gap-2 rounded-lg border border-[#CBD5E1] px-3 text-sm cursor-pointer"><input type="radio" name="pilot-count" checked={(draft.questionCount ?? 'endless') === count} onChange={() => setDraft({ ...draft, questionCount: count === 'endless' ? undefined : count })} />{count === 'endless' ? 'Endless' : `${count} questions`}</label>)}</div>
            </fieldset>

            <div className="flex flex-col sm:flex-row gap-2">
              <button type="button" disabled={!validDraft} onClick={startPractice} className="min-h-11 flex-1 rounded-xl bg-[#4F46E5] px-4 font-bold text-white hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-50">Start practice</button>
              <button type="button" disabled={!validDraft} onClick={copyLink} className="min-h-11 flex-1 rounded-xl border border-[#4F46E5] px-4 font-bold text-[#4338CA] hover:bg-[#EEF2FF] disabled:cursor-not-allowed disabled:opacity-50">Copy active link</button>
            </div>
            <p className="text-xs text-[#64748B]">Copy active link shares the settings currently driving practice. Select Start practice before sharing edited settings.</p>
          </div>
        )}
      </div>
      <p aria-live="polite" className="min-h-5 text-center text-sm font-medium text-[#475569]">{message}</p>
    </div>
  );
}
