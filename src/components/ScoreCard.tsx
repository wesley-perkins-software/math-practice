import { useEffect, useRef } from 'react';
import type { SessionResult, PageStats } from '@/engine/types';

interface Props {
  result: SessionResult;
  stats: PageStats;
  isTimed: boolean;
  /** lastSessionScore from before this session started, for comparison */
  preSessionScore: number;
  /** personalBestScore from before this session started, for comparison when a new best is set */
  preSessionPersonalBest: number;
  /** True when this session set a new all-time longest streak record */
  isNewStreakRecord: boolean;
  onRestart: () => void;
  /** 'prototype' opts into the redesigned surface (shared with the four operation practice pages). */
  variant?: 'classic' | 'prototype';
}

export default function ScoreCard({ result, stats, isTimed, preSessionScore, preSessionPersonalBest, isNewStreakRecord, onRestart, variant = 'classic' }: Props) {
  const isPrototype = variant === 'prototype';
  const isPersonalBest =
    isTimed &&
    stats.personalBestScore > 0 &&
    result.correct >= stats.personalBestScore;

  const accuracy = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;

  // Session-over-session accuracy comparison (untimed only, skip if first session)
  const scoreDelta = !isTimed && preSessionScore > 0 ? accuracy - preSessionScore : null;
  const showComparison = scoreDelta !== null && Math.abs(scoreDelta) >= 5;

  const headingRef = useRef<HTMLDivElement>(null);

  // Move focus to the results heading so keyboard/AT users land on the outcome, not lost focus
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className={`flex flex-col items-center gap-5 py-4 w-full animate-[fadeIn_0.25s_ease-out] ${isPrototype ? 'font-practice' : ''}`}>
      <div ref={headingRef} tabIndex={-1} className="text-center outline-none">
        {isNewStreakRecord ? (
          <div className={`text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4 inline-block border shadow-sm ${isPrototype ? 'text-[#92400E] bg-[#FFFBEB] border-[#FDE68A]' : 'text-amber-700 bg-amber-50 border-amber-200'}`}>
            New Streak Record!
          </div>
        ) : isPersonalBest ? (
          <div className={`text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4 inline-block border shadow-sm ${isPrototype ? 'text-[#3730A3] bg-gradient-to-r from-[#F5F3FF] to-[#EEECFB] border-[#D7D3EE]' : 'text-[#3730A3] bg-gradient-to-r from-[#EEF2FF] to-[#E0E7FF] border-[#C7D2FE]'}`}>
            Personal Best!
          </div>
        ) : (
          <div className={`text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4 inline-block border shadow-sm ${isPrototype ? 'text-[#43405C] bg-[#FAF9FE] border-[#E4E1F5]' : 'text-[#334155] bg-[#F8FAFC] border-[#E2E8F0]'}`}>
            Results
          </div>
        )}
        <div className={`text-7xl font-bold tabular-nums ${isPrototype ? 'text-[#211D4F]' : "text-[#1E1B4B] font-['JetBrains_Mono']"}`}>{result.correct}</div>
        <div className={`text-sm mt-1 ${isPrototype ? 'text-[#6B6690]' : 'text-[#6B7280]'}`}>
          {isTimed
            ? `correct in ${result.durationSeconds} seconds`
            : `correct out of ${result.total}`}
        </div>
        {!isTimed && (
          <div className={`text-3xl font-bold mt-2 tabular-nums ${isPrototype ? 'text-[#4F46E5]' : "text-[#4F46E5] font-['JetBrains_Mono']"}`}>{accuracy}%</div>
        )}
        {showComparison && (
          <div className={`text-xs font-medium mt-1 ${scoreDelta! > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {scoreDelta! > 0 ? '▲' : '▼'} {scoreDelta! > 0 ? '+' : ''}{scoreDelta}% vs last session
          </div>
        )}
      </div>

      {/* Personal Best supporting stat. When this session IS the new best,
          repeating the just-shown headline score under a second "Personal
          Best" label added nothing (it was the same number twice) — so a
          new best instead shows what it beat, when there's a real prior
          score to show. First-ever timed session (no prior best) omits this
          block entirely rather than showing a comparison to nothing. When
          this session ISN'T a new best, the current Personal Best is the
          useful number (the target to beat next time), so that's shown as
          before. */}
      {isTimed && isPrototype && (
        isPersonalBest ? (
          preSessionPersonalBest > 0 && (
            <div className="w-full text-center">
              <span className="text-[13px] font-bold text-[#211D4F]">Previous Best</span>
              <div className="text-2xl font-extrabold tabular-nums mt-0.5 text-[#8983B8]">
                {preSessionPersonalBest}
              </div>
            </div>
          )
        ) : (
          <div className="w-full text-center">
            <span className="text-[13px] font-bold text-[#211D4F]">Personal Best</span>
            <div className={`text-2xl font-extrabold tabular-nums mt-0.5 ${stats.personalBestScore > 0 ? 'text-[#4F46E5]' : 'text-[#8983B8]'}`}>
              {stats.personalBestScore > 0 ? stats.personalBestScore : '—'}
            </div>
          </div>
        )
      )}

      {!isTimed && (
        <div className="grid grid-cols-2 gap-3 w-full">
          <div className={`rounded-xl p-3 text-center border ${isPrototype ? 'bg-[#FAF9FE] border-[#E4E1F5]' : 'bg-[#F5F3FF] border-[#E0E7FF]'}`}>
            <div className={`text-lg font-bold ${isPrototype ? 'text-[#211D4F]' : 'text-[#1E1B4B]'}`}>{stats.currentStreak}</div>
            <div className={`text-xs ${isPrototype ? 'text-[#6B6690]' : 'text-[#6B7280]'}`}>Current Streak</div>
          </div>
          <div className={`rounded-xl p-3 text-center border ${isPrototype ? 'bg-[#FAF9FE] border-[#E4E1F5]' : 'bg-[#F5F3FF] border-[#E0E7FF]'}`}>
            <div className={`text-lg font-bold ${isPrototype ? 'text-[#211D4F]' : 'text-[#1E1B4B]'}`}>{stats.longestStreak}</div>
            <div className={`text-xs ${isPrototype ? 'text-[#6B6690]' : 'text-[#6B7280]'}`}>Longest Streak</div>
          </div>
        </div>
      )}

      <button
        onClick={onRestart}
        className={`w-full py-3.5 px-6 text-white font-bold text-base rounded-xl transition-all shadow-[0_3px_0_0_#3730A3,0_6px_16px_rgba(79,70,229,0.30)] hover:shadow-[0_3px_0_0_#312E81,0_8px_20px_rgba(79,70,229,0.40)] active:translate-y-[2px] active:shadow-[0_1px_0_0_#3730A3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]/50 focus-visible:ring-offset-2 ${isPrototype ? 'bg-[#4F46E5] hover:bg-[#3E35C7]' : 'bg-[#4F46E5] hover:bg-[#3730A3]'}`}
      >
        Play Again
      </button>
      {/* Kept: /progress genuinely surfaces this drill's own history (its
          Speed Drills row under "By Practice Type" — sessions, best score,
          last practiced — plus this drill's own results in "Recent
          Sessions"), not just generic site navigation. Simplified from "View
          my full progress →" to a quieter, tertiary label now that Play
          Again is the only button-styled action on the screen. */}
      <a
        href="/progress"
        className={`text-xs font-medium transition-colors text-center w-full block ${isPrototype ? 'text-[#4F46E5] hover:text-[#3E35C7]' : 'text-[#4F46E5] hover:text-[#3730A3]'}`}
      >
        View progress
      </a>
    </div>
  );
}
