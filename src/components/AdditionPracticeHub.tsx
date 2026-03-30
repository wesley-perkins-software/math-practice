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

const DIFFICULTIES: { id: Difficulty; label: string; description: string; config: PracticeConfig }[] = [
  { id: '1-digit',  label: '1-Digit',  description: 'Single digits only',       config: ADDITION_1_DIGIT },
  { id: '2-digit',  label: '2-Digit',  description: 'Two-digit numbers',         config: ADDITION_2_DIGIT },
  { id: 'carrying', label: 'Carrying', description: 'Requires regrouping',       config: ADDITION_2_DIGIT_CARRYING },
  { id: 'mixed',    label: 'Mixed',    description: 'All difficulty levels',     config: ADDITION_GENERAL },
];

export default function AdditionPracticeHub() {
  const [difficulty, setDifficulty] = useState<Difficulty>('mixed');
  const selected = DIFFICULTIES.find(d => d.id === difficulty)!;

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-3">
      {/* Difficulty tab selector */}
      <div className="flex gap-1 p-1 bg-[#F1F5F9] rounded-xl">
        {DIFFICULTIES.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setDifficulty(id)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
              difficulty === id
                ? 'bg-white text-[#1E293B] shadow-sm'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Practice widget — remounts on difficulty change to reset session */}
      <PracticeWidget key={selected.config.storageKey} config={selected.config} />
    </div>
  );
}
