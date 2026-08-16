import PracticeWidget from './PracticeWidget';
import { useState } from 'react';
import { MULTIPLICATION_FACTS, multiplyTableConfig } from '@/engine/presets';

type Mode = 'times-tables' | 'facts';

interface Props {
  active: Mode;
  selectedTable?: number;
}

/**
 * Both multiplication practice families — Multiplication Facts and Times
 * Tables — share one practice surface: the prototype variant's vertically
 * stacked written-arithmetic notation, card footprint, keypad, and
 * Streak/Reset row (see PracticeWidget + WrittenProblemInput). Mode
 * switching lives on each page's own H1 row as static markup (the same
 * "H1 + contextual switcher" pattern /addition/1-digit and the division
 * pages already use), not here — this component's only job is picking the
 * right config and, for Times Tables, offering the table picker specific
 * to that one mode.
 */
export default function MultiplicationPracticeHub({ active, selectedTable = 1 }: Props) {
  const [showPicker, setShowPicker] = useState(false);

  const config = active === 'facts' ? MULTIPLICATION_FACTS : multiplyTableConfig(selectedTable);

  return (
    <>
      {active === 'times-tables' && (
        <button
          onClick={() => setShowPicker(true)}
          className="w-full max-w-[length:var(--practice-card-max-w)] mx-auto mb-2.5 py-1.5 px-3 flex items-center justify-center gap-1.5 font-practice text-sm font-semibold rounded-lg bg-white shadow-sm border border-[#E4E1F5] text-[#211D4F] hover:border-[#4F46E5] transition-colors duration-150"
        >
          <span>{selectedTable} Times Table</span>
          <svg
            className="w-3.5 h-3.5 text-[#8983B8] shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
      <PracticeWidget config={config} variant="prototype" />
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
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                <a
                  key={n}
                  href={`/multiplication/times-tables/${n}`}
                  className={`py-4 sm:py-3 rounded-xl text-sm font-bold transition-colors duration-150 text-center ${
                    selectedTable === n
                      ? 'bg-[#4F46E5] text-white'
                      : 'bg-[#F5F3FF] text-[#1E1B4B] hover:bg-[#EEF2FF]'
                  }`}
                >
                  {n}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
