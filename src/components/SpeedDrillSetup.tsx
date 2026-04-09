import { useState } from 'react';
import PracticeWidget from './PracticeWidget';
import { ARITHMETIC_SPEED_DRILL } from '@/engine/presets';
import type { PracticeConfig } from '@/engine/types';

type Op = 'addition' | 'subtraction' | 'multiplication' | 'division';

const ALL_OPS: { op: Op; label: string; symbol: string }[] = [
  { op: 'addition', label: 'Addition', symbol: '+' },
  { op: 'subtraction', label: 'Subtraction', symbol: '−' },
  { op: 'multiplication', label: 'Multiplication', symbol: '×' },
  { op: 'division', label: 'Division', symbol: '÷' },
];

export default function SpeedDrillSetup() {
  const [selectedOps, setSelectedOps] = useState<Set<Op>>(
    new Set(['addition', 'subtraction', 'multiplication', 'division'])
  );
  const [config, setConfig] = useState<PracticeConfig | null>(null);

  function toggleOp(op: Op) {
    setSelectedOps((prev) => {
      if (prev.has(op) && prev.size === 1) return prev; // keep at least one
      const next = new Set(prev);
      next.has(op) ? next.delete(op) : next.add(op);
      return next;
    });
  }

  function start() {
    const ops = ALL_OPS.filter((o) => selectedOps.has(o.op)).map((o) => o.op);
    setConfig({ ...ARITHMETIC_SPEED_DRILL, operations: ops });
  }

  if (config) {
    return (
      <div>
        <PracticeWidget config={config} />
        <div className="mt-4 text-center">
          <button
            onClick={() => setConfig(null)}
            className="text-sm text-[#6B7280] hover:text-[#4F46E5] transition-colors"
          >
            ← Change operations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(79,70,229,0.10)] ring-1 ring-[#E0E7FF] w-full max-w-lg mx-auto overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#2563EB]" />
      <div className="p-6">
        <p className="text-sm font-semibold text-[#1E293B] mb-4">Choose operations:</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {ALL_OPS.map(({ op, label, symbol }) => {
            const checked = selectedOps.has(op);
            return (
              <button
                key={op}
                onClick={() => toggleOp(op)}
                aria-pressed={checked}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all font-medium text-sm cursor-pointer ${
                  checked
                    ? 'border-[#4F46E5] bg-[#EEF2FF] text-[#4F46E5]'
                    : 'border-[#E2E8F0] bg-white text-[#94A3B8] hover:border-[#C7D2FE] hover:text-[#6B7280]'
                }`}
              >
                <span className="text-xl font-bold font-mono leading-none">{symbol}</span>
                <span className="text-xs">{label}</span>
              </button>
            );
          })}
        </div>
        <button
          onClick={start}
          className="w-full py-3 px-6 bg-[#4F46E5] hover:bg-[#4338CA] active:bg-[#3730A3] text-white font-bold rounded-xl transition-colors"
        >
          Start Drill →
        </button>
      </div>
    </div>
  );
}
