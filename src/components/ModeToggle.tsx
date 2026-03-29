import type { PracticeMode } from '@/engine/types';

interface Props {
  mode: PracticeMode;
  onChange: (mode: PracticeMode) => void;
}

export default function ModeToggle({ mode, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 bg-[#F1F5F9] rounded-xl p-1" role="group" aria-label="Practice mode">
      {(['untimed', 'timed'] as PracticeMode[]).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          aria-pressed={mode === m}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all capitalize ${
            mode === m
              ? 'bg-white text-[#1E293B] shadow-sm'
              : 'text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          {m === 'untimed' ? 'Untimed' : 'Timed'}
        </button>
      ))}
    </div>
  );
}
