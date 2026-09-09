import { useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_CREATE_PRACTICE_STATE, absolutePracticeUrl, deriveCreatePractice, selectCreatePracticeType, type CreatePracticeState } from '@/engine/createPractice';
import { PRACTICE_CATEGORY_IDS, PRACTICE_TYPE_REGISTRY, type PracticeCategoryId, type PracticeTypeId } from '@/engine/practiceTypes';
import { formatDuration, formatSharedPracticeHeading } from '@/engine/sharedPractice';
import type { PracticeMode, QuestionCount, TimerDuration } from '@/engine/types';

const CATEGORY_NAMES: Record<PracticeCategoryId, string> = { addition: 'Addition', subtraction: 'Subtraction', multiplication: 'Multiplication', division: 'Division' };
const COUNTS: readonly (QuestionCount | undefined)[] = [undefined, 10, 20, 30, 50];
const DURATIONS: readonly TimerDuration[] = [30, 60, 120, 300];

function SelectionGrid({ kind, values, onChange }: { kind: 'facts' | 'divisors'; values: readonly number[]; onChange: (values: number[]) => void }) {
  const noun = kind === 'facts' ? 'facts' : 'numbers';
  const toggle = (value: number) => {
    if (values.includes(value)) {
      if (values.length === 1) return;
      onChange(values.filter((item) => item !== value));
    } else onChange([...values, value]);
  };
  return <fieldset className="builder-card">
    <legend className="builder-heading">{kind === 'facts' ? 'Choose the facts' : 'Choose what to divide by'}</legend>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <p className="builder-help">Select one or more {noun}. At least one must stay selected.</p>
      <button type="button" className="builder-text-button" onClick={() => onChange(Array.from({ length: 12 }, (_, i) => i + 1))}>Select all</button>
    </div>
    <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
      {Array.from({ length: 12 }, (_, i) => i + 1).map((value) => <button key={value} type="button" aria-pressed={values.includes(value)} onClick={() => toggle(value)} className="builder-number-button">
        {kind === 'facts' ? value : `÷ ${value}`}<span className="sr-only"> {values.includes(value) ? 'selected' : 'not selected'}</span>
      </button>)}
    </div>
  </fieldset>;
}

async function copyText(text: string, fallback: HTMLInputElement | null): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch {
    if (!fallback) return false;
    fallback.focus(); fallback.select();
    try { return document.execCommand('copy'); } catch { return false; }
  }
}

export default function CreatePracticeBuilder() {
  const [state, setState] = useState<CreatePracticeState>(DEFAULT_CREATE_PRACTICE_STATE);
  const [origin, setOrigin] = useState('');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const urlInput = useRef<HTMLInputElement>(null);
  const derived = useMemo(() => deriveCreatePractice(state), [state]);
  const relativeUrl = derived.success ? derived.relativeUrl : '';
  const shareUrl = relativeUrl && origin ? absolutePracticeUrl(relativeUrl, origin) : relativeUrl;
  useEffect(() => setOrigin(window.location.origin), []);
  useEffect(() => setCopyStatus('idle'), [relativeUrl]);
  useEffect(() => { if (copyStatus !== 'copied') return; const timer = window.setTimeout(() => setCopyStatus('idle'), 2500); return () => clearTimeout(timer); }, [copyStatus]);

  const update = (changes: Partial<CreatePracticeState>) => setState((current) => ({ ...current, ...changes }));
  const chooseType = (id: PracticeTypeId) => setState((current) => selectCreatePracticeType(current, id));
  const setSelection = (key: 'facts' | 'divisors', values: number[]) => update({ skillOptions: { [key]: values } });
  const selectClass = 'builder-select';

  return <div className="space-y-6">
    <fieldset className="builder-card">
      <legend className="builder-heading">Choose what to practice</legend>
      <p className="builder-help">Pick one skill. You can change it at any time.</p>
      <div className="mt-5 space-y-5">
        {PRACTICE_CATEGORY_IDS.map((category) => <div key={category}>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-[#4338CA]">{CATEGORY_NAMES[category]}</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {PRACTICE_TYPE_REGISTRY.filter((entry) => entry.category === category).map((entry) => <label key={entry.id} className="builder-type-option">
              <input type="radio" name="practice-type" value={entry.id} checked={state.practiceType === entry.id} onChange={() => chooseType(entry.id)} />
              <span>{entry.displayName}</span>
            </label>)}
          </div>
        </div>)}
      </div>
    </fieldset>

    {state.practiceType === 'multiplication-facts' && <SelectionGrid kind="facts" values={((state.skillOptions as { facts?: readonly number[] }).facts) ?? []} onChange={(v) => setSelection('facts', v)} />}
    {state.practiceType === 'division-facts' && <SelectionGrid kind="divisors" values={((state.skillOptions as { divisors?: readonly number[] }).divisors) ?? []} onChange={(v) => setSelection('divisors', v)} />}

    {state.practiceType && <fieldset className="builder-card">
      <legend className="builder-heading">Practice settings</legend>
      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        <label className="builder-label">Mode<select className={selectClass} value={state.mode} onChange={(e) => update({ mode: e.target.value as PracticeMode })}><option value="untimed">Untimed</option><option value="timed">Timed</option></select></label>
        {state.mode === 'timed' && <label className="builder-label">Timer<select className={selectClass} value={state.durationSeconds} onChange={(e) => update({ durationSeconds: Number(e.target.value) as TimerDuration })}>{DURATIONS.map((duration) => <option key={duration} value={duration}>{formatDuration(duration)}</option>)}</select></label>}
        <label className="builder-label">Question limit<select className={selectClass} value={state.questionCount ?? 'endless'} onChange={(e) => update({ questionCount: e.target.value === 'endless' ? undefined : Number(e.target.value) as QuestionCount })}>{COUNTS.map((count) => <option key={count ?? 'endless'} value={count ?? 'endless'}>{count ? `${count} questions` : 'Endless'}</option>)}</select></label>
      </div>
      {state.mode === 'timed' && <p className="builder-help mt-4">If you set both a timer and question limit, practice ends when either one is reached.</p>}
    </fieldset>}

    {derived.success ? (() => { const heading = formatSharedPracticeHeading(derived.definition); return <section className="builder-summary" aria-labelledby="practice-summary-title">
      <p className="text-sm font-bold uppercase tracking-wide text-[#4F46E5]">Your practice</p>
      <h2 id="practice-summary-title" className="mt-2 text-2xl font-extrabold text-[#1E293B]">{heading.title}</h2>
      <p className="mt-2 font-medium text-[#475569]">{heading.details.join(' · ')}</p>
      <label className="mt-5 block text-sm font-semibold text-[#334155]">Practice link<input ref={urlInput} className="builder-url" readOnly value={shareUrl} onFocus={(e) => e.currentTarget.select()} /></label>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button type="button" className="builder-primary" onClick={async () => setCopyStatus(await copyText(shareUrl, urlInput.current) ? 'copied' : 'failed')}>Copy Practice Link</button>
        <a className="builder-secondary" href={relativeUrl}>Start Practice</a>
      </div>
      <p className={`mt-3 min-h-6 text-sm font-semibold ${copyStatus === 'failed' ? 'text-red-700' : 'text-emerald-700'}`} role="status" aria-live="polite">{copyStatus === 'copied' ? 'Copied!' : copyStatus === 'failed' ? 'Could not copy automatically. Select and copy the link above.' : ''}</p>
    </section>; })() : <section className="rounded-2xl border border-dashed border-[#A5B4FC] bg-[#EEF2FF] p-6 text-center"><h2 className="text-lg font-bold">Your practice will appear here</h2><p className="mt-1 text-[#475569]">Choose a skill to configure and share it.</p></section>}
  </div>;
}
