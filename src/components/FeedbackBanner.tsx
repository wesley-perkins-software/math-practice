import { useEffect, useState } from 'react';

interface Props {
  state: 'correct' | 'incorrect' | 'hidden';
  correctAnswer: number;
}

export default function FeedbackBanner({ state, correctAnswer }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (state === 'hidden') {
      setVisible(false);
      return;
    }
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 700);
    return () => clearTimeout(t);
  }, [state, correctAnswer]);

  if (!visible || state === 'hidden') return null;

  const isCorrect = state === 'correct';

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className={`text-sm font-semibold px-3 py-1 rounded-lg transition-opacity ${
        isCorrect
          ? 'bg-[#DCFCE7] text-[#15803D]'
          : 'bg-[#FEE2E2] text-[#B91C1C]'
      }`}
    >
      {isCorrect ? 'Correct!' : `The answer was ${correctAnswer}`}
    </div>
  );
}
