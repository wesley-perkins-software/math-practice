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

  return (
    <div className="w-full select-none mt-2">
      {ROWS.map((row) => (
        <div key={row[0]} className="grid grid-cols-3 gap-2 mb-2">
          {row.map((digit) => (
            <button
              key={digit}
              type="button"
              onMouseDown={prevent}
              onClick={() => !disabled && onDigit(digit)}
              disabled={disabled}
              className="h-16 rounded-2xl bg-[#F1F5F9] hover:bg-[#E2E8F0] active:bg-[#CBD5E1] text-[#1E293B] text-2xl font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
          className="h-16 rounded-2xl bg-[#F1F5F9] hover:bg-[#E2E8F0] active:bg-[#CBD5E1] text-[#64748B] text-2xl font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ⌫
        </button>
        <button
          type="button"
          onMouseDown={prevent}
          onClick={() => !disabled && onDigit('0')}
          disabled={disabled}
          className="h-16 rounded-2xl bg-[#F1F5F9] hover:bg-[#E2E8F0] active:bg-[#CBD5E1] text-[#1E293B] text-2xl font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          0
        </button>
        <button
          type="button"
          onMouseDown={prevent}
          onClick={() => !disabled && onSubmit()}
          disabled={disabled}
          aria-label="Submit answer"
          className="h-16 rounded-2xl bg-[#3B82F6] hover:bg-[#2563EB] active:bg-[#1D4ED8] text-white text-2xl font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ✓
        </button>
      </div>
    </div>
  );
}
