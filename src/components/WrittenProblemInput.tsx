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
  /** 'prototype' opts into the redesigned surface (currently /addition/1-digit only). */
  variant?: 'classic' | 'prototype';
}

export default function WrittenProblemInput({
  problem,
  onSubmit,
  disabled = false,
  feedbackState = 'idle',
  feedbackContent,
  variant = 'classic',
}: Props) {
  const symbol = OP_SYMBOL[problem.operation];
  const [value, setValue] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSubmitAtRef = useRef(0);

  // Prototype B (keyboard-first): default to 'keypad' on the server render,
  // then check actual pointer/hover capability once mounted. A fine pointer
  // with hover support (mouse/trackpad) gets the keyboard-first field; touch
  // and coarse-pointer devices keep the on-screen keypad. Either can be
  // overridden manually via the toggle link.
  const [inputMode, setInputMode] = useState<'keypad' | 'keyboard'>('keypad');
  const [supportsPointerKeyboard, setSupportsPointerKeyboard] = useState(false);
  useEffect(() => {
    if (variant !== 'prototype') return;
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    setSupportsPointerKeyboard(mq.matches);
    if (mq.matches) setInputMode('keyboard');
  }, [variant]);

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
      ? 'text-[#059669]'
      : feedbackState === 'incorrect'
      ? 'text-[#DC2626]'
      : 'text-[#1E1B4B]';

  const isPlaceholder = value.length === 0;

  if (variant === 'prototype') {
    const answerColorProto =
      feedbackState === 'correct'
        ? 'text-[#059669]'
        : feedbackState === 'incorrect'
        ? 'text-[#DC2626]'
        : 'text-[#211D4F]';
    const isKeyboardMode = inputMode === 'keyboard';

    return (
      <div className="flex flex-col items-center gap-3 w-full">
        {/* Written arithmetic block: an intrinsic-width mathematical column,
            centered as a whole in the stage. Digits stay right-aligned WITHIN
            the column (place-value convention), but the column itself is not
            stretched to any other element's width — the equation, the keypad,
            and the surface are three independent width decisions. */}
        <div
          className={`font-practice select-none w-fit mx-auto rounded-xl px-3 py-1 transition-opacity duration-200 ease-out ${
            isVisible ? 'opacity-100' : 'opacity-0'
          } ${isFocused ? 'ring-2 ring-[#4F46E5]/45 ring-offset-4 ring-offset-white' : ''} ${
            isKeyboardMode ? 'border-2 border-dashed border-[#C9C5E8]' : ''
          }`}
          aria-label={`What is ${problem.operandA} ${symbol} ${problem.operandB}?`}
          onClick={() => inputRef.current?.focus()}
        >
          <input
            ref={inputRef}
            type="text"
            inputMode={isKeyboardMode ? 'numeric' : 'none'}
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, '').slice(0, 3))}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            aria-label="Your answer"
            className="sr-only"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />

          <div className="text-right">
            <span className="text-6xl font-bold text-[#211D4F]">{problem.operandA}</span>
          </div>
          <div className="flex items-center justify-end gap-3">
            <span className="text-5xl font-bold text-[#4F46E5]">{symbol}</span>
            <span className="text-6xl font-bold text-[#211D4F]">{problem.operandB}</span>
          </div>
          <div className="border-t-[3px] border-[#211D4F] mt-1.5" />
          <div className="text-right mt-1 min-h-[3.5rem] flex items-center justify-end">
            {isPlaceholder ? (
              <span className="text-6xl font-bold text-[#C9C5E8] inline-flex items-center">
                <span aria-hidden="true" className="opacity-0 select-none">0</span>
                {isFocused && <span className="ml-0.5 animate-[cursor-blink_1s_step-end_infinite] text-[#4F46E5] font-light">|</span>}
              </span>
            ) : (
              <span className={`text-6xl font-bold transition-colors duration-150 ${answerColorProto}`}>{value}</span>
            )}
          </div>
        </div>

        {feedbackContent}

        {isKeyboardMode ? (
          <div className="font-practice flex flex-col items-center gap-2 w-full max-w-[16rem]">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={disabled}
              className="w-full h-12 rounded-2xl text-lg font-bold text-white bg-[#4F46E5] hover:bg-[#3E35C7] shadow-[0_3px_0_0_#3730A3] active:shadow-none active:translate-y-[2px] transition-all duration-100 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#4F46E5]"
            >
              Check Answer
            </button>
            <span className="text-xs text-[#6B6690]">or press Enter</span>
            {supportsPointerKeyboard && (
              <button
                type="button"
                onClick={() => setInputMode('keypad')}
                className="text-xs text-[#6B6690] hover:text-[#4F46E5] underline underline-offset-2 mt-1"
              >
                Use on-screen keypad instead
              </button>
            )}
          </div>
        ) : (
          <div className="font-practice flex flex-col items-center gap-2 w-full">
            <NumberPad
              onDigit={handleDigit}
              onBackspace={handleBackspace}
              onSubmit={handleSubmit}
              disabled={disabled}
              variant="prototype"
            />
            {supportsPointerKeyboard && (
              <button
                type="button"
                onClick={() => setInputMode('keyboard')}
                className="text-xs text-[#6B6690] hover:text-[#4F46E5] underline underline-offset-2"
              >
                Use keyboard instead
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      {/* Written arithmetic block */}
      <div
        className={`select-none w-fit mx-auto min-w-[9rem] rounded-2xl px-2 py-1 -mx-2 -my-1 transition-[opacity,box-shadow] duration-200 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        } ${isFocused ? 'ring-2 ring-[#4F46E5]/40 ring-offset-4 ring-offset-white' : ''}`}
        aria-label={`What is ${problem.operandA} ${symbol} ${problem.operandB}?`}
        onClick={() => inputRef.current?.focus()}
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
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {/* Row 1: operandA, right-aligned */}
        <div className="text-right">
          <span className="text-5xl md:text-6xl font-bold text-[#1E1B4B] tabular-nums font-['JetBrains_Mono']">
            {problem.operandA}
          </span>
        </div>

        {/* Row 2: operator (left) + operandB (right) */}
        <div className="flex items-center justify-end gap-3">
          <span className="text-4xl md:text-5xl font-semibold text-[#4F46E5]">{symbol}</span>
          <span className="text-5xl md:text-6xl font-bold text-[#1E1B4B] tabular-nums font-['JetBrains_Mono']">
            {problem.operandB}
          </span>
        </div>

        {/* Horizontal rule */}
        <div className="border-t-[3px] border-[#1E1B4B] mt-1.5" />

        {/* Row 3: answer, right-aligned under the rule */}
        <div className="text-right mt-1 min-h-[3rem] md:min-h-[3.75rem] flex items-center justify-end">
          {isPlaceholder ? (
            <span className="text-5xl md:text-6xl font-bold tabular-nums text-[#C7D2FE] inline-flex items-center font-['JetBrains_Mono']">
              <span aria-hidden="true" className="opacity-0 select-none">?</span>
              {isFocused && <span className="ml-0.5 animate-[cursor-blink_1s_step-end_infinite] text-[#4F46E5] font-light">|</span>}
            </span>
          ) : (
            <span className={`text-5xl md:text-6xl font-bold tabular-nums transition-colors duration-150 font-['JetBrains_Mono'] ${answerColor}`}>
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
