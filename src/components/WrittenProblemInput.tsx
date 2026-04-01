import { useEffect, useRef, useState } from 'react';
import type { Problem } from '@/engine/types';
import NumberPad from './NumberPad';

const OP_SYMBOL: Record<string, string> = {
  addition: '+',
  subtraction: '−',
  multiplication: '×',
  division: '÷',
};

interface Props {
  problem: Problem;
  onSubmit: (answer: number) => void;
  disabled?: boolean;
  feedbackState?: 'correct' | 'incorrect' | 'idle';
  feedbackContent?: React.ReactNode;
}

export default function WrittenProblemInput({
  problem,
  onSubmit,
  disabled = false,
  feedbackState = 'idle',
  feedbackContent,
}: Props) {
  const symbol = OP_SYMBOL[problem.operation];
  const [value, setValue] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSubmitAtRef = useRef(0);

  // Fade-in animation on problem change
  useEffect(() => {
    setIsVisible(false);
    const id = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(id);
  }, [problem.operandA, problem.operandB, problem.operation]);

  // Focus hidden input when enabled
  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  // Clear and refocus when feedback resets to idle (next problem)
  useEffect(() => {
    if (feedbackState === 'idle') {
      setValue('');
      inputRef.current?.focus();
    }
  }, [feedbackState]);

  function handleSubmit() {
    if (disabled) return;
    const now = Date.now();
    if (now - lastSubmitAtRef.current < 100) return;
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      lastSubmitAtRef.current = now;
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

  const answerColor =
    feedbackState === 'correct'
      ? 'text-[#16A34A]'
      : feedbackState === 'incorrect'
      ? 'text-[#DC2626]'
      : 'text-[#1E293B]';

  const isPlaceholder = value.length === 0;

  return (
    <div className="flex flex-col items-center gap-2.5 w-full">
      {/* Written arithmetic block */}
      <div
        className={`select-none w-fit mx-auto min-w-[8rem] rounded-2xl border border-[#E2E8F0] bg-[#FCFDFE] px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-opacity duration-200 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label={`What is ${problem.operandA} ${symbol} ${problem.operandB}?`}
      >
        {/* Hidden input captures keyboard events */}
        <input
          ref={inputRef}
          type="text"
          inputMode="none"
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/\D/g, '').slice(0, 3))}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-label="Your answer"
          className="sr-only"
        />

        {/* Row 1: operandA, right-aligned */}
        <div className="text-right">
          <span className="text-5xl md:text-6xl font-bold text-[#0F172A] tabular-nums tracking-tight">
            {problem.operandA}
          </span>
        </div>

        {/* Row 2: operator (left) + operandB (right) */}
        <div className="flex items-center justify-end gap-3 mt-0.5">
          <span className="text-4xl font-semibold text-[#3B82F6] leading-none">{symbol}</span>
          <span className="text-5xl md:text-6xl font-bold text-[#0F172A] tabular-nums tracking-tight">
            {problem.operandB}
          </span>
        </div>

        {/* Horizontal rule */}
        <div className="border-t-[3px] border-[#0F172A] mt-2.5" />

        {/* Row 3: answer, right-aligned under the rule */}
        <div className="text-right mt-1.5 min-h-[3.6rem] md:min-h-[4rem] flex items-center justify-end">
          <span
            className={`text-5xl md:text-6xl font-bold tabular-nums tracking-tight transition-colors duration-150 rounded-lg px-2 ${
              isPlaceholder ? 'text-[#94A3B8] bg-[#F1F5F9]' : `${answerColor} bg-[#EFF6FF]`
            }`}
          >
            {isPlaceholder ? '?' : value}
          </span>
        </div>
      </div>

      {/* Feedback banner slot */}
      <div className="min-h-8">{feedbackContent}</div>

      {/* Number pad */}
      <NumberPad
        onDigit={handleDigit}
        onBackspace={handleBackspace}
        onSubmit={handleSubmit}
        disabled={disabled}
      />
    </div>
  );
}
