import type { SessionResult, PageStats } from '@/engine/types';

interface Props {
  result: SessionResult;
  stats: PageStats;
  isTimed: boolean;
  onRestart: () => void;
}

export default function ScoreCard({ result, stats, isTimed, onRestart }: Props) {
  const isPerfect = result.correct === result.total && result.total > 0;
  const isPersonalBest =
    isTimed &&
    stats.bestTimedScore > 0 &&
    Math.round((result.correct / result.durationSeconds) * 60) >= stats.bestTimedScore;

  const accuracy = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-5 py-4 w-full">
      <div className="text-center">
        {isPerfect && (
          <div className="text-xs font-bold uppercase tracking-widest text-[#15803D] bg-[#DCFCE7] px-3 py-1 rounded-full mb-3 inline-block">
            Perfect!
          </div>
        )}
        {isPersonalBest && !isPerfect && (
          <div className="text-xs font-bold uppercase tracking-widest text-[#1D4ED8] bg-[#DBEAFE] px-3 py-1 rounded-full mb-3 inline-block">
            Personal Best!
          </div>
        )}
        <div className="text-6xl font-bold text-[#1E293B]">{result.correct}</div>
        <div className="text-sm text-[#64748B] mt-1">
          {isTimed
            ? `correct in ${result.durationSeconds}s`
            : `correct out of ${result.total}`}
        </div>
        {!isTimed && (
          <div className="text-2xl font-bold text-[#3B82F6] mt-2">{accuracy}%</div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 w-full">
        <div className="bg-[#F8F9FB] rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-[#1E293B]">{stats.currentStreak}</div>
          <div className="text-xs text-[#64748B]">Current Streak</div>
        </div>
        <div className="bg-[#F8F9FB] rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-[#1E293B]">{stats.longestStreak}</div>
          <div className="text-xs text-[#64748B]">Best Streak</div>
        </div>
      </div>

      <button
        onClick={onRestart}
        className="w-full py-3 px-6 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold text-base rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50 focus:ring-offset-2"
        autoFocus
      >
        Play Again
      </button>
    </div>
  );
}
