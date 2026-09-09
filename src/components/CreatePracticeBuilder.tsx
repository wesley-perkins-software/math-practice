import { useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_CREATE_PRACTICE_STATE, absolutePracticeUrl, deriveCreatePractice, selectCreatePracticeType, type CreatePracticeState } from '@/engine/createPractice';
import { PRACTICE_CATEGORY_IDS, PRACTICE_TYPE_REGISTRY, type PracticeCategoryId, type PracticeTypeId } from '@/engine/practiceTypes';
import { formatDuration, formatSharedPracticeHeading } from '@/engine/sharedPractice';
import type { PracticeMode, QuestionCount, TimerDuration } from '@/engine/types';

const CATEGORY_NAMES: Record<PracticeCategoryId, string> = { addition: 'Addition', subtraction: 'Subtraction', multiplication: 'Multiplication', division: 'Division' };
const COUNTS: readonly (QuestionCount | undefined)[] = [undefined, 10, 20, 30, 50];
const DURATIONS: readonly TimerDuration[] = [30, 60, 120, 300];

const PRACTICE_TYPE_DESCRIPTIONS: Partial<Record<PracticeTypeId, string>> = {
  'multiplication-facts': 'Practice multiplication facts from 1–12.',
  'division-facts': 'Practice division facts with divisors 1–12.',
  'division-remainders': 'Practice division problems that may have a remainder.',
};

function SelectionGrid({ kind, values, onChange }: { kind: 'facts' | 'divisors'; values: readonly number[]; onChange: (values: number[]) => void }) {
  const noun = kind === 'facts' ? 'facts' : 'numbers';
  const toggle = (value: number) => {
    if (values.includes(value)) {
      if (values.length === 1) return;
      onChange(values.filter((item) => item !== value));
    } else onChange([...values, value]);
  };
  return <fieldset>
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

function SegmentedGroup<T extends string | number | undefined>({ legend, name, options, value, labelFor, onChange }: {
  legend: string;
  name: string;
  options: readonly T[];
  value: T;
  labelFor: (option: T) => string;
  onChange: (option: T) => void;
}) {
  return <fieldset>
    <legend className="builder-label">{legend}</legend>
    <div className="builder-segmented mt-2">
      {options.map((option) => <label key={String(option)} className="builder-segment-option">
        <input type="radio" name={name} className="sr-only peer" checked={value === option} onChange={() => onChange(option)} />
        <span className="builder-segment">{labelFor(option)}</span>
      </label>)}
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
  const [showLink, setShowLink] = useState(false);
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

  const hasSkillOptions = state.practiceType === 'multiplication-facts' || state.practiceType === 'division-facts';

  return <div className="space-y-6">
    <div className="builder-shell">
      <fieldset>
        <legend className="builder-heading">Choose what to practice</legend>
        <p className="builder-help">Pick one skill. You can change it at any time.</p>
        <div className="mt-5 space-y-5">
          {PRACTICE_CATEGORY_IDS.map((category) => <div key={category}>
            <h3 className="mb-2 text-xs font-semibold text-[#64748B]">{CATEGORY_NAMES[category]}</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {PRACTICE_TYPE_REGISTRY.filter((entry) => entry.category === category).map((entry) => <label key={entry.id} className="builder-type-option">
                <input type="radio" name="practice-type" value={entry.id} checked={state.practiceType === entry.id} onChange={() => chooseType(entry.id)} />
                <span className="flex flex-col">
                  <span>{entry.displayName}</span>
                  {PRACTICE_TYPE_DESCRIPTIONS[entry.id] && <span className="mt-0.5 text-xs font-normal text-[#64748B]">{PRACTICE_TYPE_DESCRIPTIONS[entry.id]}</span>}
                </span>
              </label>)}
            </div>
          </div>)}
        </div>
        {!state.practiceType && <p className="builder-help mt-5 text-center">Choose a skill above to build your practice.</p>}
      </fieldset>

      {hasSkillOptions && <div className="builder-stage">
        {state.practiceType === 'multiplication-facts' && <SelectionGrid kind="facts" values={((state.skillOptions as { facts?: readonly number[] }).facts) ?? []} onChange={(v) => setSelection('facts', v)} />}
        {state.practiceType === 'division-facts' && <SelectionGrid kind="divisors" values={((state.skillOptions as { divisors?: readonly number[] }).divisors) ?? []} onChange={(v) => setSelection('divisors', v)} />}
      </div>}

      {state.practiceType && <div className="builder-stage">
        <fieldset>
          <legend className="builder-heading">Practice settings</legend>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <SegmentedGroup legend="Mode" name="mode" options={['untimed', 'timed'] as const} value={state.mode} labelFor={(v) => (v === 'untimed' ? 'Untimed' : 'Timed')} onChange={(v) => update({ mode: v as PracticeMode })} />
            <SegmentedGroup legend="Question limit" name="question-count" options={COUNTS} value={state.questionCount} labelFor={(v) => (v ? `${v}` : 'Endless')} onChange={(v) => update({ questionCount: v as QuestionCount | undefined })} />
          </div>
          {state.mode === 'timed' && <div className="mt-5">
            <SegmentedGroup legend="Timer" name="duration" options={DURATIONS} value={state.durationSeconds} labelFor={(v) => formatDuration(v)} onChange={(v) => update({ durationSeconds: v as TimerDuration })} />
          </div>}
          {state.mode === 'timed' && <p className="builder-help mt-4">If you set both a timer and question limit, practice ends when either one is reached.</p>}
        </fieldset>
      </div>}
    </div>

    {derived.success && (() => { const heading = formatSharedPracticeHeading(derived.definition); return <section className="builder-summary" aria-labelledby="practice-summary-title">
      <p className="text-xs font-bold uppercase tracking-wide text-[#4F46E5]">Your practice</p>
      <h2 id="practice-summary-title" className="mt-1 text-2xl font-extrabold text-[#1E293B]">{heading.title}</h2>
      <p className="mt-2 font-medium text-[#475569]">{heading.details.join(' · ')}</p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="button" className="builder-primary" onClick={async () => setCopyStatus(await copyText(shareUrl, urlInput.current) ? 'copied' : 'failed')}>{copyStatus === 'copied' ? 'Copied ✓' : 'Copy Practice Link'}</button>
        <a className="builder-text-button" href={relativeUrl}>Preview practice →</a>
      </div>
      <p className={`mt-3 min-h-6 text-sm font-semibold ${copyStatus === 'failed' ? 'text-red-700' : 'text-emerald-700'}`} role="status" aria-live="polite">{copyStatus === 'copied' ? 'Copied!' : copyStatus === 'failed' ? 'Could not copy automatically. Select and copy the link below.' : ''}</p>
      <div className="mt-4">
        <button type="button" className="builder-text-button -ml-3" aria-expanded={showLink} onClick={() => setShowLink((v) => !v)}>{showLink ? 'Hide practice link' : 'Show practice link'}</button>
        <label className={showLink ? 'mt-2 block text-sm font-semibold text-[#334155]' : 'sr-only'}>
          Practice link
          <input ref={urlInput} className={showLink ? 'builder-url' : 'builder-url builder-url-hidden'} readOnly value={shareUrl} onFocus={(e) => e.currentTarget.select()} />
        </label>
      </div>
    </section>; })()}
  </div>;
}
