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
    <div className="flex flex-col items-center gap-2 w-full">
      {/* Written arithmetic block */}
      <div
        className={`select-none w-fit mx-auto min-w-[8rem] transition-opacity duration-200 ease-out ${
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
          <span className="text-4xl md:text-5xl font-bold text-[#1E293B] tabular-nums">
            {problem.operandA}
          </span>
        </div>

        {/* Row 2: operator (left) + operandB (right) */}
        <div className="flex items-center justify-end gap-3">
          <span className="text-3xl md:text-4xl font-semibold text-[#3B82F6]">{symbol}</span>
          <span className="text-4xl md:text-5xl font-bold text-[#1E293B] tabular-nums">
            {problem.operandB}
          </span>
        </div>

        {/* Horizontal rule */}
        <div className="border-t-[3px] border-[#1E293B] mt-2" />

        {/* Row 3: answer, right-aligned under the rule */}
        <div className="text-right mt-1 min-h-[2.5rem] md:min-h-[3rem] flex items-center justify-end">
          {isPlaceholder ? (
            <span className="text-4xl md:text-5xl font-bold tabular-nums text-[#CBD5E1] inline-flex items-center">
              ?<span className="ml-0.5 animate-[cursor-blink_1s_step-end_infinite] text-[#334155] font-light">|</span>
            </span>
          ) : (
            <span className={`text-4xl md:text-5xl font-bold tabular-nums transition-colors duration-150 ${answerColor}`}>
              {value}
            </span>
          )}
        </div>
      </div>

      {/* Feedback banner slot */}
      {feedbackContent}

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
