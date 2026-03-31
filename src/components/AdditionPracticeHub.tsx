import PracticeWidget from './PracticeWidget';
import {
  ADDITION_1_DIGIT,
  ADDITION_2_DIGIT,
  ADDITION_2_DIGIT_CARRYING,
  ADDITION_GENERAL,
} from '@/engine/presets';
import type { PracticeConfig } from '@/engine/types';

type Difficulty = '1-digit' | '2-digit' | 'carrying' | 'mixed';

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
  { id: 'mixed',    label: 'Mixed',    config: ADDITION_GENERAL,           href: '/addition-practice' },
];

interface Props {
  active: Difficulty;
}

export default function AdditionPracticeHub({ active }: Props) {
  const selected = DIFFICULTIES.find(d => d.id === active)!;

  const tabs = (
    <div className="flex gap-1 p-1 bg-[#F1F5F9] rounded-xl">
      {DIFFICULTIES.map(({ id, label, href }) => (
        <a
          key={id}
          href={href}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors leading-snug text-center ${
            active === id
              ? 'bg-white text-[#1E293B] shadow-sm'
              : 'text-[#64748B] hover:text-[#1E293B]'
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
