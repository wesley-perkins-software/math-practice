import { useEffect, useRef, useState } from 'react';
import NumberPad from './NumberPad';

type Slot = 'numerator' | 'denominator';

interface Props {
  /** False for Equivalent Fractions: the target denominator is fixed and only the numerator is entered. */
  denominatorEditable?: boolean;
  /** Required when denominatorEditable is false — the fixed value shown in the denominator slot. */
  fixedDenominator?: number;
  onSubmit: (answer: { numerator: number; denominator: number }) => void;
  disabled?: boolean;
  feedbackState?: 'correct' | 'incorrect' | 'idle';
  feedbackContent?: React.ReactNode;
  ariaLabel: string;
}

const MAX_DIGITS = 2;

/**
 * Stacked numerator/denominator input, modeled on RemainderProblemInput's
 * proven two-slot pattern (hidden real <input> for keyboard capture + a
 * styled <span> per slot + the shared NumberPad for touch entry) rather than
 * a new interface — no shared AnswerInput abstraction exists in this
 * codebase to implement instead.
 *
 * A denominator of zero can never be composed: the only way "0" alone could
 * form is a leading zero, which is blocked at the digit-entry level (not a
 * blanket rule against any digit sequence containing zero) — multi-digit
 * denominators like "10" or "12" are unaffected. Numerator zero is a valid,
 * submittable value.
 */
export default function FractionInput({
  denominatorEditable = true,
  fixedDenominator,
  onSubmit,
  disabled = false,
  feedbackState = 'idle',
  feedbackContent,
  ariaLabel,
}: Props) {
  const initialDenominator = !denominatorEditable && fixedDenominator !== undefined ? String(fixedDenominator) : '';
  const [activeSlot, setActiveSlot] = useState<Slot>('numerator');
  const [numeratorValue, setNumeratorValue] = useState('');
  const [denominatorValue, setDenominatorValue] = useState(initialDenominator);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSubmitAtRef = useRef(0);

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled, activeSlot]);

  // Reset on new problem (feedbackState returns to idle), mirroring RemainderProblemInput.
  useEffect(() => {
    if (feedbackState === 'idle') {
      setActiveSlot('numerator');
      setNumeratorValue('');
      setDenominatorValue(!denominatorEditable && fixedDenominator !== undefined ? String(fixedDenominator) : '');
      inputRef.current?.focus();
    }
    // denominatorEditable never changes for a mounted instance (skill identity); fixedDenominator changes per problem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedbackState, fixedDenominator]);

  function handleDigit(d: string) {
    if (disabled) return;
    if (activeSlot === 'numerator') {
      if (numeratorValue.length >= MAX_DIGITS) return;
      if (numeratorValue === '0') {
        setNumeratorValue(d); // calculator-style overwrite of a standalone leading zero
        return;
      }
      setNumeratorValue((v) => v + d);
    } else {
      if (!denominatorEditable) return;
      if (denominatorValue === '' && d === '0') return; // blocks the only path to a "0" denominator
      if (denominatorValue.length >= MAX_DIGITS) return;
      setDenominatorValue((v) => v + d);
    }
  }

  function handleBackspace() {
    if (disabled) return;
    if (activeSlot === 'numerator') {
      setNumeratorValue((v) => v.slice(0, -1));
    } else if (denominatorEditable) {
      setDenominatorValue((v) => v.slice(0, -1));
    }
  }

  function handleSubmit() {
    if (disabled) return;
    const now = Date.now();
    if (now - lastSubmitAtRef.current < 100) return;
    if (numeratorValue === '' || denominatorValue === '') return; // incomplete answer cannot submit
    const numerator = parseInt(numeratorValue, 10);
    const denominator = parseInt(denominatorValue, 10);
    if (isNaN(numerator) || isNaN(denominator) || denominator === 0) return;
    lastSubmitAtRef.current = now;
    onSubmit({ numerator, denominator });
  }

  function switchSlot(slot: Slot) {
    if (disabled) return;
    if (slot === 'denominator' && !denominatorEditable) return;
    setActiveSlot(slot);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
      return;
    }
    if (e.key === '/' && activeSlot === 'numerator' && denominatorEditable) {
      e.preventDefault();
      switchSlot('denominator');
      return;
    }
    if (e.key === 'Tab' && !e.shiftKey && activeSlot === 'numerator' && denominatorEditable) {
      e.preventDefault();
      switchSlot('denominator');
      return;
    }
    if (e.key === 'Tab' && e.shiftKey && activeSlot === 'denominator') {
      e.preventDefault();
      switchSlot('numerator');
      return;
    }
  }

  const activeValue = activeSlot === 'numerator' ? numeratorValue : denominatorValue;

  function renderSlot(slot: Slot, value: string, editable: boolean) {
    const isActive = activeSlot === slot;
    return (
      <div
        className={`flex justify-center ${editable ? 'cursor-pointer' : ''}`}
        onClick={() => editable && switchSlot(slot)}
      >
        <span
          className={`text-5xl md:text-6xl font-bold tabular-nums inline-flex items-center pb-0.5 border-b-2 font-['JetBrains_Mono'] min-w-[1.5em] justify-center ${
            !editable
              ? 'text-[#1E1B4B] border-transparent'
              : isActive
                ? 'text-[#1E1B4B] border-[#4F46E5]'
                : 'text-[#A5B4FC] border-[#E0E7FF]'
          }`}
        >
          {editable && value.length === 0 ? (
            <span className="inline-flex items-center">
              <span aria-hidden="true" className="opacity-0 select-none">0</span>
              {isActive && <span className="ml-0.5 animate-[cursor-blink_1s_step-end_infinite] text-[#4F46E5] font-light">|</span>}
            </span>
          ) : (
            value
          )}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <div
        className={`select-none w-fit mx-auto rounded-2xl px-2 py-1 -mx-2 -my-1 transition-shadow duration-200 ease-out ${
          isFocused ? 'ring-2 ring-[#4F46E5]/40 ring-offset-4 ring-offset-white' : ''
        }`}
        aria-label={ariaLabel}
        onClick={() => inputRef.current?.focus()}
      >
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
          aria-label={activeSlot === 'numerator' ? 'Enter numerator' : 'Enter denominator'}
          className="sr-only"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {renderSlot('numerator', numeratorValue, true)}
        <div className="border-t-[3px] border-[#1E1B4B] my-1.5 w-full" />
        {renderSlot('denominator', denominatorValue, denominatorEditable)}
      </div>

      {feedbackContent}

      <NumberPad onDigit={handleDigit} onBackspace={handleBackspace} onSubmit={handleSubmit} disabled={disabled} />
    </div>
  );
}
