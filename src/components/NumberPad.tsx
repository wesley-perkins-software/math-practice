interface Props {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  disabled?: boolean;
  /** 'prototype' opts into the redesigned surface (currently /addition/1-digit only). */
  variant?: 'classic' | 'prototype';
}

const ROWS = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
];

// Ascending (counting/number-line/phone-keypad) order — see the keypad-order
// evaluation in the design plan: calculator order (7-8-9 top) is a learned
// adult convention K-5 students don't yet carry; ascending order matches
// number lines, hundred-charts, touchscreen PIN entry, and the physical
// keyboard's own top-row digit order.
const ROWS_ASCENDING = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
];

export default function NumberPad({ onDigit, onBackspace, onSubmit, disabled = false, variant = 'classic' }: Props) {
  function prevent(e: React.MouseEvent) {
    e.preventDefault();
  }

  if (variant === 'prototype') {
    // Considered, constant size across breakpoints rather than the classic
    // variant's mobile-larger/desktop-smaller inversion: sized for comfortable
    // touch AND easy pointer use, not derived mechanically from viewport width.
    const keyBaseClasses =
      'font-practice h-14 rounded-2xl text-2xl font-bold transition-all duration-100 ease-out disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#4F46E5]';
    return (
      // Ergonomic keypad width is independent of the surface's own width —
      // capped here so a wider desktop surface gives the composition more
      // presence/whitespace without stretching buttons past a comfortable size.
      <div className="w-full max-w-[18rem] mx-auto select-none">
        {ROWS_ASCENDING.map((row) => (
          <div key={row[0]} className="grid grid-cols-3 gap-2 mb-2">
            {row.map((digit) => (
              <button
                key={digit}
                type="button"
                onMouseDown={prevent}
                onClick={() => !disabled && onDigit(digit)}
                disabled={disabled}
                className={`${keyBaseClasses} bg-white border border-[#E4E1F5] text-[#211D4F] shadow-[0_2px_0_0_#D7D3EE] hover:bg-[#F7F6FD] active:shadow-none active:translate-y-[2px]`}
              >
                {digit}
              </button>
            ))}
          </div>
        ))}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onMouseDown={prevent}
            onClick={() => !disabled && onBackspace()}
            disabled={disabled}
            aria-label="Backspace"
            className={`${keyBaseClasses} bg-[#FAF9FE] border border-[#E4E1F5] text-[#6B6690] shadow-[0_2px_0_0_#D7D3EE] hover:bg-[#F7F6FD] active:shadow-none active:translate-y-[2px] flex items-center justify-center`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" aria-hidden="true">
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
              <line x1="18" y1="9" x2="12" y2="15" />
              <line x1="12" y1="9" x2="18" y2="15" />
            </svg>
          </button>
          <button
            type="button"
            onMouseDown={prevent}
            onClick={() => !disabled && onDigit('0')}
            disabled={disabled}
            className={`${keyBaseClasses} bg-white border border-[#E4E1F5] text-[#211D4F] shadow-[0_2px_0_0_#D7D3EE] hover:bg-[#F7F6FD] active:shadow-none active:translate-y-[2px]`}
          >
            0
          </button>
          <button
            type="button"
            onMouseDown={prevent}
            onClick={() => !disabled && onSubmit()}
            disabled={disabled}
            aria-label="Submit answer"
            className={`${keyBaseClasses} bg-[#4F46E5] hover:bg-[#3E35C7] text-white shadow-[0_3px_0_0_#3730A3,0_4px_12px_rgba(79,70,229,0.30)] hover:shadow-[0_3px_0_0_#312E81,0_6px_16px_rgba(79,70,229,0.40)] active:shadow-[0_1px_0_0_#3730A3] active:translate-y-[2px]`}
          >
            ✓
          </button>
        </div>
      </div>
    );
  }

  const keyBaseClasses =
    'h-14 md:h-10 rounded-xl text-xl md:text-base font-semibold transition-all duration-100 ease-out disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]';

  return (
    <div className="w-full select-none">
      {ROWS.map((row) => (
        <div key={row[0]} className="grid grid-cols-3 gap-1.5 mb-1.5 md:mb-1">
          {row.map((digit) => (
            <button
              key={digit}
              type="button"
              onMouseDown={prevent}
              onClick={() => !disabled && onDigit(digit)}
              disabled={disabled}
              className={`${keyBaseClasses} bg-white border border-[#E0E7FF] text-[#1E1B4B] shadow-[0_2px_0_0_#C7D2FE] hover:bg-[#EEF2FF] active:shadow-none active:translate-y-[2px]`}
            >
              {digit}
            </button>
          ))}
        </div>
      ))}
      {/* Bottom row: backspace, 0, submit */}
      <div className="grid grid-cols-3 gap-1.5">
        <button
          type="button"
          onMouseDown={prevent}
          onClick={() => !disabled && onBackspace()}
          disabled={disabled}
          aria-label="Backspace"
          className={`${keyBaseClasses} bg-[#F5F3FF] border border-[#E0E7FF] text-[#6B7280] shadow-[0_2px_0_0_#C7D2FE] hover:bg-[#EEF2FF] active:shadow-none active:translate-y-[2px] flex items-center justify-center`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" aria-hidden="true">
            <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
            <line x1="18" y1="9" x2="12" y2="15" />
            <line x1="12" y1="9" x2="18" y2="15" />
          </svg>
        </button>
        <button
          type="button"
          onMouseDown={prevent}
          onClick={() => !disabled && onDigit('0')}
          disabled={disabled}
          className={`${keyBaseClasses} bg-white border border-[#E0E7FF] text-[#1E1B4B] shadow-[0_2px_0_0_#C7D2FE] hover:bg-[#EEF2FF] active:shadow-none active:translate-y-[2px]`}
        >
          0
        </button>
        <button
          type="button"
          onMouseDown={prevent}
          onClick={() => !disabled && onSubmit()}
          disabled={disabled}
          aria-label="Submit answer"
          className={`${keyBaseClasses} bg-[#4F46E5] hover:bg-[#3730A3] text-white shadow-[0_3px_0_0_#3730A3,0_4px_12px_rgba(79,70,229,0.35)] hover:shadow-[0_3px_0_0_#312E81,0_6px_16px_rgba(79,70,229,0.45)] active:shadow-[0_1px_0_0_#3730A3] active:translate-y-[2px]`}
        >
          ✓
        </button>
      </div>
    </div>
  );
}
