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
 * styled visible representation + the shared NumberPad for touch entry) —
 * no shared AnswerInput abstraction exists in this codebase to implement
 * instead. Shares the practice surface's own design tokens
 * (practice-surface-prototype.css: --practice-operand-size,
 * --practice-answer-min-h, --practice-caret-h) and the same answer-box
 * treatment WrittenProblemInput uses, so a fraction reads as mathematics —
 * two individually-editable digit slots joined by a fraction bar — rather
 * than as a boxed form control.
 *
 * A denominator of zero can never be composed: the only way "0" alone could
 * form is a leading zero, which is blocked at the digit-entry level (not a
 * blanket rule against any digit sequence containing zero) — multi-digit
 * denominators like "10" or "12" are unaffected. Numerator zero is a valid,
 * submittable value. A fixed (non-editable) denominator is rendered as
 * plain muted text — never a bordered/focusable box — so it reads
 * unambiguously as "given," not "fill this in."
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

    if (!editable) {
      // Fixed value: plain muted text, never a box — reads as "given," not "fill this in."
      return (
        <span className="block font-bold leading-none tabular-nums whitespace-nowrap text-[length:var(--practice-operand-size)] text-[#8983B8]">
          {value}
        </span>
      );
    }

    const isPlaceholder = value.length === 0;
    return (
      <span
        onClick={(e) => {
          e.stopPropagation();
          switchSlot(slot);
        }}
        className={`inline-flex items-center justify-center min-h-[length:var(--practice-answer-min-h)] min-w-[2.75em] rounded-xl border-[1.5px] px-3 cursor-text transition-colors duration-150 ${
          isActive ? 'border-[#4F46E5] bg-[#F5F3FF] shadow-[0_0_0_3px_rgba(79,70,229,0.14)]' : 'border-[#8983B8] bg-transparent'
        }`}
      >
        {isPlaceholder ? (
          <span className="text-[length:var(--practice-operand-size)] font-bold text-[#D7D3EE] inline-flex items-center leading-none">
            <span aria-hidden="true" className="opacity-0 select-none">0</span>
            {isActive && (
              <span
                aria-hidden="true"
                className="ml-1.5 w-[3px] h-[length:var(--practice-caret-h)] rounded-full bg-[#4F46E5] animate-[cursor-blink_1s_step-end_infinite]"
              />
            )}
          </span>
        ) : (
          <span className="text-[length:var(--practice-operand-size)] font-bold text-[#211D4F] leading-none tabular-nums">{value}</span>
        )}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div
        className="font-practice inline-flex flex-col items-center select-none cursor-text"
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
        />

        {renderSlot('numerator', numeratorValue, true)}
        <div className="border-t-4 border-[#211D4F] w-full my-1.5" aria-hidden="true" />
        {renderSlot('denominator', denominatorValue, denominatorEditable)}
      </div>

      {feedbackContent}

      <NumberPad onDigit={handleDigit} onBackspace={handleBackspace} onSubmit={handleSubmit} disabled={disabled} variant="prototype" />
    </div>
  );
}
