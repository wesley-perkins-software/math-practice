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
    'h-16 rounded-2xl text-2xl font-semibold transition-[transform,background-color,box-shadow] duration-100 ease-out active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className="w-full select-none mt-0.5 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-2">
      {ROWS.map((row) => (
        <div key={row[0]} className="grid grid-cols-3 gap-2 mb-2">
          {row.map((digit) => (
            <button
              key={digit}
              type="button"
              onMouseDown={prevent}
              onClick={() => !disabled && onDigit(digit)}
              disabled={disabled}
              className={`${keyBaseClasses} bg-white hover:bg-[#F1F5F9] active:bg-[#E2E8F0] text-[#1E293B] shadow-[0_1px_2px_rgba(15,23,42,0.08)] active:shadow-[inset_0_1px_2px_rgba(15,23,42,0.14)]`}
            >
              {digit}
            </button>
          ))}
        </div>
      ))}
      {/* Bottom row: backspace, 0, submit */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onMouseDown={prevent}
          onClick={() => !disabled && onBackspace()}
          disabled={disabled}
          aria-label="Backspace"
          className={`${keyBaseClasses} bg-white hover:bg-[#F1F5F9] active:bg-[#E2E8F0] text-[#64748B] flex items-center justify-center shadow-[0_1px_2px_rgba(15,23,42,0.08)] active:shadow-[inset_0_1px_2px_rgba(15,23,42,0.14)]`}
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
          className={`${keyBaseClasses} bg-white hover:bg-[#F1F5F9] active:bg-[#E2E8F0] text-[#1E293B] shadow-[0_1px_2px_rgba(15,23,42,0.08)] active:shadow-[inset_0_1px_2px_rgba(15,23,42,0.14)]`}
        >
          0
        </button>
        <button
          type="button"
          onMouseDown={prevent}
          onClick={() => !disabled && onSubmit()}
          disabled={disabled}
          aria-label="Submit answer"
          className={`${keyBaseClasses} bg-[#3B82F6] hover:bg-[#2563EB] active:bg-[#1D4ED8] text-white shadow-[0_3px_10px_rgba(37,99,235,0.3)] active:shadow-[0_1px_3px_rgba(29,78,216,0.32)]`}
        >
          ✓
        </button>
      </div>
    </div>
  );
}
