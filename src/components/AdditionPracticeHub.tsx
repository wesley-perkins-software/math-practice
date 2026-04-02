import PracticeWidget from './PracticeWidget';
import { useEffect } from 'react';
import {
  ADDITION_1_DIGIT,
  ADDITION_2_DIGIT,
  ADDITION_2_DIGIT_CARRYING,
} from '@/engine/presets';
import type { PracticeConfig } from '@/engine/types';

type Difficulty = '1-digit' | '2-digit' | 'carrying';

const DIFFICULTIES: { id: Difficulty; label: React.ReactNode; config: PracticeConfig; href: string }[] = [
  { id: '1-digit',  label: '1-Digit',  config: ADDITION_1_DIGIT,          href: '/addition-practice/1-digit' },
  {
    id: '2-digit',
    label: (
      <>
        <span className="block">2-Digit</span>
        <span className="block text-[10px] font-normal opacity-60 leading-tight">No Carry</span>
      </>
    ),
    config: ADDITION_2_DIGIT,
    href: '/addition-practice/2-digit',
  },
  {
    id: 'carrying',
    label: (
      <>
        <span className="block">2-Digit</span>
        <span className="block text-[10px] font-normal opacity-60 leading-tight">Carrying</span>
      </>
    ),
    config: ADDITION_2_DIGIT_CARRYING,
    href: '/addition-practice/2-digit-carrying',
  },
];

interface Props {
  active: Difficulty;
}

const TAB_SCROLL_KEY = 'addition-practice:scroll-y';

export default function AdditionPracticeHub({ active }: Props) {
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

  const tabs = (
    <div className="flex gap-1 p-1 bg-[#F1F5F9] rounded-xl">
      {DIFFICULTIES.map(({ id, label, href }) => (
        <a
          key={id}
          href={href}
          onClick={handleTabClick}
          className={`flex-1 py-2 flex flex-col items-center justify-center text-sm font-semibold rounded-lg transition-colors duration-150 leading-snug ${
            active === id
              ? 'bg-white text-[#1E293B] shadow-sm border-b-2 border-[#3B82F6]'
              : 'text-[#64748B] hover:text-[#334155] hover:bg-white/50'
          }`}
        >
          {label}
        </a>
      ))}
    </div>
  );

  return (
    <PracticeWidget config={selected.config} topContent={tabs} />
  );
}
