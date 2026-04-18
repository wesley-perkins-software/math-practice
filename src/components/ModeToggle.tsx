import type { PracticeMode } from '@/engine/types';

interface Props {
  mode: PracticeMode;
  onChange: (mode: PracticeMode) => void;
}

export default function ModeToggle({ mode, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 bg-[#EEF2FF] border border-[#E0E7FF] rounded-xl p-1" role="group" aria-label="Practice mode">
      {(['untimed', 'timed'] as PracticeMode[]).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          aria-pressed={mode === m}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all capitalize ${
            mode === m
              ? 'bg-white text-[#4F46E5] shadow-sm border-b-2 border-[#4F46E5]'
              : 'text-[#6B7280] hover:text-[#4338CA]'
          }`}
        >
          {m === 'untimed' ? 'Untimed' : 'Timed'}
        </button>
      ))}
    </div>
  );
}
