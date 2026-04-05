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
      setActiveSlot('quotient');
      setQuotientValue('');
      setRemainderValue('');
      inputRef.current?.focus();
    }
  }, [feedbackState]);

  function handleDigit(d: string) {
    if (disabled) return;

    if (activeSlot === 'quotient') {
      if (quotientValue === '' && d === '0') return;
      if (quotientValue.length >= 2) return;
      const newQ = quotientValue + d;
      setQuotientValue(newQ);
      // Auto-advance only after 2 digits (quotients 10–12 are unambiguously complete)
      if (newQ.length === 2) setActiveSlot('remainder');
    } else {
      if (remainderValue.length >= 2) return;
      const candidate = parseInt(remainderValue + d, 10);
      if (candidate >= problem.operandB) return;
      setRemainderValue((v) => v + d);
    }
  }

  function handleBackspace() {
    if (activeSlot === 'remainder') {
      setRemainderValue((v) => v.slice(0, -1));
    } else {
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
    onSubmit(q, r);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }

  const activeValue = activeSlot === 'quotient' ? quotientValue : remainderValue;

  function switchSlot(slot: 'quotient' | 'remainder') {
    if (!disabled) {
      setActiveSlot(slot);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      {/* Written arithmetic block */}
      <div
        className={`select-none w-fit mx-auto min-w-[8rem] transition-opacity duration-200 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label={`What is ${problem.operandA} ÷ ${problem.operandB}? Enter quotient and remainder.`}
        onClick={() => inputRef.current?.focus()}
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
          <span className="text-5xl md:text-6xl font-bold text-[#1E1B4B] tabular-nums font-['JetBrains_Mono']">
            {problem.operandA}
          </span>
        </div>

        {/* Row 2: ÷ divisor */}
        <div className="flex items-center justify-end gap-3">
          <span className="text-4xl font-semibold text-[#4F46E5]">÷</span>
          <span className="text-5xl md:text-6xl font-bold text-[#1E1B4B] tabular-nums font-['JetBrains_Mono']">
            {problem.operandB}
          </span>
        </div>

        {/* Horizontal rule */}
        <div className="border-t-[3px] border-[#1E1B4B] mt-2" />

        {/* Quotient slot — tappable */}
        <div
          className="mt-1 flex justify-end cursor-pointer"
          onClick={() => switchSlot('quotient')}
        >
          <span
            className={`text-5xl md:text-6xl font-bold tabular-nums inline-flex items-center pb-0.5 border-b-2 font-['JetBrains_Mono'] ${
              activeSlot === 'quotient'
                ? 'text-[#1E1B4B] border-[#4F46E5]'
                : 'text-[#A5B4FC] border-[#E0E7FF]'
            }`}
          >
            {quotientValue.length === 0 ? (
              <span className={activeSlot === 'quotient' ? 'text-[#1E1B4B]' : 'text-[#C7D2FE]'}>?</span>
            ) : (
              quotientValue
            )}
          </span>
        </div>

        {/* Remainder label + slot — tappable */}
        <div
          className="mt-4 cursor-pointer"
          onClick={() => switchSlot('remainder')}
        >
          <div className="text-xs font-medium text-[#A5B4FC] uppercase tracking-wide text-right mb-1">
            Remainder:
          </div>
          <div className="flex justify-end">
            <span
              className={`text-5xl md:text-6xl font-bold tabular-nums inline-flex items-center pb-0.5 border-b-2 font-['JetBrains_Mono'] ${
                activeSlot === 'remainder'
                  ? 'text-[#1E1B4B] border-[#4F46E5]'
                  : 'text-[#C7D2FE] border-[#E0E7FF]'
              }`}
            >
              {remainderValue.length === 0 ? (
                <span className={activeSlot === 'remainder' ? 'text-[#1E1B4B]' : 'text-[#C7D2FE]'}>?</span>
              ) : (
                remainderValue
              )}
            </span>
          </div>
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
