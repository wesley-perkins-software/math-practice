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
  const [showPicker, setShowPicker] = useState(false);

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
    <div className="flex flex-col gap-1 p-1 bg-[#F1F5F9] rounded-xl">
      {/* Main tabs */}
      <div className="flex gap-1">
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

      {/* Divider + compact table selector */}
      {active === 'times-tables' && (
        <>
          <div className="border-t border-[#E2E8F0] mx-1" />
          <button
            onClick={() => setShowPicker(true)}
            className="w-full mt-1 py-1.5 px-3 flex items-center justify-center gap-1.5 text-sm font-semibold rounded-lg bg-white shadow-sm border border-[#E2E8F0] text-[#1E293B] hover:border-[#3B82F6] transition-colors duration-150"
          >
            <span>{selectedTable} Times Table</span>
            <svg className="w-3.5 h-3.5 text-[#64748B] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </>
      )}
    </div>
  );

  return (
    <>
      <PracticeWidget config={config} topContent={topContent} />
      {showPicker && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center bg-black/40"
          onClick={() => setShowPicker(false)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:w-80 px-4 pt-3 pb-8 sm:p-4"
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle — mobile only */}
            <div className="sm:hidden w-10 h-1 bg-[#E2E8F0] rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-[#64748B]">Choose a times table</p>
              <button
                onClick={() => setShowPicker(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#F1F5F9] text-[#94A3B8] hover:text-[#1E293B] transition-colors text-base leading-none"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                <button
                  key={n}
                  onClick={() => { handleTableSelect(n); setShowPicker(false); }}
                  className={`py-4 sm:py-3 rounded-xl text-sm font-bold transition-colors duration-150 ${
                    selectedTable === n
                      ? 'bg-[#3B82F6] text-white'
                      : 'bg-[#F1F5F9] text-[#1E293B] hover:bg-[#E2E8F0]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
