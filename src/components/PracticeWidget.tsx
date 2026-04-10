import { useEffect, useRef, useState } from 'react';
import type { PracticeConfig, Problem, SessionResult, PageStats } from '@/engine/types';
import type { TimerDuration } from '@/engine/types';
import { generateProblem } from '@/engine/generator';
import { scoreAnswer, buildSessionResult } from '@/engine/scorer';
import { loadStats, saveStats, updateStatsAfterSession, appendSessionLog, resetCurrentStreak, resetPersonalBestScore, DURATION_PREF_KEY } from '@/engine/storage';
import { DEFAULT_STATS } from '@/engine/storage';

import WrittenProblemInput from './WrittenProblemInput';
import RemainderProblemInput from './RemainderProblemInput';
import FeedbackBanner from './FeedbackBanner';
import ScoreCard from './ScoreCard';
import TimerDisplay from './TimerDisplay';
import DurationPicker from './DurationPicker';

type Phase = 'idle' | 'active' | 'complete';
type FeedbackState = 'correct' | 'incorrect' | 'hidden';

interface Props {
  config: PracticeConfig;
  topContent?: React.ReactNode;
}

export default function PracticeWidget({ config, topContent }: Props) {
  const isTimed = config.mode === 'timed';
  const isTimerDurationFixed = Boolean(config.fixedTimerDuration);

  // Session state
  const [phase, setPhase] = useState<Phase>('idle');
  const [problem, setProblem] = useState<Problem | null>(null);
  const [problemIndex, setProblemIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [feedbackState, setFeedbackState] = useState<FeedbackState>('hidden');
  const [feedbackCorrectAnswer, setFeedbackCorrectAnswer] = useState(0);
  const [feedbackCorrectRemainder, setFeedbackCorrectRemainder] = useState<number | undefined>(undefined);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [stats, setStats] = useState<PageStats>(DEFAULT_STATS);
  const [preSessionScore, setPreSessionScore] = useState<number>(0);
  const [isNewStreakRecord, setIsNewStreakRecord] = useState(false);
  const [resetPending, setResetPending] = useState(false);
  const [personalBestResetPending, setPersonalBestResetPending] = useState(false);

  // Timer state
  const [duration, setDuration] = useState<TimerDuration>(() => {
    if (!isTimerDurationFixed) {
      try {
        const saved = localStorage.getItem(DURATION_PREF_KEY);
        if (saved) return Number(saved) as TimerDuration;
      } catch {}
    }
    return (config.timerDuration ?? 60) as TimerDuration;
  });
  const [secondsRemaining, setSecondsRemaining] = useState<number>(duration);
  // timerStarted: false until the user submits their first answer
  const [timerStarted, setTimerStarted] = useState(false);

  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Refs that are always current — safe to read in callbacks/effects without stale closures
  const correctRef = useRef(0);
  correctRef.current = correct;
  const phaseRef = useRef<Phase>('idle');
  phaseRef.current = phase;
  const sessionStartTimeRef = useRef(0);
  sessionStartTimeRef.current = sessionStartTime;
  const totalAnsweredRef = useRef(0);
  const timerStartedRef = useRef(false);
  timerStartedRef.current = timerStarted;

  // Clear reset confirmation when difficulty changes
  useEffect(() => {
    setResetPending(false);
    setPersonalBestResetPending(false);
  }, [config.storageKey]);

  // Keep duration synchronized with fixed-duration timed pages.
  useEffect(() => {
    if (!isTimerDurationFixed) return;
    setDuration(config.timerDuration);
    setSecondsRemaining(config.timerDuration);
  }, [config.timerDuration, isTimerDurationFixed]);

  // On mount and whenever the difficulty (storageKey) changes: load new config's stats.
  // Always auto-start a session (skip idle). If active mid-session: generate a new problem.
  useEffect(() => {
    setStats(loadStats(config.storageKey));
    if (phaseRef.current === 'active') {
      setProblem(generateProblem(config));
      setFeedbackState('hidden');
    } else {
      // idle on mount, or complete when switching difficulty — auto-start immediately
      setResult(null);
      startSession();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.storageKey]);

  function startSession() {
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    totalAnsweredRef.current = 0;
    timerStartedRef.current = false;
    setTimerStarted(false);
    setSecondsRemaining(duration);
    // Capture the score from the previous session before starting a new one
    const currentStats = loadStats(config.storageKey);
    setPreSessionScore(currentStats.lastSessionScore);
    setIsNewStreakRecord(false);
    // sessionStartTime is NOT captured here — it's captured on the first answer submission
    setProblem(generateProblem(config));
    setProblemIndex(0);
    setCorrect(0);
    setFeedbackState('hidden');
    setPhase('active');
  }

  function endSession() {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    const elapsed = Math.round((Date.now() - sessionStartTimeRef.current) / 1000);
    setResult(buildSessionResult(correctRef.current, totalAnsweredRef.current, elapsed));
    setPhase('complete');
  }

  // Countdown timer — starts only after the user's first answer, only for timed configs
  useEffect(() => {
    if (phase !== 'active' || !isTimed || !timerStarted) return;
    timerIntervalRef.current = setInterval(() => {
      setSecondsRemaining((s) => {
        if (s <= 1) {
          endSession();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  // endSession reads only refs — safe to omit from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isTimed, timerStarted]);

  // Save stats after session — always read fresh from storage to avoid stale-closure bug
  useEffect(() => {
    if (phase === 'complete' && result) {
      const current = loadStats(config.storageKey);
      const prevLongestStreak = current.longestStreak;
      const updated = updateStatsAfterSession(current, result, isTimed);
      saveStats(config.storageKey, updated);
      setStats(updated);
      setIsNewStreakRecord(!isTimed && updated.longestStreak > prevLongestStreak && updated.longestStreak > 0);
      appendSessionLog({
        storageKey: config.storageKey,
        label: config.label ?? config.storageKey,
        correct: result.correct,
        total: result.total,
        score: result.score,
        durationSeconds: result.durationSeconds,
        isTimed,
        timestamp: result.timestamp,
      });
    }
  }, [phase, result, config.storageKey, config.label, isTimed]);

  function handleDurationChange(d: TimerDuration) {
    setDuration(d);
    setSecondsRemaining(d);
    try { localStorage.setItem(DURATION_PREF_KEY, String(d)); } catch {}
  }

  function handleAnswer(answer: number, remainder?: number) {
    if (!problem || phase !== 'active') return;

    // Start the timer on the first answer submission
    if (isTimed && !timerStartedRef.current) {
      timerStartedRef.current = true;
      setTimerStarted(true);
      const now = Date.now();
      setSessionStartTime(now);
      sessionStartTimeRef.current = now;
    }

    totalAnsweredRef.current += 1;
    const isCorrect = scoreAnswer(problem, answer, remainder);

    if (!isTimed) {
      // Update streak immediately per answer: +1 on correct, reset to 0 on wrong
      const currentStats = loadStats(config.storageKey);
      const newCurrentStreak = isCorrect ? currentStats.currentStreak + 1 : 0;
      const newLongestStreak = Math.max(currentStats.longestStreak, newCurrentStreak);
      const updatedStats = { ...currentStats, currentStreak: newCurrentStreak, longestStreak: newLongestStreak };
      saveStats(config.storageKey, updatedStats);
      setStats(updatedStats);
    }

    if (isCorrect) {
      setCorrect((c) => c + 1);
      setFeedbackCorrectRemainder(undefined);
      setFeedbackState('correct');
    } else {
      setFeedbackCorrectAnswer(problem.correctAnswer);
      setFeedbackCorrectRemainder(problem.remainder);
      setFeedbackState('incorrect');
    }

    const FEEDBACK_DELAY_MS = isCorrect
      ? (config.correctFeedbackDelayMs ?? 600)
      : (config.incorrectFeedbackDelayMs ?? 1800);

    // Clear any pending transition timer
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = setTimeout(() => {
      setProblemIndex((i) => i + 1);
      setProblem(generateProblem(config));
      setFeedbackState('hidden');
    }, FEEDBACK_DELAY_MS);
  }

  function handleRestart() {
    setResult(null);
    setFeedbackState('hidden');
    setStats(loadStats(config.storageKey));
    startSession();
  }

  function handleResetCurrentStreak() {
    resetCurrentStreak(config.storageKey);
    setStats(loadStats(config.storageKey));
    setResetPending(false);
  }

  function handleResetPersonalBest() {
    resetPersonalBestScore(config.storageKey);
    setStats(loadStats(config.storageKey));
    setPersonalBestResetPending(false);
    setResult(null);
    setFeedbackState('hidden');
    startSession();
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  return (
    <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(79,70,229,0.10)] ring-1 ring-[#E0E7FF] w-full max-w-lg mx-auto overflow-hidden">
      {/* ── GRADIENT ACCENT BAR ─────────────────────── */}
      <div className="h-1 w-full bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#2563EB]" />

      <div className="p-4 md:p-5">
        {/* ── TOP CONTENT (e.g. difficulty tabs) ──────── */}
        {topContent && (
          <div className="mb-4 pb-4 border-b border-[#E0E7FF]">
            {topContent}
          </div>
        )}

      {/* ── ACTIVE ──────────────────────────────────── */}
      {phase === 'active' && problem && (
        <div className="flex flex-col items-center gap-4 md:gap-5">
          {/* Timer bar — only for timed mode */}
          {isTimed && (
            <div className="w-full flex items-center justify-between border-b border-[#E0E7FF] pb-3">
              {timerStarted
                ? <TimerDisplay secondsRemaining={secondsRemaining} />
                : <TimerDisplay secondsRemaining={duration} />
              }
              {/* Duration picker only available before timer starts */}
              {!timerStarted && !isTimerDurationFixed && (
                <DurationPicker value={duration} onChange={handleDurationChange} />
              )}
            </div>
          )}

          {/* Written arithmetic block + input + number pad */}
          {config.withRemainder ? (
            <RemainderProblemInput
              problem={problem}
              onSubmit={(q, r) => handleAnswer(q, r)}
              disabled={feedbackState !== 'hidden'}
              feedbackState={feedbackState === 'hidden' ? 'idle' : feedbackState}
              feedbackContent={(
                <div className="h-8 flex items-center justify-center w-full">
                  <FeedbackBanner state={feedbackState} correctAnswer={feedbackCorrectAnswer} correctRemainder={feedbackCorrectRemainder} />
                </div>
              )}
            />
          ) : (
            <WrittenProblemInput
              problem={problem}
              onSubmit={handleAnswer}
              disabled={feedbackState !== 'hidden'}
              feedbackState={feedbackState === 'hidden' ? 'idle' : feedbackState}
              feedbackContent={(
                <div className="h-8 flex items-center justify-center w-full">
                  <FeedbackBanner state={feedbackState} correctAnswer={feedbackCorrectAnswer} />
                </div>
              )}
            />
          )}

          {!isTimed && (
            <div className="flex items-center justify-between w-full pt-2 border-t border-[#E0E7FF]">
              {/* Streak label — always visible so Reset has context */}
              <span className={`text-sm font-semibold ${stats.currentStreak > 0 ? 'text-amber-600' : 'text-[#A5B4FC]'}`}>
                {stats.currentStreak > 0 ? '🔥 ' : ''}Streak: {stats.currentStreak}
              </span>

              {/* Reset / inline confirm */}
              {!resetPending ? (
                <button
                  onClick={() => setResetPending(true)}
                  className="text-xs text-[#A5B4FC] hover:text-[#6B7280] transition-colors px-2 py-1 rounded hover:bg-[#F5F3FF]"
                >
                  Reset
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[#6B7280] mr-1">Reset streak?</span>
                  <button
                    onClick={handleResetCurrentStreak}
                    className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setResetPending(false)}
                    className="text-xs font-semibold text-[#6B7280] bg-[#F5F3FF] hover:bg-[#E0E7FF] px-2 py-1 rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {isTimed && (
            <div className="flex items-center justify-between w-full pt-2 border-t border-[#E0E7FF]">
              <span className={`text-sm font-semibold ${stats.personalBestScore > 0 ? 'text-[#4F46E5]' : 'text-[#A5B4FC]'}`}>
                Personal Best: {stats.personalBestScore > 0 ? stats.personalBestScore : '—'}
              </span>
              {!personalBestResetPending ? (
                <button
                  onClick={() => setPersonalBestResetPending(true)}
                  className="text-xs text-[#A5B4FC] hover:text-[#6B7280] transition-colors px-2 py-1 rounded hover:bg-[#F5F3FF]"
                >
                  Reset
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[#6B7280] mr-1">Reset personal best?</span>
                  <button
                    onClick={handleResetPersonalBest}
                    className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setPersonalBestResetPending(false)}
                    className="text-xs font-semibold text-[#6B7280] bg-[#F5F3FF] hover:bg-[#E0E7FF] px-2 py-1 rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── COMPLETE ────────────────────────────────── */}
      {phase === 'complete' && result && (
        <ScoreCard
          result={result}
          stats={stats}
          isTimed={isTimed}
          preSessionScore={preSessionScore}
          isNewStreakRecord={isNewStreakRecord}
          onRestart={handleRestart}
        />
      )}
      </div>
    </div>
  );
}
