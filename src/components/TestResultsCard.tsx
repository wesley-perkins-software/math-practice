import type { MultiplicationTestResult } from '@/engine/multiplicationTest';

const OP_SYMBOL = '×';

interface Props {
  result: MultiplicationTestResult;
  onRetake: () => void;
  onPracticeMissed: () => void;
}

/** Assessment-oriented results: score/percentage/time/missed facts — deliberately no streak, PB, or historical comparison. */
export default function TestResultsCard({ result, onRetake, onPracticeMissed }: Props) {
  const { session, correctPerMinute, missed } = result;
  const elapsed = session.elapsedSeconds ?? session.durationSeconds;
  const elapsedLabel = elapsed >= 60 ? `${Math.floor(elapsed / 60)}m ${elapsed % 60}s` : `${elapsed}s`;

  return (
    <div className="flex flex-col items-center gap-5 py-4 w-full font-practice animate-[fadeIn_0.25s_ease-out]" role="status" aria-live="polite">
      <div className="text-center">
        <div className="text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4 inline-block border shadow-sm text-[#43405C] bg-[#FAF9FE] border-[#E4E1F5]">
          Test Results
        </div>
        <div className="text-7xl font-bold tabular-nums text-[#211D4F]">{session.correct}<span className="text-3xl text-[#8983B8]">/{session.total}</span></div>
        <div className="text-3xl font-bold mt-2 tabular-nums text-[#4F46E5]">{session.score}%</div>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full">
        <div className="rounded-xl p-3 text-center border bg-[#FAF9FE] border-[#E4E1F5]">
          <div className="text-lg font-bold text-[#211D4F]">{elapsedLabel}</div>
          <div className="text-xs text-[#6B6690]">Time</div>
        </div>
        <div className="rounded-xl p-3 text-center border bg-[#FAF9FE] border-[#E4E1F5]">
          <div className="text-lg font-bold text-[#211D4F]">{correctPerMinute !== undefined ? correctPerMinute : session.total - session.correct}</div>
          <div className="text-xs text-[#6B6690]">{correctPerMinute !== undefined ? 'Correct / min' : 'Missed'}</div>
        </div>
      </div>

      {missed.length > 0 && (
        <div className="w-full">
          <h2 className="text-sm font-bold text-[#211D4F] mb-2">Missed Facts</h2>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {missed.map((problem) => (
              <li key={problem.id} className="rounded-lg border border-[#E4E1F5] bg-white px-3 py-2 text-center text-sm font-semibold tabular-nums text-[#211D4F]">
                {problem.operandA} {OP_SYMBOL} {problem.operandB} = {problem.correctAnswer}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-2.5 w-full">
        {missed.length > 0 && (
          <button
            onClick={onPracticeMissed}
            className="w-full py-3.5 px-6 text-white font-bold text-base rounded-xl transition-all shadow-[0_3px_0_0_#3730A3,0_6px_16px_rgba(79,70,229,0.30)] hover:shadow-[0_3px_0_0_#312E81,0_8px_20px_rgba(79,70,229,0.40)] active:translate-y-[2px] active:shadow-[0_1px_0_0_#3730A3] bg-[#4F46E5] hover:bg-[#3E35C7]"
          >
            Practice Missed Facts
          </button>
        )}
        <button
          onClick={onRetake}
          className={`w-full py-3 px-6 font-bold text-base rounded-xl transition-all border ${
            missed.length > 0
              ? 'text-[#211D4F] bg-white border-[#D8D4EE] hover:border-[#4F46E5]'
              : 'text-white bg-[#4F46E5] hover:bg-[#3E35C7] border-transparent shadow-[0_3px_0_0_#3730A3,0_6px_16px_rgba(79,70,229,0.30)]'
          }`}
        >
          Retake Test
        </button>
      </div>
    </div>
  );
}
