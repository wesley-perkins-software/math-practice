import { useEffect, useRef, useState } from 'react';
import type { Problem } from '@/engine/types';
import NumberPad from './NumberPad';

interface Props {
  problem: Problem;
  onSubmit: (quotient: number, remainder: number) => void;
  disabled?: boolean;
  feedbackState?: 'correct' | 'incorrect' | 'idle';
  feedbackContent?: React.ReactNode;
}

export default function RemainderProblemInput({
  problem,
  onSubmit,
  disabled = false,
  feedbackState = 'idle',
  feedbackContent,
}: Props) {
  const [phase, setPhase] = useState<'quotient' | 'remainder'>('quotient');
  const [quotientValue, setQuotientValue] = useState('');
  const [remainderValue, setRemainderValue] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSubmitAtRef = useRef(0);

  // Fade-in on problem change
  useEffect(() => {
    setIsVisible(false);
    const id = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(id);
  }, [problem.operandA, problem.operandB]);

  // Focus hidden input when enabled
  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled, phase]);

  // Reset on new problem (feedbackState returns to idle)
  useEffect(() => {
    if (feedbackState === 'idle') {
      setPhase('quotient');
      setQuotientValue('');
      setRemainderValue('');
      inputRef.current?.focus();
    }
  }, [feedbackState]);

  const currentValue = phase === 'quotient' ? quotientValue : remainderValue;
  const setCurrentValue = phase === 'quotient' ? setQuotientValue : setRemainderValue;

  function handleDigit(d: string) {
    if (currentValue.length >= 2) return;
    setCurrentValue((v) => v + d);
  }

  function handleBackspace() {
    setCurrentValue((v) => v.slice(0, -1));
  }

  function handleSubmit() {
    if (disabled) return;
    const now = Date.now();
    if (now - lastSubmitAtRef.current < 100) return;
    lastSubmitAtRef.current = now;

    if (phase === 'quotient') {
      const q = parseInt(quotientValue, 10);
      if (!isNaN(q)) {
        setPhase('remainder');
      }
    } else {
      const q = parseInt(quotientValue, 10);
      const r = parseInt(remainderValue, 10);
      if (!isNaN(q) && !isNaN(r)) {
        onSubmit(q, r);
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }

  const isQuotientPhase = phase === 'quotient';
  const isPlaceholder = currentValue.length === 0;

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      {/* Written arithmetic block */}
      <div
        className={`select-none w-fit mx-auto min-w-[8rem] transition-opacity duration-200 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label={`What is ${problem.operandA} ÷ ${problem.operandB}? Enter quotient and remainder.`}
      >
        {/* Hidden input captures keyboard events */}
        <input
          ref={inputRef}
          type="text"
          inputMode="none"
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value.replace(/\D/g, '').slice(0, 2))}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-label={isQuotientPhase ? 'Enter quotient' : 'Enter remainder'}
          className="sr-only"
        />

        {/* Row 1: dividend, right-aligned */}
        <div className="text-right">
          <span className="text-5xl md:text-6xl font-bold text-[#1E293B] tabular-nums">
            {problem.operandA}
          </span>
        </div>

        {/* Row 2: ÷ divisor */}
        <div className="flex items-center justify-end gap-3">
          <span className="text-4xl font-semibold text-[#3B82F6]">÷</span>
          <span className="text-5xl md:text-6xl font-bold text-[#1E293B] tabular-nums">
            {problem.operandB}
          </span>
        </div>

        {/* Horizontal rule */}
        <div className="border-t-[3px] border-[#1E293B] mt-2" />

        {/* Row 3: answer area — quotient [ ] R remainder [ ] */}
        <div className="mt-1 flex items-center justify-end gap-2 min-h-[3.5rem] md:min-h-[4rem]">
          {/* Quotient box */}
          {isQuotientPhase ? (
            /* Phase 1: quotient is the active input */
            <span className="text-5xl md:text-6xl font-bold tabular-nums text-[#1E293B] inline-flex items-center">
              {isPlaceholder ? (
                <>?<span className="ml-0.5 animate-[cursor-blink_1s_step-end_infinite] text-[#334155] font-light">|</span></>
              ) : (
                quotientValue
              )}
            </span>
          ) : (
            /* Phase 2: quotient is locked in */
            <span className="text-5xl md:text-6xl font-bold tabular-nums text-[#64748B]">
              {quotientValue}
            </span>
          )}

          {/* R separator — always visible once we have a quotient or are in phase 2 */}
          {(!isQuotientPhase || quotientValue.length > 0) && (
            <span className="text-3xl md:text-4xl font-bold text-[#94A3B8]">R</span>
          )}

          {/* Remainder box — only shown in phase 2 */}
          {!isQuotientPhase && (
            <span className="text-5xl md:text-6xl font-bold tabular-nums text-[#1E293B] inline-flex items-center">
              {isPlaceholder ? (
                <>?<span className="ml-0.5 animate-[cursor-blink_1s_step-end_infinite] text-[#334155] font-light">|</span></>
              ) : (
                remainderValue
              )}
            </span>
          )}
        </div>

        {/* Phase hint label */}
        <div className="text-center mt-1">
          <span className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide">
            {isQuotientPhase ? 'Enter quotient' : 'Enter remainder'}
          </span>
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
