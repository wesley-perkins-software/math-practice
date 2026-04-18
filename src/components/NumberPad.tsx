interface Props {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  disabled?: boolean;
}

const ROWS = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
];

export default function NumberPad({ onDigit, onBackspace, onSubmit, disabled = false }: Props) {
  function prevent(e: React.MouseEvent) {
    e.preventDefault();
  }

  const keyBaseClasses =
    'h-[4.25rem] md:h-12 rounded-xl text-2xl md:text-lg font-semibold transition-all duration-100 ease-out disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]';

  return (
    <div className="w-full select-none mt-1">
      {ROWS.map((row) => (
        <div key={row[0]} className="grid grid-cols-3 gap-2 md:gap-1.5 mb-1.5 md:mb-1">
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
      <div className="grid grid-cols-3 gap-2 md:gap-1.5">
        <button
          type="button"
          onMouseDown={prevent}
          onClick={() => !disabled && onBackspace()}
          disabled={disabled}
          aria-label="Backspace"
          className={`${keyBaseClasses} bg-[#F5F3FF] border border-[#E0E7FF] text-[#6B7280] shadow-[0_2px_0_0_#C7D2FE] hover:bg-[#EEF2FF] active:shadow-none active:translate-y-[2px] flex items-center justify-center`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7" aria-hidden="true">
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
