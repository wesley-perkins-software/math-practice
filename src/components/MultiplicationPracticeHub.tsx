import PracticeWidget from './PracticeWidget';
import { MULTIPLICATION_FACTS, multiplyTableConfig } from '@/engine/presets';

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
 * to a different mode or table happens through the global header's
 * Multiplication menu or the page's below-widget local chooser — this
 * component's only job is picking the right config.
 */
export default function MultiplicationPracticeHub({ active, selectedTable = 1 }: Props) {
  const config = active === 'facts' ? MULTIPLICATION_FACTS : multiplyTableConfig(selectedTable);

  return <PracticeWidget config={config} variant="prototype" />;
}
