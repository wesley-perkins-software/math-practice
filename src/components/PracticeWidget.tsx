import { useCallback, useEffect, useRef, useState } from 'react';
import type { PracticeConfig, PracticeMode, TimerDuration, Problem, SessionResult, PageStats } from '@/engine/types';
import { generateProblem } from '@/engine/generator';
import { scoreAnswer, buildSessionResult } from '@/engine/scorer';
import { loadStats, saveStats, updateStatsAfterSession, resetCurrentStreak, MODE_PREF_KEY, DURATION_PREF_KEY } from '@/engine/storage';
import { DEFAULT_STATS } from '@/engine/storage';

import ProblemDisplay from './ProblemDisplay';
import AnswerInput from './AnswerInput';
import FeedbackBanner from './FeedbackBanner';
import ProgressBar from './ProgressBar';
import TimerDisplay from './TimerDisplay';
import ModeToggle from './ModeToggle';
import DurationPicker from './DurationPicker';
import ScoreCard from './ScoreCard';

type Phase = 'idle' | 'active' | 'complete';
type FeedbackState = 'correct' | 'incorrect' | 'hidden';

interface Props {
  config: PracticeConfig;
  topContent?: React.ReactNode;
}

function loadPref<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function savePref(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

export default function PracticeWidget({ config, topContent }: Props) {
  // User preferences (persisted globally)
  const [mode, setMode] = useState<PracticeMode>(config.mode);
  const [duration, setDuration] = useState<TimerDuration>(config.timerDuration);

  // Session state
  const [phase, setPhase] = useState<Phase>('idle');
  const [problem, setProblem] = useState<Problem | null>(null);
  const [problemIndex, setProblemIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(60);
  const [feedbackState, setFeedbackState] = useState<FeedbackState>('hidden');
  const [feedbackCorrectAnswer, setFeedbackCorrectAnswer] = useState(0);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [stats, setStats] = useState<PageStats>(DEFAULT_STATS);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs that are always current — safe to read in callbacks/effects without stale closures
  const correctRef = useRef(0);
  correctRef.current = correct;
  const phaseRef = useRef<Phase>('idle');
  phaseRef.current = phase;

  // On mount and whenever the difficulty (storageKey) changes: load new config's stats.
  // Always auto-start a session (skip idle). If active mid-session: generate a new problem.
  useEffect(() => {
    const savedMode = loadPref<PracticeMode>(MODE_PREF_KEY, config.mode);
    const savedDuration = loadPref<TimerDuration>(DURATION_PREF_KEY, config.timerDuration);
    setMode(savedMode);
    setDuration(savedDuration);
    setStats(loadStats(config.storageKey));
    if (phaseRef.current === 'active') {
      setProblem(generateProblem(config));
      setFeedbackState('hidden');
    } else {
      // idle on mount, or complete when switching difficulty — auto-start immediately
      setResult(null);
      startSession(savedMode, savedDuration);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.storageKey]);

  function handleModeChange(m: PracticeMode) {
    setMode(m);
    savePref(MODE_PREF_KEY, m);
  }

  function handleDurationChange(d: TimerDuration) {
    setDuration(d);
    savePref(DURATION_PREF_KEY, d);
  }

  function startSession(forcedMode?: PracticeMode, forcedDuration?: TimerDuration) {
    const m = forcedMode ?? mode;
    const d = forcedDuration ?? duration;
    setProblem(generateProblem(config));
    setProblemIndex(0);
    setCorrect(0);
    setFeedbackState('hidden');
    setSessionStartTime(Date.now());
    setSecondsRemaining(d);
    setPhase('active');

    if (m === 'timed') {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((s) => {
          if (s <= 1) {
            clearInterval(timerRef.current!);
            timerRef.current = null;
            finishSession();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
  }

  // Finish is wrapped in useCallback so the timer closure can reference it.
  // Uses correctRef so the correct count is never stale — avoids setState-in-setState.
  const finishSession = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const elapsed = Math.round((Date.now() - sessionStartTime) / 1000);
    setResult(buildSessionResult(correctRef.current, problemIndex + 1, elapsed));
    setPhase('complete');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStartTime, problemIndex]);

  // Save stats after session — always read fresh from storage to avoid stale-closure bug
  useEffect(() => {
    if (phase === 'complete' && result) {
      const current = loadStats(config.storageKey);
      const updated = updateStatsAfterSession(current, result, mode === 'timed');
      saveStats(config.storageKey, updated);
      setStats(updated);
    }
  }, [phase, result, config.storageKey, mode]);

  function handleAnswer(answer: number) {
    if (!problem || phase !== 'active') return;

    const isCorrect = scoreAnswer(problem, answer);

    // Update streak immediately per answer: +1 on correct, reset to 0 on wrong
    const currentStats = loadStats(config.storageKey);
    const newCurrentStreak = isCorrect ? currentStats.currentStreak + 1 : 0;
    const newLongestStreak = Math.max(currentStats.longestStreak, newCurrentStreak);
    const updatedStats = { ...currentStats, currentStreak: newCurrentStreak, longestStreak: newLongestStreak };
    saveStats(config.storageKey, updatedStats);
    setStats(updatedStats);

    if (isCorrect) {
      setCorrect((c) => c + 1);
      setFeedbackState('correct');
    } else {
      setFeedbackCorrectAnswer(problem.correctAnswer);
      setFeedbackState('incorrect');
    }

    // Clear any pending feedback timer
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      setFeedbackState('hidden');
    }, 700);

    const nextIndex = problemIndex + 1;

    setProblemIndex(nextIndex);
    setProblem(generateProblem(config));
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
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 md:p-8 w-full max-w-lg mx-auto">
      {/* ── TOP CONTENT (e.g. difficulty tabs) ──────── */}
      {topContent && (
        <div className="mb-5 pb-5 border-b border-[#E2E8F0]">
          {topContent}
        </div>
      )}

      {/* ── ACTIVE ──────────────────────────────────── */}
      {phase === 'active' && problem && (
        <div className="flex flex-col items-center gap-6">
          {/* Top bar: timer (timed mode only) */}
          {mode === 'timed' && (
            <div className="flex items-center justify-end w-full">
              <TimerDisplay secondsRemaining={secondsRemaining} />
            </div>
          )}

          {/* Progress bar — timed mode only */}
          {mode === 'timed' && (
            <div className="w-full">
              <ProgressBar
                value={secondsRemaining / duration}
                color={secondsRemaining <= 10 ? '#F97316' : '#3B82F6'}
              />
            </div>
          )}

          {/* Problem */}
          <ProblemDisplay problem={problem} />

          {/* Input + NumberPad */}
          <AnswerInput
            onSubmit={handleAnswer}
            feedbackState={feedbackState === 'hidden' ? 'idle' : feedbackState}
            feedbackContent={(
              <div className="h-8 flex items-center justify-center w-full">
                <FeedbackBanner state={feedbackState} correctAnswer={feedbackCorrectAnswer} />
              </div>
            )}
          />

          {/* Current streak */}
          <div className="flex items-center justify-between w-full pt-3 border-t border-[#E2E8F0]">
            <span className="text-sm text-[#64748B]">
              🔥 Streak: <span className="font-bold text-[#1E293B]">{stats.currentStreak}</span>
            </span>
            <button
              onClick={handleResetCurrentStreak}
              className="text-xs text-[#3B82F6] hover:underline"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* ── COMPLETE ────────────────────────────────── */}
      {phase === 'complete' && result && (
        <ScoreCard
          result={result}
          stats={stats}
          isTimed={mode === 'timed'}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
