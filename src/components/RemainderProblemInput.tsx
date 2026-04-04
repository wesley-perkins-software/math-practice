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
  const [activeSlot, setActiveSlot] = useState<'quotient' | 'remainder'>('quotient');
  const [quotientValue, setQuotientValue] = useState('');
  const [remainderValue, setRemainderValue] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSubmitAtRef = useRef(0);
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fade-in on problem change
  useEffect(() => {
    setIsVisible(false);
    const id = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(id);
  }, [problem.operandA, problem.operandB]);

  // Focus hidden input when enabled or slot changes
  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled, activeSlot]);

  // Reset on new problem (feedbackState returns to idle)
  useEffect(() => {
    if (feedbackState === 'idle') {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
      setActiveSlot('quotient');
      setQuotientValue('');
      setRemainderValue('');
      inputRef.current?.focus();
    }
  }, [feedbackState]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    };
  }, []);

  function handleDigit(d: string) {
    if (disabled) return;

    if (activeSlot === 'quotient') {
      // Block 0 as leading digit (quotient is always 1–12)
      if (quotientValue === '' && d === '0') return;
      if (quotientValue.length >= 2) return;

      // Cancel any pending auto-advance timer before appending
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }

      const newQ = quotientValue + d;
      setQuotientValue(newQ);

      if (newQ.length === 2) {
        // Two digits (10/11/12): advance immediately
        setActiveSlot('remainder');
      } else if (d !== '1') {
        // Digits 2–9: unambiguously single-digit, advance immediately
        setActiveSlot('remainder');
      } else {
        // Digit '1': could become 10/11/12, wait 600ms
        autoAdvanceTimerRef.current = setTimeout(() => {
          autoAdvanceTimerRef.current = null;
          setActiveSlot('remainder');
        }, 600);
      }
    } else {
      if (remainderValue.length >= 2) return;
      // Remainder must be less than the divisor
      const candidate = parseInt(remainderValue + d, 10);
      if (candidate >= problem.operandB) return;
      setRemainderValue((v) => v + d);
    }
  }

  function handleBackspace() {
    if (activeSlot === 'remainder') {
      if (remainderValue.length > 0) {
        setRemainderValue((v) => v.slice(0, -1));
      } else {
        // Empty remainder: cancel timer, return to quotient, strip last quotient digit
        if (autoAdvanceTimerRef.current) {
          clearTimeout(autoAdvanceTimerRef.current);
          autoAdvanceTimerRef.current = null;
        }
        setActiveSlot('quotient');
        setQuotientValue((v) => v.slice(0, -1));
      }
    } else {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
      setQuotientValue((v) => v.slice(0, -1));
    }
  }

  function handleSubmit() {
    if (disabled) return;
    const now = Date.now();
    if (now - lastSubmitAtRef.current < 100) return;

    const q = parseInt(quotientValue, 10);
    const r = parseInt(remainderValue, 10);
    if (isNaN(q) || isNaN(r)) return;

    lastSubmitAtRef.current = now;
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    onSubmit(q, r);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }

  const activeValue = activeSlot === 'quotient' ? quotientValue : remainderValue;

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
          value={activeValue}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, '');
            if (raw.length > activeValue.length) {
              const newChar = raw[activeValue.length];
              if (newChar) handleDigit(newChar);
            } else if (raw.length < activeValue.length) {
              handleBackspace();
            }
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-label={activeSlot === 'quotient' ? 'Enter quotient' : 'Enter remainder'}
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

        {/* Row 3: _ R _ — both slots always visible */}
        <div className="mt-1 flex items-center justify-end gap-2 min-h-[3.5rem] md:min-h-[4rem]">
          {/* Quotient slot */}
          <span
            className={`text-5xl md:text-6xl font-bold tabular-nums inline-flex items-center pb-0.5 border-b-2 ${
              activeSlot === 'quotient'
                ? 'text-[#1E293B] border-[#3B82F6]'
                : 'text-[#94A3B8] border-transparent'
            }`}
          >
            {quotientValue.length === 0 ? (
              activeSlot === 'quotient' ? (
                <>?<span className="ml-0.5 animate-[cursor-blink_1s_step-end_infinite] text-[#334155] font-light">|</span></>
              ) : (
                <span className="text-[#CBD5E1]">?</span>
              )
            ) : (
              quotientValue
            )}
          </span>

          {/* R separator — always visible */}
          <span className="text-3xl md:text-4xl font-bold text-[#94A3B8]">R</span>

          {/* Remainder slot */}
          <span
            className={`text-5xl md:text-6xl font-bold tabular-nums inline-flex items-center pb-0.5 border-b-2 ${
              activeSlot === 'remainder'
                ? 'text-[#1E293B] border-[#3B82F6]'
                : 'text-[#CBD5E1] border-transparent'
            }`}
          >
            {remainderValue.length === 0 ? (
              activeSlot === 'remainder' ? (
                <>?<span className="ml-0.5 animate-[cursor-blink_1s_step-end_infinite] text-[#334155] font-light">|</span></>
              ) : (
                <span className="text-[#CBD5E1]">?</span>
              )
            ) : (
              remainderValue
            )}
          </span>
        </div>

        {/* Active slot hint */}
        <div className="text-center mt-1">
          <span className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide">
            {activeSlot === 'quotient' ? 'Enter quotient' : 'Enter remainder'}
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
