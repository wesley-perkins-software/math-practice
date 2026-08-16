interface Props {
  secondsRemaining: number;
  /** 'prototype' opts into the redesigned surface (shared with the four operation practice pages). */
  variant?: 'classic' | 'prototype';
}

export default function TimerDisplay({ secondsRemaining, variant = 'classic' }: Props) {
  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const display = `${mins}:${String(secs).padStart(2, '0')}`;
  const isWarning = secondsRemaining <= 10;

  if (variant === 'prototype') {
    // Compact single-line "CAPTION value" shape — a corner status, not a
    // second display. Round 2: dropped the earlier two-line label-above-
    // value treatment (borrowed from the Streak stat) once the Speed Drill
    // grew a second corner stat (Correct) and the card needed to shed
    // height: a stacked caption+numeral was costing ~40px of card height
    // for a status that only needs to be glanceable, not prominent. Sized
    // well below --practice-operand-size so the arithmetic problem stays
    // the dominant element — this is a secondary status, not the focal
    // point. tabular-nums (via .font-practice) keeps the glyph widths
    // constant frame to frame, and the display string itself is always
    // "M:SS" (4 characters) for every duration this drill uses, so the
    // countdown never shifts the layout.
    return (
      <div className="flex items-baseline gap-1.5" aria-live="off" aria-label={`${secondsRemaining} seconds remaining`}>
        <span className="text-[11px] font-bold text-[#211D4F] uppercase tracking-wide">Time</span>
        <span
          className={`text-xl font-extrabold leading-none tabular-nums transition-colors ${
            isWarning ? 'text-[#EA580C]' : 'text-[#211D4F]'
          }`}
        >
          {display}
        </span>
      </div>
    );
  }

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
