import PracticeWidget from './PracticeWidget';
import { DIVISION_FACTS, DIVISION_REMAINDERS, divideByConfig } from '@/engine/presets';

type Mode = 'facts' | 'divide-by' | 'remainders';

interface Props {
  active: Mode;
  selectedDivisor?: number;
}

/**
 * All three division practice families — Division Facts, Divide By, and
 * Division with Remainders — share one practice surface: the prototype
 * variant's long-division bracket notation, card footprint, keypad, and
 * Streak/Reset row (see PracticeWidget + LongDivisionProblemInput).
 * Switching to a different mode or divisor happens through the global
 * header's Division menu or the page's below-widget local chooser — this
 * component's only job is picking the right config.
 */
export default function DivisionPracticeHub({ active, selectedDivisor = 1 }: Props) {
  const config =
    active === 'facts'
      ? DIVISION_FACTS
      : active === 'remainders'
        ? DIVISION_REMAINDERS
        : divideByConfig(selectedDivisor);

  return <PracticeWidget config={config} variant="prototype" />;
}
