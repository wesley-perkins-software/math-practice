import { describeFraction, fractionBarSegments } from '@/engine/fractions/visual';

interface Props {
  numerator: number;
  /** 2–12, matching the V1/prototype visual model's supported range. */
  denominator: number;
  className?: string;
}

/**
 * The only V1 visual model: a horizontal bar split into equal partitions.
 * Shading is conveyed by fill vs. no-fill plus a strong border (not hue
 * alone), so meaning survives grayscale. No animation, no third-party
 * charting library — pure inline SVG, reused unchanged for screen and any
 * future print spike.
 */
export default function FractionBar({ numerator, denominator, className = '' }: Props) {
  const segments = fractionBarSegments(numerator, denominator);
  const label = describeFraction(numerator, denominator);

  const width = 320;
  const height = 64;
  const gap = 3;
  const segmentWidth = (width - gap * (denominator - 1)) / denominator;

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${width} ${height}`}
      className={`w-full max-w-[20rem] h-auto mx-auto ${className}`}
    >
      {segments.map((shaded, i) => (
        <rect
          key={i}
          x={i * (segmentWidth + gap)}
          y={0}
          width={segmentWidth}
          height={height}
          rx={4}
          fill={shaded ? '#4F46E5' : '#FFFFFF'}
          stroke="#1E1B4B"
          strokeWidth={3}
          aria-hidden="true"
        />
      ))}
    </svg>
  );
}
