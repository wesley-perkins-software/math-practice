import PracticeWidget from './PracticeWidget';
import PracticeChooser from './PracticeChooser';
import { DIVISION_FACTS, DIVISION_REMAINDERS, divideByConfig } from '@/engine/presets';
import { DIVISION_CHOOSER_ITEMS } from '@/config/practiceChoosers';

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
 * Switching families or divisors happens through the shared
 * PracticeChooser, opened from the card's own top-right corner (see
 * PracticeWidget's cornerAction) — this component's only other job is
 * picking the right config.
 */
export default function DivisionPracticeHub({ active, selectedDivisor = 1 }: Props) {
  const config =
    active === 'facts'
      ? DIVISION_FACTS
      : active === 'remainders'
        ? DIVISION_REMAINDERS
        : divideByConfig(selectedDivisor);

  return (
    <PracticeWidget
      config={config}
      variant="prototype"
      cornerAction={
        <PracticeChooser
          items={DIVISION_CHOOSER_ITEMS}
          currentId={active}
          currentNumber={active === 'divide-by' ? selectedDivisor : undefined}
        />
      }
    />
  );
}
