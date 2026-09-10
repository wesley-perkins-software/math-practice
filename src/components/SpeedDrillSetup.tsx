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
            className="text-sm text-[#211D4F] hover:text-[#4F46E5] transition-colors"
          >
            ← Change operations
          </button>
        </div>
      </div>
    );
  }

  // Operation picker: deliberately card-free. An outer bordered panel around
  // an already-bordered set of controls and a filled CTA nested three
  // boundaries deep for no reason — the page's own light background is
  // enough separation. Hierarchy here comes from spacing and type weight,
  // not another container.
  return (
    <div className="w-full max-w-[length:var(--practice-card-max-w)] mx-auto font-practice">
      <p className="text-sm sm:text-base text-body leading-relaxed mb-5">
        Test your addition, subtraction, multiplication, and division facts in 60 seconds.
      </p>

      {/* fieldset/legend groups the four toggles under one accessible name —
          reset to plain block layout (no default fieldset border/padding, no
          default legend table-caption positioning) so nothing renders as a
          browser legend-on-a-border; visually this is just a heading above
          a grid of buttons. */}
      <fieldset className="border-0 p-0 m-0 mb-4">
        <legend className="static block w-full p-0 mb-2.5 text-sm font-semibold text-[#211D4F]">
          Choose operations:
        </legend>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ALL_OPS.map(({ op, label, symbol }) => {
            const checked = selectedOps.has(op);
            return (
              <button
                key={op}
                onClick={() => toggleOp(op)}
                aria-pressed={checked}
                className={`min-h-[48px] flex items-center justify-between gap-1.5 px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                  checked
                    ? 'border-[#4F46E5] bg-[#F5F3FF] text-[#211D4F]'
                    : 'border-[#D8D4EE] bg-white text-[#211D4F] hover:border-[#4F46E5]'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span className="text-base font-extrabold leading-none">{symbol}</span>
                  <span className="text-xs font-semibold leading-none">{label}</span>
                </span>
                {/* Non-color confirmation that this operation is selected —
                    the border/background change above remains the primary
                    signal; this is a small, subtle secondary cue so selection
                    state doesn't rely on color alone. Right-aligned via the
                    button's own flex layout, not absolute positioning, so it
                    can never overlap or crowd the label. */}
                {checked && (
                  <span
                    aria-hidden="true"
                    className="flex items-center justify-center w-3 h-3 rounded-full bg-[#4F46E5] text-white text-[7px] leading-none shrink-0"
                  >
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </fieldset>

      <button
        onClick={start}
        className="w-full py-3.5 px-6 bg-[#4F46E5] hover:bg-[#3E35C7] active:shadow-none active:translate-y-[2px] text-white font-bold rounded-xl transition-all shadow-[0_3px_0_0_#3730A3,0_4px_12px_rgba(79,70,229,0.30)] hover:shadow-[0_3px_0_0_#312E81,0_6px_16px_rgba(79,70,229,0.40)]"
      >
        Start 60-Second Drill
      </button>
    </div>
  );
}
