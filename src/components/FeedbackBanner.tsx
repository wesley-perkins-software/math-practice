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
      ? `The answer was ${correctAnswer}, remainder of ${correctRemainder}`
      : `The answer was ${correctAnswer}`;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className={`text-base font-semibold px-4 py-1.5 rounded-lg transition-opacity ${
        isCorrect
          ? 'bg-[#DCFCE7] text-[#15803D]'
          : 'bg-[#FEE2E2] text-[#B91C1C]'
      }`}
    >
      {isCorrect ? '✓ Correct!' : incorrectText}
    </div>
  );
}
