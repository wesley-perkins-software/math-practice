import type { TimerDuration } from '@/engine/types';

const OPTIONS: { value: TimerDuration; label: string }[] = [
  { value: 30, label: '30s' },
  { value: 60, label: '1m' },
  { value: 120, label: '2m' },
  { value: 300, label: '5m' },
];

interface Props {
  value: TimerDuration;
  onChange: (value: TimerDuration) => void;
}

export default function DurationPicker({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label="Timer duration">
      <span className="text-sm text-[#64748B] font-medium">Duration:</span>
      <div className="flex gap-1">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            aria-pressed={value === opt.value}
            className={`py-1.5 px-3 rounded-lg text-sm font-semibold transition-all ${
              value === opt.value
                ? 'bg-[#3B82F6] text-white'
                : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#1E293B]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
