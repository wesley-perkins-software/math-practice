interface Props {
  state: 'correct' | 'incorrect' | 'hidden';
  correctAnswer: number;
  correctRemainder?: number;
}

export default function FeedbackBanner({ state, correctAnswer, correctRemainder }: Props) {
  if (state === 'hidden') return null;

  const isCorrect = state === 'correct';

  const incorrectText =
    correctRemainder !== undefined
      ? `The answer was ${correctAnswer} with a remainder of ${correctRemainder}`
      : `The answer was ${correctAnswer}`;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className={`text-base font-semibold px-5 py-2 rounded-xl ${
        isCorrect
          ? 'bg-[#ECFDF5] text-[#065F46] border border-[#6EE7B7] shadow-[0_0_0_3px_rgba(16,185,129,0.15)] animate-[fadeIn_0.15s_ease-out]'
          : 'bg-[#FEF2F2] text-[#991B1B] border border-[#FCA5A5] shadow-[0_0_0_3px_rgba(239,68,68,0.12)]'
      }`}
    >
      {isCorrect ? '✓ Correct!' : incorrectText}
    </div>
  );
}
