import PracticeWidget from './PracticeWidget';
import PracticeModeNav from './PracticeModeNav';
import { useEffect } from 'react';
import {
  SUBTRACTION_1_DIGIT,
  SUBTRACTION_2_DIGIT,
  SUBTRACTION_2_DIGIT_BORROWING,
} from '@/engine/presets';
import type { PracticeConfig } from '@/engine/types';

type Difficulty = '1-digit' | '2-digit-no-borrowing' | '2-digit-with-borrowing';

const DIFFICULTIES: { id: Difficulty; label: React.ReactNode; config: PracticeConfig; href: string }[] = [
  { id: '1-digit', label: '1-Digit', config: SUBTRACTION_1_DIGIT, href: '/subtraction/1-digit' },
  {
    id: '2-digit-no-borrowing',
    label: (
      <>
        <span className="block">2-Digit</span>
        <span className="block text-[10px] font-normal opacity-60 leading-tight">No Borrowing</span>
      </>
    ),
    config: SUBTRACTION_2_DIGIT,
    href: '/subtraction/2-digit-no-borrowing',
  },
  {
    id: '2-digit-with-borrowing',
    label: (
      <>
        <span className="block">2-Digit</span>
        <span className="block text-[10px] font-normal opacity-60 leading-tight">Borrowing</span>
      </>
    ),
    config: SUBTRACTION_2_DIGIT_BORROWING,
    href: '/subtraction/2-digit-with-borrowing',
  },
];

interface Props {
  active: Difficulty;
}

const TAB_SCROLL_KEY = 'subtraction-practice:scroll-y';

export default function SubtractionPracticeHub({ active }: Props) {
  useEffect(() => {
    const saved = sessionStorage.getItem(TAB_SCROLL_KEY);
    if (!saved) return;

    const y = Number.parseFloat(saved);
    if (!Number.isFinite(y)) {
      sessionStorage.removeItem(TAB_SCROLL_KEY);
      return;
    }

    window.scrollTo({ top: y, behavior: 'auto' });
    sessionStorage.removeItem(TAB_SCROLL_KEY);
  }, []);

  const handleTabClick = () => {
    sessionStorage.setItem(TAB_SCROLL_KEY, String(window.scrollY));
  };

  const selected = DIFFICULTIES.find(d => d.id === active)!;

  return (
    <>
      <PracticeModeNav
        items={DIFFICULTIES.map(({ id, label, href }) => ({ id, label, href }))}
        activeId={active}
        ariaLabel="Subtraction difficulty"
        onItemClick={handleTabClick}
      />
      <PracticeWidget config={selected.config} />
    </>
  );
}
