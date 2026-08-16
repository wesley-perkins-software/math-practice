import { useEffect, useRef, useState } from 'react';
import type { Problem } from '@/engine/types';
import NumberPad from './NumberPad';

interface Props {
  problem: Problem;
  onSubmit: (quotient: number, remainder?: number) => void;
  disabled?: boolean;
  feedbackState?: 'correct' | 'incorrect' | 'idle';
  feedbackContent?: React.ReactNode;
  /** Division Facts / Divide By have no remainder field — quotient-only entry. Default true. */
  showRemainder?: boolean;
}

const QUOTIENT_MAX_DIGITS = 2;
const REMAINDER_MAX_DIGITS = 2;

/**
 * Authentic long-division notation shared by every division practice family
 * on the prototype surface (Division Facts, Divide By, and Division with
 * Remainders). Divisor sits left of a drawn bracket (border-top = the bar,
 * border-left + rounded corner = the ⟌ hook); the dividend sits inside the
 * bracket; the quotient — the primary answer — sits directly above the bar
 * in the same right-aligned column as the dividend, exactly where a student
 * would write it on paper. When `showRemainder` is true (Division with
 * Remainders only), a compact "R: [ ]" field sits beneath the whole setup,
 * secondary to the quotient; Division Facts and Divide By never render it.
 *
 * Digit size and the quotient's answer-box height reuse addition's own
 * --practice-operand-size / --practice-answer-min-h tokens directly, so this
 * widget shares addition's exact footprint rather than a smaller lookalike.
 *
 * Quotient and dividend share a column sized to the CURRENT problem's actual
 * dividend digit count (not a constant), so a 2-digit dividend sits flush
 * against the bracket instead of floating in a gutter reserved for 3 digits
 * — while still staying fixed while the student types (the dividend's digit
 * count can't change mid-problem, only the quotient's can, and the quotient
 * can never have more digits than the dividend it divides into). The two
 * rows share identical right-side padding so their digits land on the same
 * place-value axis independent of how their left-side padding differs.
 */
export default function LongDivisionProblemInput({
  problem,
  onSubmit,
  disabled = false,
  feedbackState = 'idle',
  feedbackContent,
  showRemainder = true,
}: Props) {
  const [activeSlot, setActiveSlot] = useState<'quotient' | 'remainder'>('quotient');
  const [quotientValue, setQuotientValue] = useState('');
  const [remainderValue, setRemainderValue] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
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

  // Reset on new problem (feedbackState returns to idle) — including on mount,
  // so a student can load/refresh the page and start typing immediately.
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
      if (quotientValue.length >= QUOTIENT_MAX_DIGITS) return;
      const newQ = quotientValue + d;
      setQuotientValue(newQ);
      // Auto-advance only once the quotient is unambiguously complete (2 digits) —
      // and only when there's a remainder field to advance into.
      if (showRemainder && newQ.length === QUOTIENT_MAX_DIGITS) setActiveSlot('remainder');
    } else {
      // No correctness gate here, matching the quotient field: a student can
      // type any 2-digit remainder, including a wrong one (e.g. 10 for a
      // problem whose divisor is 5) — submit and the feedback banner is what
      // tells them it's wrong, not a silently rejected keystroke.
      if (remainderValue.length >= REMAINDER_MAX_DIGITS) return;
      setRemainderValue((v) => v + d);
    }
  }

  function handleBackspace() {
    if (activeSlot === 'remainder') {
      if (remainderValue.length === 0) {
        // Nothing to delete in remainder — step back to quotient, matching
        // how backspace behaves at the start of any text field.
        setActiveSlot('quotient');
        return;
      }
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
    if (isNaN(q)) return;
    if (!showRemainder) {
      lastSubmitAtRef.current = now;
      onSubmit(q);
      return;
    }
    const r = parseInt(remainderValue, 10);
    if (isNaN(r)) return;
    lastSubmitAtRef.current = now;
    onSubmit(q, r);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
      return;
    }
    if (!showRemainder) return;
    if (e.key === 'Tab' && !e.shiftKey && activeSlot === 'quotient') {
      e.preventDefault();
      setActiveSlot('remainder');
      return;
    }
    if (e.key === 'Tab' && e.shiftKey && activeSlot === 'remainder') {
      e.preventDefault();
      setActiveSlot('quotient');
      return;
    }
  }

  const activeValue = activeSlot === 'quotient' ? quotientValue : remainderValue;

  function switchSlot(slot: 'quotient' | 'remainder') {
    if (!disabled) {
      setActiveSlot(slot);
      inputRef.current?.focus();
    }
  }

  const digitColor =
    feedbackState === 'correct'
      ? 'text-[#059669]'
      : feedbackState === 'incorrect'
      ? 'text-[#DC2626]'
      : 'text-[#211D4F]';

  // The dividend's own digit count sets the shared column width for both
  // itself and the quotient above it — a 2-digit dividend gets a 2-digit-wide
  // column flush against the bracket, a 3-digit dividend gets a wider one.
  const columnWidth = `${String(problem.operandA).length}ch`;

  return (
    <div className="flex flex-col items-center gap-4 w-full font-practice">
      {/* Hidden input captures keyboard events for whichever slot is active */}
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
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />

      <div
        className={`flex items-end justify-center transition-opacity duration-200 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        } ${showRemainder ? '' : 'my-[length:var(--ld-no-remainder-inset)]'}`}
        aria-label={`${problem.operandA} divided by ${problem.operandB}. Enter the quotient${showRemainder ? ' and remainder' : ''}.`}
      >
        {/* Divisor — outside the bracket, aligned with the dividend's baseline */}
        <div className="pr-3 select-none">
          <span className="text-[length:var(--ld-digit-size)] font-bold text-[#211D4F] tabular-nums leading-none">
            {problem.operandB}
          </span>
        </div>

        {/* Quotient (above the bar) + bracket/dividend (below the bar). Both
            rows use identical right-side padding (pr-4) around an inner
            column sized to the dividend's own digit count, so the digits
            themselves land on the same place-value axis regardless of how
            differently the two rows are padded on the left (the bracket
            needs extra room for its border-left "hook"; the answer box
            doesn't). */}
        <div className="flex flex-col items-end">
          {/* Quotient — the primary answer. Styled and sized exactly like
              addition's own answer box (same border, same focus ring, same
              min-height) so it reads as an intentional field, not a chip,
              while still sitting directly above the bar like a student
              would write it. */}
          <div className="cursor-pointer mb-2" onClick={() => switchSlot('quotient')}>
            <span
              className={`inline-flex items-center justify-end min-h-[length:var(--ld-box-min-h)] rounded-xl border-[1.5px] pl-3 pr-4 transition-colors duration-150 ${
                activeSlot === 'quotient' && isFocused
                  ? 'border-[#4F46E5] bg-[#F5F3FF] shadow-[0_0_0_3px_rgba(79,70,229,0.14)]'
                  : 'border-[#8983B8] bg-transparent'
              }`}
            >
              <span style={{ minWidth: columnWidth }} className="inline-block text-right leading-none">
                {quotientValue.length === 0 ? (
                  <span className="inline-flex items-center justify-end w-full leading-none">
                    <span aria-hidden="true" className="text-[length:var(--ld-digit-size)] font-bold opacity-0 select-none">0</span>
                    {activeSlot === 'quotient' && (
                      <span
                        aria-hidden="true"
                        className="ml-1 w-[3px] h-[length:var(--ld-caret-h)] rounded-full bg-[#4F46E5] animate-[cursor-blink_1s_step-end_infinite] shrink-0"
                      />
                    )}
                  </span>
                ) : (
                  <span className={`text-[length:var(--ld-digit-size)] font-bold tabular-nums leading-none transition-colors duration-150 ${digitColor}`}>
                    {quotientValue}
                  </span>
                )}
              </span>
            </span>
          </div>

          {/* The bracket: border-top is the bar, border-left + rounded
              top-left corner draws the ⟌ hook. The dividend sits inside it,
              padded to match the quotient box's own right-side padding. */}
          <div className="border-t-[length:var(--ld-bracket-border-w)] border-l-[length:var(--ld-bracket-border-w)] border-[#211D4F] rounded-tl-2xl pl-3 pr-4 pt-2">
            <span
              style={{ minWidth: columnWidth }}
              className="inline-block text-right text-[length:var(--ld-digit-size)] font-bold text-[#211D4F] tabular-nums leading-none"
            >
              {problem.operandA}
            </span>
          </div>
        </div>
      </div>

      {/* Remainder — a real secondary answer field, not a status chip:
          large enough to read comfortably, but visibly smaller than the
          quotient above it so hierarchy stays clear. Division Facts and
          Divide By have no remainder — every exact-division problem — so
          this field is entirely omitted there, not just hidden, and the
          bracket block above gets extra breathing room (--ld-no-remainder-inset)
          instead so the card still fills the same upper problem area. */}
      {showRemainder && (
        <div className="flex items-center gap-2.5 cursor-pointer select-none" onClick={() => switchSlot('remainder')}>
          <span className="text-[length:var(--ld-remainder-label-size)] font-extrabold text-[#211D4F] uppercase tracking-wide">
            R:
          </span>
          <span
            className={`inline-flex items-center justify-center min-h-[length:var(--ld-remainder-box-min-h)] rounded-xl border-[1.5px] px-5 transition-colors duration-150 ${
              activeSlot === 'remainder' && isFocused
                ? 'border-[#4F46E5] bg-[#F5F3FF] shadow-[0_0_0_3px_rgba(79,70,229,0.14)]'
                : 'border-[#8983B8] bg-transparent'
            }`}
          >
            <span className="inline-block min-w-[2.5ch] text-center leading-none">
              {remainderValue.length === 0 ? (
                <span className="inline-flex items-center justify-center w-full leading-none">
                  <span aria-hidden="true" className="text-[length:var(--ld-remainder-size)] font-bold opacity-0 select-none">0</span>
                  {activeSlot === 'remainder' && (
                    <span
                      aria-hidden="true"
                      className="ml-1 w-[3px] h-[length:var(--ld-remainder-caret-h)] rounded-full bg-[#4F46E5] animate-[cursor-blink_1s_step-end_infinite] shrink-0"
                    />
                  )}
                </span>
              ) : (
                <span className={`text-[length:var(--ld-remainder-size)] font-bold tabular-nums leading-none transition-colors duration-150 ${digitColor}`}>
                  {remainderValue}
                </span>
              )}
            </span>
          </span>
        </div>
      )}

      {feedbackContent}

      <NumberPad
        onDigit={handleDigit}
        onBackspace={handleBackspace}
        onSubmit={handleSubmit}
        disabled={disabled}
        variant="prototype"
      />
    </div>
  );
}
