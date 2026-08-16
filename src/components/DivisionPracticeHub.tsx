import PracticeWidget from './PracticeWidget';
import PracticeModeNav from './PracticeModeNav';
import { useState } from 'react';
import { DIVISION_FACTS, DIVISION_REMAINDERS, divideByConfig } from '@/engine/presets';

type Mode = 'facts' | 'divide-by' | 'remainders';

const TABS: { id: Mode; label: string; href: string }[] = [
  { id: 'divide-by', label: 'Divide By', href: '/division/divide-by/1' },
  { id: 'facts', label: 'Division Facts', href: '/division/facts' },
  { id: 'remainders', label: 'With Remainders', href: '/division/remainders' },
];

interface Props {
  active: Mode;
  selectedDivisor?: number;
}

export default function DivisionPracticeHub({ active, selectedDivisor = 1 }: Props) {
  const [showPicker, setShowPicker] = useState(false);

  const config =
    active === 'facts'
      ? DIVISION_FACTS
      : active === 'remainders'
        ? DIVISION_REMAINDERS
        : divideByConfig(selectedDivisor);

  // Prototype: /division/remainders tests the same "H1 + contextual switcher"
  // pattern as /addition/1-digit (see that page's h1 slot) — mode switching
  // lives there as static markup instead of this segmented tab row, and the
  // widget renders with the long-division notation. Scoped to `remainders`
  // only; facts/divide-by keep today's tab tray unchanged.
  if (active === 'remainders') {
    return <PracticeWidget config={config} variant="prototype" />;
  }

  const picker = active === 'divide-by' && (
    <button
      onClick={() => setShowPicker(true)}
      className="w-full max-w-lg mx-auto mt-1.5 py-1 px-3 flex items-center justify-center gap-1.5 text-sm font-semibold rounded-lg bg-white shadow-sm border border-[#E0E7FF] text-[#1E1B4B] hover:border-[#4F46E5] transition-colors duration-150"
    >
      <span>Dividing by {selectedDivisor}</span>
      <svg
        className="w-3.5 h-3.5 text-[#6B7280] shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );

  return (
    <>
      <PracticeModeNav
        items={TABS.map(({ id, label, href }) => ({ id, label, href }))}
        activeId={active}
        ariaLabel="Division mode"
        extra={picker}
      />
      <PracticeWidget config={config} />
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
              <p className="text-sm font-semibold text-[#6B7280]">Choose a divisor</p>
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
                  href={`/division/divide-by/${n}`}
                  className={`py-4 sm:py-3 rounded-xl text-sm font-bold transition-colors duration-150 text-center ${
                    selectedDivisor === n
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
