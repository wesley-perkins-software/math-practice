import PracticeWidget from './PracticeWidget';
import PracticeModeNav from './PracticeModeNav';
import { useEffect } from 'react';
import {
  ADDITION_1_DIGIT,
  ADDITION_2_DIGIT,
  ADDITION_2_DIGIT_CARRYING,
} from '@/engine/presets';
import type { PracticeConfig } from '@/engine/types';

type Difficulty = '1-digit' | '2-digit-without-regrouping' | '2-digit-with-regrouping';

const DIFFICULTIES: { id: Difficulty; label: React.ReactNode; config: PracticeConfig; href: string }[] = [
  { id: '1-digit',  label: '1-Digit',  config: ADDITION_1_DIGIT, href: '/addition/1-digit' },
  {
    id: '2-digit-without-regrouping',
    label: (
      <>
        <span className="block">2-Digit</span>
        <span className="block text-[10px] font-normal opacity-60 leading-tight">No Regrouping</span>
      </>
    ),
    config: ADDITION_2_DIGIT,
    href: '/addition/2-digit-without-regrouping',
  },
  {
    id: '2-digit-with-regrouping',
    label: (
      <>
        <span className="block">2-Digit</span>
        <span className="block text-[10px] font-normal opacity-60 leading-tight">Regrouping</span>
      </>
    ),
    config: ADDITION_2_DIGIT_CARRYING,
    href: '/addition/2-digit-with-regrouping',
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

  // Prototype (round 4): mode switching lives on the H1 row instead, as
  // static markup in addition/1-digit.astro — not as a React-rendered row
  // here. That's the point of the pattern being tested: "H1 + contextual
  // switcher" should work as a plain per-page Astro construct so a future
  // page (e.g. times-tables) can reuse it without needing a component like
  // this one at all. Nothing to render here for mode-switching anymore.
  if (variant === 'prototype') {
    return <PracticeWidget config={selected.config} variant={variant} />;
  }

  return (
    <>
      <PracticeModeNav
        items={DIFFICULTIES.map(({ id, label, href }) => ({ id, label, href }))}
        activeId={active}
        ariaLabel="Addition difficulty"
        onItemClick={handleTabClick}
      />
      <PracticeWidget config={selected.config} variant={variant} />
    </>
  );
}
