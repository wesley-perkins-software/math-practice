interface Props {
  secondsRemaining: number;
}

export default function TimerDisplay({ secondsRemaining }: Props) {
  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const display = `${mins}:${String(secs).padStart(2, '0')}`;
  const isWarning = secondsRemaining <= 10;

  return (
    <div
      className={`text-2xl font-bold tabular-nums transition-colors ${
        isWarning ? 'text-[#F97316]' : 'text-[#1E293B]'
      }`}
      aria-live="off"
      aria-label={`${secondsRemaining} seconds remaining`}
    >
      {display}
    </div>
  );
}
