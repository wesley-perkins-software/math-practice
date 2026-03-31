import { useEffect, useRef, useState } from 'react';
import NumberPad from './NumberPad';

interface Props {
  onSubmit: (answer: number) => void;
  disabled?: boolean;
  feedbackState?: 'correct' | 'incorrect' | 'idle';
  feedbackContent?: React.ReactNode;
}

export default function AnswerInput({
  onSubmit,
  disabled = false,
  feedbackState = 'idle',
  feedbackContent,
}: Props) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  // Clear and refocus after each submission
  useEffect(() => {
    if (feedbackState === 'idle') {
      setValue('');
      inputRef.current?.focus();
    }
  }, [feedbackState]);

  function handleSubmit() {
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      onSubmit(num);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleDigit(d: string) {
    if (value.length >= 3) return;
    setValue((v) => v + d);
  }

  function handleBackspace() {
    setValue((v) => v.slice(0, -1));
  }

  const borderColor =
    feedbackState === 'correct'
      ? 'border-[#22C55E] ring-2 ring-[#22C55E]/30'
      : feedbackState === 'incorrect'
      ? 'border-[#EF4444] ring-2 ring-[#EF4444]/30'
      : 'border-[#E2E8F0] focus-within:border-[#3B82F6] focus-within:ring-2 focus-within:ring-[#3B82F6]/20';

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <input
        ref={inputRef}
        type="text"
        inputMode="none"
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/\D/g, '').slice(0, 3))}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="?"
        aria-label="Your answer"
        className={`w-full max-w-xs text-center text-4xl font-semibold py-3 px-4 rounded-xl border-2 outline-none transition-all bg-white text-[#1E293B] placeholder-[#CBD5E1] ${borderColor} disabled:opacity-50 disabled:cursor-not-allowed`}
      />
      {feedbackContent}
      <NumberPad
        onDigit={handleDigit}
        onBackspace={handleBackspace}
        onSubmit={handleSubmit}
        disabled={disabled}
      />
    </div>
  );
}
