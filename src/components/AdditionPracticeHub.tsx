import { useState } from 'react';
import PracticeWidget from './PracticeWidget';
import {
  ADDITION_1_DIGIT,
  ADDITION_2_DIGIT,
  ADDITION_2_DIGIT_CARRYING,
  ADDITION_GENERAL,
} from '@/engine/presets';
import type { PracticeConfig } from '@/engine/types';

type Difficulty = '1-digit' | '2-digit' | 'carrying' | 'mixed';

const DIFFICULTIES: { id: Difficulty; label: string; config: PracticeConfig }[] = [
  { id: '1-digit',  label: '1-Digit',  config: ADDITION_1_DIGIT },
  { id: '2-digit',  label: '2-Digit No Carrying', config: ADDITION_2_DIGIT },
  { id: 'carrying', label: '2-Digit With Carrying', config: ADDITION_2_DIGIT_CARRYING },
  { id: 'mixed',    label: 'Mixed',    config: ADDITION_GENERAL },
];

export default function AdditionPracticeHub() {
  const [difficulty, setDifficulty] = useState<Difficulty>('mixed');
  const selected = DIFFICULTIES.find(d => d.id === difficulty)!;

  const tabs = (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-[#F1F5F9] rounded-xl">
      {DIFFICULTIES.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => setDifficulty(id)}
          className={`min-h-11 px-2 py-2 text-xs sm:text-sm leading-tight font-semibold rounded-lg transition-colors ${
            difficulty === id
              ? 'bg-white text-[#1E293B] shadow-sm'
              : 'text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <PracticeWidget config={selected.config} topContent={tabs} />
  );
}
