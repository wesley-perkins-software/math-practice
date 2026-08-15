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

  // Fade-in animation on problem change
  useEffect(() => {
    setIsVisible(false);
    const id = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(id);
  }, [problem.operandA, problem.operandB, problem.operation]);

  // Classic: focus hidden input whenever enabled (unchanged behavior, incl. on mount).
  useEffect(() => {
    if (variant === 'prototype') return;
    if (!disabled) inputRef.current?.focus();
  }, [disabled, variant]);

  // Classic: clear and refocus when feedback resets to idle (next problem), always including mount.
  useEffect(() => {
    if (variant === 'prototype') return;
    if (feedbackState === 'idle') {
      setValue('');
      inputRef.current?.focus();
    }
  }, [feedbackState, variant]);

  // Prototype: clear + refocus whenever idle, including on mount. This is a
  // dedicated single-purpose practice surface — a student should be able to
  // load/refresh the page and start typing immediately — so immediate
  // keyboard readiness on load outweighs the earlier concern about
  // relocating tab order away from the H1/switcher.
  useEffect(() => {
    if (variant !== 'prototype') return;
    if (feedbackState === 'idle') {
      setValue('');
      inputRef.current?.focus();
    }
  }, [feedbackState, variant]);

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

    return (
      <div className="flex flex-col items-center gap-2.5 w-full">
        {/* Written arithmetic: no bordering card — the rule, spacing, and
            right-alignment already read as "an equation" without another
            container-inside-a-container. The focus ring lives on the answer
            row only (where the cursor already is), not around the whole
            equation. Sized at 76px after the first pass (96px) proved too
            tall to keep the full instrument above the fold at 1366×768.

            Round 4: the column is now a FIXED width (not intrinsic/w-fit),
            centered as a whole. This is what keeps the ones column's right
            edge perfectly stationary as the answer grows from 1 to 3 digits
            (this component is shared logic for 2-digit modes too, where
            99+99=198 is a real answer) — every row inside is still
            right-aligned, but the box itself no longer resizes to its
            content, so growing the answer only eats into the box's own left
            margin instead of shifting the whole column outward. Width
            verified by rendering "198" and confirming the ones-digit stays
            pixel-aligned with the operand rows, not derived from a formula. */}
        <div
          // Round 6: dropped the column-level pr-3 from round 5 — it made
          // the answer box's own pr-3.5 an UNCOMPENSATED second inset on
          // top of it, so the answer digit landed ~14px left of the
          // operand digits' right edge (a real place-value misalignment,
          // caught by measuring rendered glyph geometry, not just looking
          // at it). Every row here is a plain 100%-width `text-right`
          // block, so operandA / operandB / the rule / the answer box's
          // OWN right edge all share one exact right-alignment axis at
          // this column's true right edge — verified via
          // getBoundingClientRect, not eyeballed. The answer box's visible
          // border still needs room past that axis for the caret; that's
          // solved on the box itself below (pr-3.5 cancelled by a matching
          // -mr-3.5), not by moving this shared axis.
          className={`font-practice select-none w-[length:var(--practice-column-w)] mx-auto transition-opacity duration-200 ease-out ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
          aria-label={`What is ${problem.operandA} ${symbol} ${problem.operandB}?`}
          onClick={() => inputRef.current?.focus()}
        >
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

          <div className="text-right">
            <span className="text-[length:var(--practice-operand-size)] font-bold text-[#211D4F] leading-none">{problem.operandA}</span>
          </div>
          <div className="flex items-center justify-end gap-3 mt-1">
            <span className="text-[length:var(--practice-operator-size)] font-bold text-[#211D4F] leading-none">{symbol}</span>
            <span className="text-[length:var(--practice-operand-size)] font-bold text-[#211D4F] leading-none">{problem.operandB}</span>
          </div>
          <div className="border-t-4 border-[#211D4F] mt-2" />
          {/*
            Round 5: this box is visible at rest too (a quiet 1.5px border a
            few steps off the card's own white background) instead of
            appearing only once focused — it reads as "this is where you
            type" the moment the problem loads. Focus swaps it for a
            stronger indigo border plus a soft tinted fill.

            Round 6: pr-3.5 gives the caret real room before it hits the
            border — but padding alone pulls the digit's right edge inward,
            off the operand/rule alignment axis. -mr-3.5 cancels that by
            widening the box itself by the same amount on the right, so the
            box's INNER content edge (where the digit sits) lands back on
            the exact axis the operand rows use, while the box's visible
            border sits 14px further right, past the caret, inside the
            surrounding whitespace this column already has. Net effect:
            digit alignment is untouched, caret containment is real.
          */}
          <div
            className={`text-right mt-1.5 min-h-[length:var(--practice-answer-min-h)] flex items-center justify-end rounded-xl border-[1.5px] pl-2.5 pr-3.5 -mr-3.5 transition-colors duration-150 ${
              isFocused
                ? 'border-[#4F46E5] bg-[#F5F3FF] shadow-[0_0_0_3px_rgba(79,70,229,0.14)]'
                : 'border-[#8983B8] bg-transparent'
            }`}
          >
            {isPlaceholder ? (
              <span className="text-[length:var(--practice-operand-size)] font-bold text-[#D7D3EE] inline-flex items-center leading-none">
                <span aria-hidden="true" className="opacity-0 select-none">0</span>
                {isFocused && (
                  <span
                    aria-hidden="true"
                    className="ml-1.5 w-[3px] h-[length:var(--practice-caret-h)] rounded-full bg-[#4F46E5] animate-[cursor-blink_1s_step-end_infinite]"
                  />
                )}
              </span>
            ) : (
              <span className={`text-[length:var(--practice-operand-size)] font-bold transition-colors duration-150 leading-none ${answerColorProto}`}>{value}</span>
            )}
          </div>
        </div>

        {feedbackContent}

        {/* On-screen keypad stays visible by default across every context —
            not a keyboard-first affordance a child has to discover. Physical
            keyboard input (typing digits, Enter to submit) still works in
            parallel via the hidden input above. */}
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
