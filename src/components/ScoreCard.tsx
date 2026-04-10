import type { SessionResult, PageStats } from '@/engine/types';

interface Props {
  result: SessionResult;
  stats: PageStats;
  isTimed: boolean;
  /** lastSessionScore from before this session started, for comparison */
  preSessionScore: number;
  /** True when this session set a new all-time longest streak record */
  isNewStreakRecord: boolean;
  onRestart: () => void;
}

export default function ScoreCard({ result, stats, isTimed, preSessionScore, isNewStreakRecord, onRestart }: Props) {
  const isPersonalBest =
    isTimed &&
    stats.personalBestScore > 0 &&
    result.correct >= stats.personalBestScore;

  const accuracy = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;

  // Session-over-session accuracy comparison (untimed only, skip if first session)
  const scoreDelta = !isTimed && preSessionScore > 0 ? accuracy - preSessionScore : null;
  const showComparison = scoreDelta !== null && Math.abs(scoreDelta) >= 5;

  return (
    <div className="flex flex-col items-center gap-5 py-4 w-full">
      <div className="text-center">
        {isNewStreakRecord ? (
          <div className="text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-4 py-1.5 rounded-full mb-4 inline-block border border-amber-200 shadow-sm">
            New Streak Record!
          </div>
        ) : isPersonalBest ? (
          <div className="text-xs font-bold uppercase tracking-widest text-[#3730A3] bg-gradient-to-r from-[#EEF2FF] to-[#E0E7FF] px-4 py-1.5 rounded-full mb-4 inline-block border border-[#C7D2FE] shadow-sm">
            Personal Best!
          </div>
        ) : (
          <div className="text-xs font-bold uppercase tracking-widest text-[#334155] bg-[#F8FAFC] px-4 py-1.5 rounded-full mb-4 inline-block border border-[#E2E8F0] shadow-sm">
            Results
          </div>
        )}
        <div className="text-7xl font-bold text-[#1E1B4B] font-['JetBrains_Mono']">{result.correct}</div>
        <div className="text-sm text-[#6B7280] mt-1">
          {isTimed
            ? `correct in ${result.durationSeconds}s`
            : `correct out of ${result.total}`}
        </div>
        {!isTimed && (
          <div className="text-3xl font-bold text-[#4F46E5] mt-2 font-['JetBrains_Mono']">{accuracy}%</div>
        )}
        {showComparison && (
          <div className={`text-xs font-medium mt-1 ${scoreDelta! > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {scoreDelta! > 0 ? '▲' : '▼'} {scoreDelta! > 0 ? '+' : ''}{scoreDelta}% vs last session
          </div>
        )}
      </div>

      {!isTimed && (
        <div className="grid grid-cols-2 gap-3 w-full">
          <div className="bg-[#F5F3FF] border border-[#E0E7FF] rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-[#1E1B4B]">{stats.currentStreak}</div>
            <div className="text-xs text-[#6B7280]">Current Streak</div>
          </div>
          <div className="bg-[#F5F3FF] border border-[#E0E7FF] rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-[#1E1B4B]">{stats.longestStreak}</div>
            <div className="text-xs text-[#6B7280]">Longest Streak</div>
          </div>
        </div>
      )}

      <button
        onClick={onRestart}
        className="w-full py-3.5 px-6 bg-[#4F46E5] hover:bg-[#3730A3] text-white font-bold text-base rounded-xl transition-all shadow-[0_3px_0_0_#3730A3,0_6px_16px_rgba(79,70,229,0.30)] hover:shadow-[0_3px_0_0_#312E81,0_8px_20px_rgba(79,70,229,0.40)] active:translate-y-[2px] active:shadow-[0_1px_0_0_#3730A3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]/50 focus-visible:ring-offset-2"
      >
        Play Again
      </button>
      <a
        href="/progress"
        className="text-xs text-[#4F46E5] hover:text-[#3730A3] font-medium transition-colors text-center w-full block"
      >
        View my full progress →
      </a>
    </div>
  );
}
