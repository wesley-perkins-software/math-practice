import { useCallback, useEffect, useRef, useState } from 'react';
import type { PracticeConfig, PracticeMode, TimerDuration, Problem, SessionResult, PageStats } from '@/engine/types';
import { generateProblem } from '@/engine/generator';
import { scoreAnswer, buildSessionResult } from '@/engine/scorer';
import { loadStats, saveStats, updateStatsAfterSession, MODE_PREF_KEY, DURATION_PREF_KEY } from '@/engine/storage';
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

export default function PracticeWidget({ config }: Props) {
  const problemCount = config.problemCount ?? 20;

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
  const [result, setResult] = useState<SessionResult | null>(null);
  const [stats, setStats] = useState<PageStats>(DEFAULT_STATS);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load prefs + stats on mount (client-only)
  useEffect(() => {
    setMode(loadPref<PracticeMode>(MODE_PREF_KEY, config.mode));
    setDuration(loadPref<TimerDuration>(DURATION_PREF_KEY, config.timerDuration));
    setStats(loadStats(config.storageKey));
  }, [config.storageKey, config.mode, config.timerDuration]);

  function handleModeChange(m: PracticeMode) {
    setMode(m);
    savePref(MODE_PREF_KEY, m);
  }

  function handleDurationChange(d: TimerDuration) {
    setDuration(d);
    savePref(DURATION_PREF_KEY, d);
  }

  function startSession() {
    setProblem(generateProblem(config));
    setProblemIndex(0);
    setCorrect(0);
    setFeedbackState('hidden');
    setSessionStartTime(Date.now());
    setSecondsRemaining(duration);
    setPhase('active');

    if (mode === 'timed') {
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

  // Finish is wrapped in useCallback so the timer closure can reference it
  const finishSession = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const elapsed = Math.round((Date.now() - sessionStartTime) / 1000);
    // Access correct count via ref to avoid stale closure
    setCorrect((c) => {
      setResult(buildSessionResult(c, problemIndex + 1, elapsed));
      return c;
    });
    setPhase('complete');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStartTime, problemIndex]);

  // Save stats and sync state after result is set
  useEffect(() => {
    if (phase === 'complete' && result) {
      const updated = updateStatsAfterSession(stats, result, mode === 'timed');
      saveStats(config.storageKey, updated);
      setStats(updated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, result]);

  function handleAnswer(answer: number) {
    if (!problem || phase !== 'active') return;

    const isCorrect = scoreAnswer(problem, answer);

    if (isCorrect) {
      setCorrect((c) => c + 1);
      setFeedbackState('correct');
    } else {
      setFeedbackState('incorrect');
    }

    // Clear any pending feedback timer
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      setFeedbackState('hidden');
    }, 700);

    const nextIndex = problemIndex + 1;

    if (mode === 'untimed' && nextIndex >= problemCount) {
      // End of untimed session
      setTimeout(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        const elapsed = Math.round((Date.now() - sessionStartTime) / 1000);
        setCorrect((c) => {
          const finalCorrect = isCorrect ? c : c; // c already updated above via setState
          setResult(buildSessionResult(finalCorrect, nextIndex, elapsed));
          return finalCorrect;
        });
        setPhase('complete');
      }, 300);
      return;
    }

    setProblemIndex(nextIndex);
    setProblem(generateProblem(config));
  }

  function handleRestart() {
    setPhase('idle');
    setResult(null);
    setFeedbackState('hidden');
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
      {/* ── IDLE ────────────────────────────────────── */}
      {phase === 'idle' && (
        <div className="flex flex-col gap-5">
          <ModeToggle mode={mode} onChange={handleModeChange} />
          {mode === 'timed' && (
            <DurationPicker value={duration} onChange={handleDurationChange} />
          )}
          {mode === 'untimed' && (
            <p className="text-sm text-[#64748B] text-center">
              {problemCount} problems — answer at your own pace.
            </p>
          )}
          <button
            onClick={startSession}
            className="w-full py-4 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-lg rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50 focus:ring-offset-2"
            autoFocus
          >
            Start Practice
          </button>

          {/* Stats preview */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E2E8F0]">
            <div className="text-center">
              <div className="text-base font-bold text-[#1E293B]">{stats.currentStreak}</div>
              <div className="text-xs text-[#94A3B8]">Streak</div>
            </div>
            <div className="text-center">
              <div className="text-base font-bold text-[#1E293B]">{stats.longestStreak}</div>
              <div className="text-xs text-[#94A3B8]">Best Streak</div>
            </div>
            <div className="text-center">
              <div className="text-base font-bold text-[#1E293B]">
                {stats.bestTimedScore > 0 ? `${stats.bestTimedScore}` : '—'}
              </div>
              <div className="text-xs text-[#94A3B8]">Best/min</div>
            </div>
          </div>
        </div>
      )}

      {/* ── ACTIVE ──────────────────────────────────── */}
      {phase === 'active' && problem && (
        <div className="flex flex-col items-center gap-6">
          {/* Top bar: timer or problem count */}
          <div className="flex items-center justify-between w-full">
            <span className="text-sm text-[#64748B]">
              {mode === 'untimed'
                ? `${problemIndex + 1} / ${problemCount}`
                : `${correct} correct`}
            </span>
            {mode === 'timed' ? (
              <TimerDisplay secondsRemaining={secondsRemaining} />
            ) : (
              <span className="text-sm text-[#64748B]">
                {correct} correct
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full">
            <ProgressBar
              value={
                mode === 'timed'
                  ? secondsRemaining / duration
                  : (problemIndex) / problemCount
              }
              color={
                mode === 'timed' && secondsRemaining <= 10 ? '#F97316' : '#3B82F6'
              }
            />
          </div>

          {/* Problem */}
          <ProblemDisplay problem={problem} />

          {/* Feedback */}
          <div className="h-6 flex items-center">
            <FeedbackBanner state={feedbackState} correctAnswer={problem.correctAnswer} />
          </div>

          {/* Input */}
          <AnswerInput
            onSubmit={handleAnswer}
            feedbackState={feedbackState === 'hidden' ? 'idle' : feedbackState}
          />
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
