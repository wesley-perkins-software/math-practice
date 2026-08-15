interface Props {
  state: 'correct' | 'incorrect' | 'hidden';
  correctAnswer: number;
  correctRemainder?: number;
  /** 'prototype' opts into the shared Addition-family practice surface (all three /addition pages); other operation families still use 'classic'. */
  variant?: 'classic' | 'prototype';
}

export default function FeedbackBanner({ state, correctAnswer, correctRemainder, variant = 'classic' }: Props) {
  if (state === 'hidden') return null;

  const isCorrect = state === 'correct';

  const incorrectText =
    correctRemainder !== undefined
      ? `The answer was ${correctAnswer} with a remainder of ${correctRemainder}`
      : `The answer was ${correctAnswer}`;

  if (variant === 'prototype') {
    // Round 5: the classic pale-mint/pale-rose chip read as low-confidence,
    // especially once the keypad simultaneously dims for its disabled state
    // (two washed-out things at once). This solid-fill treatment keeps the
    // same reserved footprint (still lives in the fixed-height feedback
    // lane) but reads with much more conviction — dark-on-light-tint text
    // was tried first and discarded because it still felt like a status
    // chip; a confident solid fill is what actually reads as "the app has
    // an opinion about your answer" to a 6-year-old. Success keeps a
    // redundant non-color cue (a checkmark) so it never relies on color
    // alone. Round 6: dropped the incorrect state's X glyph — the answer
    // box is already red and this banner is already a solid red surface,
    // so a third red "wrong" signal was redundant; what a child actually
    // needs there is the right answer, stated plainly ("The answer was
    // 16"), not another failure icon.
    return (
      <div
        aria-live="polite"
        aria-atomic="true"
        className={`font-practice w-full flex items-center justify-center gap-2 text-[length:var(--practice-feedback-text)] font-bold px-4 py-[length:var(--practice-feedback-py)] rounded-xl animate-[fadeIn_0.15s_ease-out] ${
          isCorrect ? 'bg-[#047857] text-white' : 'bg-[#DC2626] text-white'
        }`}
      >
        {isCorrect ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
            <span>Correct!</span>
          </>
        ) : (
          <span>
            {correctRemainder !== undefined
              ? <>The answer was <span className="tabular-nums">{correctAnswer} r{correctRemainder}</span></>
              : <>The answer was <span className="tabular-nums">{correctAnswer}</span></>}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className={`text-base font-semibold px-5 py-2 rounded-xl animate-[fadeIn_0.15s_ease-out] ${
        isCorrect
          ? 'bg-[#ECFDF5] text-[#065F46] border border-[#6EE7B7] shadow-[0_0_0_3px_rgba(16,185,129,0.15)]'
          : 'bg-[#FEF2F2] text-[#991B1B] border border-[#FCA5A5] shadow-[0_0_0_3px_rgba(239,68,68,0.12)]'
      }`}
    >
      {isCorrect ? '✓ Correct!' : incorrectText}
    </div>
  );
}
