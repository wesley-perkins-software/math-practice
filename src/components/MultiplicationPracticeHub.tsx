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
    factsMode: true,
    maxFactor: 12,
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

  const topContent = (
    <div className="flex flex-col gap-2">
      {/* Main tabs */}
      <div className="flex gap-1 p-1 bg-[#F1F5F9] rounded-xl">
        {TABS.map(({ id, label, href }) => (
          <a
            key={id}
            href={href}
            onClick={handleTabClick}
            className={`flex-1 py-2 flex items-center justify-center text-sm font-semibold rounded-lg transition-colors duration-150 ${
              active === id
                ? 'bg-white text-[#1E293B] shadow-sm border-b-2 border-[#3B82F6]'
                : 'text-[#64748B] hover:text-[#334155] hover:bg-white/50'
            }`}
          >
            {label}
          </a>
        ))}
      </div>

      {/* Number selector */}
      {active === 'times-tables' && (
        <div className="flex flex-col gap-1 p-1 bg-[#F1F5F9] rounded-xl">
          {[[1, 2, 3, 4, 5, 6], [7, 8, 9, 10, 11, 12]].map((row, rowIdx) => (
            <div key={rowIdx} className="flex gap-1">
              {row.map(n => (
                <button
                  key={n}
                  onClick={() => handleTableSelect(n)}
                  className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition-colors duration-150 ${
                    selectedTable === n
                      ? 'bg-white text-[#1E293B] shadow-sm border-b-2 border-[#3B82F6]'
                      : 'text-[#64748B] hover:text-[#334155] hover:bg-white/50'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return <PracticeWidget config={config} topContent={topContent} />;
}
