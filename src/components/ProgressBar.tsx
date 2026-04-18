interface Props {
  /** 0 to 1 */
  value: number;
  color?: string;
}

export default function ProgressBar({ value, color = '#4F46E5' }: Props) {
  const pct = Math.max(0, Math.min(1, value)) * 100;

  return (
    <div className="w-full h-2.5 bg-[#E0E7FF] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-300 ease-linear"
        style={{ width: `${pct}%`, backgroundColor: color }}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}
