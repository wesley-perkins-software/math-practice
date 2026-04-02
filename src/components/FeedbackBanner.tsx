interface Props {
  state: 'correct' | 'incorrect' | 'hidden';
  correctAnswer: number;
}

export default function FeedbackBanner({ state, correctAnswer }: Props) {
  if (state === 'hidden') return null;

  const isCorrect = state === 'correct';

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
      {isCorrect ? '✓ Correct!' : `The answer was ${correctAnswer}`}
    </div>
  );
}
