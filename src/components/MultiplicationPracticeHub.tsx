import PracticeWidget from './PracticeWidget';
import PracticeChooser from './PracticeChooser';
import { MULTIPLICATION_FACTS, multiplyTableConfig } from '@/engine/presets';
import { MULTIPLICATION_CHOOSER_ITEMS } from '@/config/practiceChoosers';

type Mode = 'times-tables' | 'facts';

interface Props {
  active: Mode;
  selectedTable?: number;
}

/**
 * Both multiplication practice families — Multiplication Facts and Times
 * Tables — share one practice surface: the prototype variant's vertically
 * stacked written-arithmetic notation, card footprint, keypad, and
 * Streak/Reset row (see PracticeWidget + WrittenProblemInput). Switching
 * families or times tables happens through the shared PracticeChooser,
 * opened from the card's own top-right corner (see PracticeWidget's
 * cornerAction) — this component's only other job is picking the right
 * config.
 */
export default function MultiplicationPracticeHub({ active, selectedTable = 1 }: Props) {
  const config = active === 'facts' ? MULTIPLICATION_FACTS : multiplyTableConfig(selectedTable);

  return (
    <PracticeWidget
      config={config}
      variant="prototype"
      cornerAction={
        <PracticeChooser
          items={MULTIPLICATION_CHOOSER_ITEMS}
          currentId={active}
          currentNumber={active === 'times-tables' ? selectedTable : undefined}
        />
      }
    />
  );
}
