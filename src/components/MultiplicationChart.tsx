import { useRef, useState } from 'react';
import { CHART_MAX, CHART_MIN, getProduct, moveSelection, type ChartArrowKey, type ChartCell } from '@/engine/multiplicationChart';

const NUMBERS = Array.from({ length: CHART_MAX - CHART_MIN + 1 }, (_, i) => CHART_MIN + i);
const ARROW_KEYS: ChartArrowKey[] = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

type Selection = { row: number; col: number | null } | { row: number | null; col: number } | null;

function isArrowKey(key: string): key is ChartArrowKey {
  return (ARROW_KEYS as string[]).includes(key);
}

export default function MultiplicationChart() {
  // `active` is the single roving-tabindex position (always a concrete cell,
  // never null) so Tab always has exactly one place to land in the matrix.
  const [active, setActive] = useState<ChartCell>({ row: CHART_MIN, col: CHART_MIN });
  // `selection` is the persistent highlight, shown after a click/tap/focus and
  // cleared by Escape or the Clear button. It starts unset so nothing is
  // highlighted before the user interacts with the chart.
  const [selection, setSelection] = useState<Selection>(null);
  // `hovered` is a transient, mouse-only preview layered on top of `selection`.
  const [hovered, setHovered] = useState<ChartCell | null>(null);
  const [blank, setBlank] = useState(false);

  const cellRefs = useRef(new Map<string, HTMLTableCellElement>());

  const effective = hovered ?? selection;

  function focusCell(cell: ChartCell) {
    cellRefs.current.get(`${cell.row}-${cell.col}`)?.focus();
  }

  function selectDataCell(cell: ChartCell) {
    setActive(cell);
    setSelection(cell);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTableCellElement>) {
    if (isArrowKey(event.key)) {
      event.preventDefault();
      const next = moveSelection(active, event.key);
      setActive(next);
      setSelection(next);
      focusCell(next);
      return;
    }
    if (event.key === 'Escape') {
      setSelection(null);
    }
  }

  return (
    <div>
      <div className="hidden print:block mb-3">
        <p className="text-lg font-bold text-black">{blank ? 'Blank Multiplication Chart 1–12' : 'Multiplication Chart 1–12'}</p>
        <p className="text-xs text-black">mathpracticeonline.com</p>
      </div>

      <div className="no-print flex flex-wrap items-center justify-between gap-3 mb-4">
        <div role="group" aria-label="Chart display mode" className="inline-flex rounded-xl border border-[#E0E7FF] bg-white p-1">
          <button
            type="button"
            aria-pressed={!blank}
            onClick={() => setBlank(false)}
            className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] ${!blank ? 'bg-[#4F46E5] text-white' : 'text-[#4338CA] hover:bg-[#EEF2FF]'}`}
          >
            Filled Chart
          </button>
          <button
            type="button"
            aria-pressed={blank}
            onClick={() => setBlank(true)}
            className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] ${blank ? 'bg-[#4F46E5] text-white' : 'text-[#4338CA] hover:bg-[#EEF2FF]'}`}
          >
            Blank Chart
          </button>
        </div>
        {selection && (
          <button
            type="button"
            onClick={() => setSelection(null)}
            className="text-sm font-medium text-[#6366F1] hover:text-[#4338CA] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] rounded"
          >
            Clear highlight
          </button>
        )}
      </div>

      <p className="no-print sm:hidden text-xs text-[#6B7280] mb-2">Scroll sideways to see the full chart →</p>

      <div className="multiplication-chart-scroll overflow-x-auto rounded-2xl border border-[#E0E7FF]">
        <table className="border-separate border-spacing-0 w-full text-center">
          <caption className="sr-only">Multiplication chart from 1 to 12. Select a row, column, or cell to highlight matching facts.</caption>
          <thead>
            <tr>
              <th
                scope="col"
                aria-hidden="true"
                className="sticky top-0 left-0 z-20 print:static bg-[#EEF2FF] print:!bg-white border-b border-r border-[#E0E7FF] w-11 h-11 min-w-11"
              />
              {NUMBERS.map((col) => {
                const isColHighlighted = effective != null && effective.col === col;
                return (
                  <th
                    key={col}
                    scope="col"
                    onClick={() => setSelection({ row: null, col })}
                    className={`sticky top-0 z-10 print:static border-b border-[#E0E7FF] w-11 h-11 min-w-11 text-sm font-bold cursor-pointer transition-colors print:!bg-white print:!text-black ${isColHighlighted ? 'bg-[#4F46E5] text-white' : 'bg-[#EEF2FF] text-[#1E1B4B] hover:bg-[#C7D2FE]'}`}
                  >
                    {col}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {NUMBERS.map((row) => {
              const isRowHighlighted = effective != null && effective.row === row;
              return (
                <tr key={row}>
                  <th
                    scope="row"
                    onClick={() => setSelection({ row, col: null })}
                    className={`sticky left-0 z-10 print:static border-r border-[#E0E7FF] w-11 h-11 min-w-11 text-sm font-bold cursor-pointer transition-colors print:!bg-white print:!text-black ${isRowHighlighted ? 'bg-[#4F46E5] text-white' : 'bg-[#EEF2FF] text-[#1E1B4B] hover:bg-[#C7D2FE]'}`}
                  >
                    {row}
                  </th>
                  {NUMBERS.map((col) => {
                    const product = getProduct(row, col);
                    const isIntersection = effective != null && effective.row === row && effective.col === col;
                    const isBanded = !isIntersection && effective != null && (effective.row === row || effective.col === col);
                    const isActive = active.row === row && active.col === col;
                    const label = blank ? `Row ${row}, column ${col}: blank` : `${row} times ${col} equals ${product}`;

                    return (
                      <td
                        key={col}
                        ref={(el) => {
                          if (el) cellRefs.current.set(`${row}-${col}`, el);
                          else cellRefs.current.delete(`${row}-${col}`);
                        }}
                        tabIndex={isActive ? 0 : -1}
                        aria-label={label}
                        onFocus={() => selectDataCell({ row, col })}
                        onClick={() => selectDataCell({ row, col })}
                        onMouseEnter={() => setHovered({ row, col })}
                        onMouseLeave={() => setHovered(null)}
                        onKeyDown={handleKeyDown}
                        className={`border-b border-r border-[#E0E7FF] w-11 h-11 min-w-11 text-sm tabular-nums cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#4F46E5] print:!bg-white print:!text-black ${
                          isIntersection
                            ? 'bg-[#4F46E5] text-white font-bold'
                            : isBanded
                              ? 'bg-[#E0E7FF] text-[#1E1B4B] font-semibold'
                              : 'bg-white text-[#1E293B] hover:bg-[#F5F3FF]'
                        }`}
                      >
                        {blank ? '' : product}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
