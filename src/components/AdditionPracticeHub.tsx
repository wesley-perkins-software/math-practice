import PracticeWidget from './PracticeWidget';
import PracticeModeNav from './PracticeModeNav';
import { useEffect } from 'react';
import {
  ADDITION_1_DIGIT,
  ADDITION_2_DIGIT,
  ADDITION_2_DIGIT_CARRYING,
} from '@/engine/presets';
import type { PracticeConfig } from '@/engine/types';

type Difficulty = '1-digit' | '2-digit-no-carrying' | '2-digit-with-carrying';

const DIFFICULTIES: { id: Difficulty; label: React.ReactNode; config: PracticeConfig; href: string }[] = [
  { id: '1-digit',  label: '1-Digit',  config: ADDITION_1_DIGIT, href: '/addition/1-digit' },
  {
    id: '2-digit-no-carrying',
    label: (
      <>
        <span className="block">2-Digit</span>
        <span className="block text-[10px] font-normal opacity-60 leading-tight">No Carry</span>
      </>
    ),
    config: ADDITION_2_DIGIT,
    href: '/addition/2-digit-no-carrying',
  },
  {
    id: '2-digit-with-carrying',
    label: (
      <>
        <span className="block">2-Digit</span>
        <span className="block text-[10px] font-normal opacity-60 leading-tight">Carrying</span>
      </>
    ),
    config: ADDITION_2_DIGIT_CARRYING,
    href: '/addition/2-digit-with-carrying',
  },
];

interface Props {
  active: Difficulty;
  /** 'prototype' opts into the redesigned surface (currently /addition/1-digit only). */
  variant?: 'classic' | 'prototype';
}

const TAB_SCROLL_KEY = 'addition-practice:scroll-y';

export default function AdditionPracticeHub({ active, variant = 'classic' }: Props) {
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
        ariaLabel="Addition difficulty"
        onItemClick={handleTabClick}
        variant={variant}
      />
      <PracticeWidget config={selected.config} variant={variant} />
    </>
  );
}
