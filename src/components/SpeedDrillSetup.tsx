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
        <PracticeWidget config={config} variant="prototype" />
        <div className="mt-4 text-center font-practice">
          <button
            onClick={() => setConfig(null)}
            className="text-sm text-[#6B6690] hover:text-[#4F46E5] transition-colors"
          >
            ← Change operations
          </button>
        </div>
      </div>
    );
  }

  // Operation picker: same card footprint (white, bordered, rounded) as the
  // practice card it hands off to, so the setup step reads as the front of
  // the same instrument rather than a different, older widget. Restyled
  // only as far as the shared visual language requires — the picker's own
  // architecture (toggle a set of operations, then start) is unchanged.
  return (
    <div className="bg-white rounded-2xl border border-[#E4E1F5] w-full max-w-[length:var(--practice-card-max-w)] mx-auto overflow-hidden font-practice">
      <div className="px-[length:var(--practice-card-px)] pt-[length:var(--practice-card-pt)] pb-[length:var(--practice-card-pb)]">
        <p className="text-sm font-semibold text-[#211D4F] mb-4">Choose operations:</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {ALL_OPS.map(({ op, label, symbol }) => {
            const checked = selectedOps.has(op);
            return (
              <button
                key={op}
                onClick={() => toggleOp(op)}
                aria-pressed={checked}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all font-bold text-sm cursor-pointer ${
                  checked
                    ? 'border-[#4F46E5] bg-[#F5F3FF] text-[#4F46E5]'
                    : 'border-[#E4E1F5] bg-white text-[#8983B8] hover:border-[#C7D2FE] hover:text-[#6B6690]'
                }`}
              >
                <span className="text-xl leading-none">{symbol}</span>
                <span className="text-xs font-semibold">{label}</span>
              </button>
            );
          })}
        </div>
        <button
          onClick={start}
          className="w-full py-3.5 px-6 bg-[#4F46E5] hover:bg-[#3E35C7] active:shadow-none active:translate-y-[2px] text-white font-bold rounded-xl transition-all shadow-[0_3px_0_0_#3730A3,0_4px_12px_rgba(79,70,229,0.30)] hover:shadow-[0_3px_0_0_#312E81,0_6px_16px_rgba(79,70,229,0.40)]"
        >
          Start Drill →
        </button>
      </div>
    </div>
  );
}
