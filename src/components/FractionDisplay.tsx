interface Props {
  numerator: React.ReactNode;
  denominator: React.ReactNode;
  /** 'lg' matches the practice surface's primary operand size; 'sm' a secondary scale (e.g. an inline "= " sign). */
  size?: 'lg' | 'sm';
  /** Muted color for a fixed/non-editable value shown alongside editable ones (e.g. Equivalent Fractions' locked denominator). */
  muted?: boolean;
  className?: string;
}

/**
 * A read-only stacked fraction, shared by the prompt display and (indirectly,
 * via the same classes) FractionInput's fixed slots — one rendering
 * primitive instead of bespoke "a/b" text per page. Uses the classic
 * shrink-to-fit stacked-fraction technique: the outer inline-block sizes to
 * its widest (nowrap) child, and the divider is a block element that fills
 * that width by default.
 */
export default function FractionDisplay({ numerator, denominator, size = 'lg', muted = false, className = '' }: Props) {
  const textSizeClass = size === 'lg' ? 'text-[length:var(--practice-operand-size)]' : 'text-[length:var(--practice-operator-size)]';
  const colorClass = muted ? 'text-[#8983B8]' : 'text-[#211D4F]';
  return (
    <span className={`font-practice inline-block text-center select-none ${className}`}>
      <span className={`block font-bold leading-none tabular-nums whitespace-nowrap ${textSizeClass} ${colorClass}`}>{numerator}</span>
      <span className={`block border-t-4 my-1 ${muted ? 'border-[#C7C2E8]' : 'border-[#211D4F]'}`} aria-hidden="true" />
      <span className={`block font-bold leading-none tabular-nums whitespace-nowrap ${textSizeClass} ${colorClass}`}>{denominator}</span>
    </span>
  );
}
