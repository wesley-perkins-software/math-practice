import PracticeWidget from './PracticeWidget';
import { useEffect, useState } from 'react';
import { MULTIPLICATION_FACTS } from '@/engine/presets';
import type { PracticeConfig } from '@/engine/types';

type Mode = 'times-tables' | 'mixed';

const TABS: { id: Mode; label: string; href: string }[] = [
  { id: 'times-tables', label: 'Times Tables', href: '/multiplication-practice/times-tables' },
  { id: 'mixed',        label: 'Mixed Practice', href: '/multiplication-practice/mixed' },
];

const TABLE_KEY  = 'mult-practice:table';
const SCROLL_KEY = 'mult-practice:scroll-y';

function tableConfig(n: number): PracticeConfig {
  return {
    storageKey: `mult-table-${n}`,
    label: `${n}s Table`,
    operation: 'multiplication',
    mode: 'untimed',
    timerDuration: 60,
    operandA: { min: n, max: n },
    operandB: { min: 1, max: 12 },
  };
}

interface Props {
  active: Mode;
}

export default function MultiplicationPracticeHub({ active }: Props) {
  const [selectedTable, setSelectedTable] = useState<number>(1);

  useEffect(() => {
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved) {
      const y = Number.parseFloat(saved);
      if (Number.isFinite(y)) window.scrollTo({ top: y, behavior: 'auto' });
      sessionStorage.removeItem(SCROLL_KEY);
    }

    const savedTable = sessionStorage.getItem(TABLE_KEY);
    if (savedTable) {
      const n = parseInt(savedTable, 10);
      if (n >= 1 && n <= 12) setSelectedTable(n);
    }
  }, []);

  const handleTabClick = () => {
    sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
  };

  const handleTableSelect = (n: number) => {
    setSelectedTable(n);
    sessionStorage.setItem(TABLE_KEY, String(n));
  };

  const config = active === 'mixed' ? MULTIPLICATION_FACTS : tableConfig(selectedTable);

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-3">
      {/* ── SELECTOR (above the card) ──────────────── */}
      <div className="flex flex-col gap-2">
        {/* Mode tabs */}
        <div className="flex gap-1 p-1 bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm border border-white/80">
          {TABS.map(({ id, label, href }) => (
            <a
              key={id}
              href={href}
              onClick={handleTabClick}
              className={`flex-1 py-2 flex items-center justify-center text-sm font-semibold rounded-xl transition-all duration-150 ${
                active === id
                  ? 'bg-white text-[#1E293B] shadow-sm'
                  : 'text-[#64748B] hover:text-[#334155] hover:bg-white/40'
              }`}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Number chips — only in times-tables mode */}
        {active === 'times-tables' && (
          <div className="grid grid-cols-6 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
              <button
                key={n}
                onClick={() => handleTableSelect(n)}
                className={`rounded-xl py-2 text-sm font-bold transition-all duration-150 ${
                  selectedTable === n
                    ? 'bg-[#3B82F6] text-white shadow-md scale-105'
                    : 'bg-white/70 text-[#475569] hover:bg-white hover:text-[#1E293B] shadow-sm'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── PRACTICE CARD (always same height) ─────── */}
      <PracticeWidget config={config} />
    </div>
  );
}
