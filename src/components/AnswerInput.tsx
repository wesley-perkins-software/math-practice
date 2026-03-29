import { useEffect, useRef, useState } from 'react';

interface Props {
  onSubmit: (answer: number) => void;
  disabled?: boolean;
  feedbackState?: 'correct' | 'incorrect' | 'idle';
}

export default function AnswerInput({ onSubmit, disabled = false, feedbackState = 'idle' }: Props) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  // Refocus after each submission (feedbackState changes away from idle)
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
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="?"
        aria-label="Your answer"
        className={`w-full max-w-xs text-center text-4xl font-semibold py-3 px-4 rounded-xl border-2 outline-none transition-all bg-white text-[#1E293B] placeholder-[#CBD5E1] ${borderColor} disabled:opacity-50 disabled:cursor-not-allowed`}
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || value === ''}
        className="w-full max-w-xs py-3 px-6 bg-[#3B82F6] hover:bg-[#2563EB] active:bg-[#1D4ED8] text-white font-semibold text-base rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50 focus:ring-offset-2"
      >
        Check Answer
      </button>
      <p className="text-xs text-[#94A3B8]">or press Enter</p>
    </div>
  );
}
