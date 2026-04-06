import PracticeWidget from './PracticeWidget';
import { useEffect, useState } from 'react';
import { MULTIPLICATION_FACTS, multiplyTableConfig } from '@/engine/presets';

type Mode = 'times-tables' | 'facts' | 'mixed';

const TABS: { id: 'times-tables' | 'facts'; label: string; href: string }[] = [
  { id: 'times-tables', label: 'Times Tables', href: '/multiplication/times-tables/1' },
  { id: 'facts', label: 'Mixed Practice', href: '/multiplication/facts' },
];

const SCROLL_KEY = 'mult-practice:scroll-y';

interface Props {
  active: Mode;
  selectedTable?: number;
}

export default function MultiplicationPracticeHub({ active, selectedTable = 1 }: Props) {
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved) {
      const y = Number.parseFloat(saved);
      if (Number.isFinite(y)) window.scrollTo({ top: y, behavior: 'auto' });
      sessionStorage.removeItem(SCROLL_KEY);
    }
  }, []);

  const handleTabClick = () => {
    sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
  };

  const handleTableSelect = (n: number) => {
    sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
    window.location.href = `/multiplication/times-tables/${n}`;
  };

  const normalizedActive: 'times-tables' | 'facts' = active === 'times-tables' ? 'times-tables' : 'facts';
  const config = normalizedActive === 'facts' ? MULTIPLICATION_FACTS : multiplyTableConfig(selectedTable);

  const topContent = (
    <div className="flex flex-col gap-1 p-1 bg-[#EEF2FF] border border-[#E0E7FF] rounded-xl">
      <div className="flex gap-1">
        {TABS.map(({ id, label, href }) => (
          <a
            key={id}
            href={href}
            onClick={handleTabClick}
            className={`flex-1 py-2.5 flex items-center justify-center text-sm font-semibold rounded-lg transition-colors duration-150 ${
              normalizedActive === id
                ? 'bg-white text-[#4F46E5] shadow-sm border-b-2 border-[#4F46E5]'
                : 'text-[#6B7280] hover:text-[#4338CA] hover:bg-white/60'
            }`}
          >
            {label}
          </a>
        ))}
      </div>

      {normalizedActive === 'times-tables' && (
        <>
          <div className="border-t border-[#E0E7FF] mx-1" />
          <button
            onClick={() => setShowPicker(true)}
            className="w-full mt-1 py-1.5 px-3 flex items-center justify-center gap-1.5 text-sm font-semibold rounded-lg bg-white shadow-sm border border-[#E0E7FF] text-[#1E1B4B] hover:border-[#4F46E5] transition-colors duration-150"
          >
            <span>{selectedTable} Times Table</span>
            <svg className="w-3.5 h-3.5 text-[#6B7280] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
          className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/40"
          onClick={() => setShowPicker(false)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:w-80 px-4 pt-3 pb-8 sm:p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="sm:hidden w-10 h-1 bg-[#E0E7FF] rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-[#6B7280]">Choose a times table</p>
              <button
                onClick={() => setShowPicker(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#EEF2FF] text-[#A5B4FC] hover:text-[#1E1B4B] transition-colors text-base leading-none"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                <button
                  key={n}
                  onClick={() => {
                    setShowPicker(false);
                    handleTableSelect(n);
                  }}
                  className={`py-4 sm:py-3 rounded-xl text-sm font-bold transition-colors duration-150 ${
                    selectedTable === n
                      ? 'bg-[#4F46E5] text-white'
                      : 'bg-[#F5F3FF] text-[#1E1B4B] hover:bg-[#EEF2FF]'
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
