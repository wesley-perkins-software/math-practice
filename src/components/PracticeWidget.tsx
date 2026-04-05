import { useEffect, useRef, useState } from 'react';
import type { PracticeConfig, Problem, SessionResult, PageStats } from '@/engine/types';
import { generateProblem } from '@/engine/generator';
import { scoreAnswer } from '@/engine/scorer';
import { loadStats, saveStats, updateStatsAfterSession, resetCurrentStreak } from '@/engine/storage';
import { DEFAULT_STATS } from '@/engine/storage';

import WrittenProblemInput from './WrittenProblemInput';
import RemainderProblemInput from './RemainderProblemInput';
import FeedbackBanner from './FeedbackBanner';
import ScoreCard from './ScoreCard';

type Phase = 'idle' | 'active' | 'complete';
type FeedbackState = 'correct' | 'incorrect' | 'hidden';

interface Props {
  config: PracticeConfig;
  topContent?: React.ReactNode;
}

export default function PracticeWidget({ config, topContent }: Props) {
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
  const [resetPending, setResetPending] = useState(false);

  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs that are always current — safe to read in callbacks/effects without stale closures
  const correctRef = useRef(0);
  correctRef.current = correct;
  const phaseRef = useRef<Phase>('idle');
  phaseRef.current = phase;

  // Clear reset confirmation when difficulty changes
  useEffect(() => {
    setResetPending(false);
  }, [config.storageKey]);

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
    setProblem(generateProblem(config));
    setProblemIndex(0);
    setCorrect(0);
    setFeedbackState('hidden');
    setSessionStartTime(Date.now());
    setPhase('active');
  }

  // Save stats after session — always read fresh from storage to avoid stale-closure bug
  useEffect(() => {
    if (phase === 'complete' && result) {
      const current = loadStats(config.storageKey);
      const updated = updateStatsAfterSession(current, result, false);
      saveStats(config.storageKey, updated);
      setStats(updated);
    }
  }, [phase, result, config.storageKey]);

  function handleAnswer(answer: number, remainder?: number) {
    if (!problem || phase !== 'active') return;

    const isCorrect = scoreAnswer(problem, answer, remainder);

    // Update streak immediately per answer: +1 on correct, reset to 0 on wrong
    const currentStats = loadStats(config.storageKey);
    const newCurrentStreak = isCorrect ? currentStats.currentStreak + 1 : 0;
    const newLongestStreak = Math.max(currentStats.longestStreak, newCurrentStreak);
    const updatedStats = { ...currentStats, currentStreak: newCurrentStreak, longestStreak: newLongestStreak };
    saveStats(config.storageKey, updatedStats);
    setStats(updatedStats);

    if (isCorrect) {
      setCorrect((c) => c + 1);
      setFeedbackCorrectRemainder(undefined);
      setFeedbackState('correct');
    } else {
      setFeedbackCorrectAnswer(problem.correctAnswer);
      setFeedbackCorrectRemainder(problem.remainder);
      setFeedbackState('incorrect');
    }

    const FEEDBACK_DELAY_MS = isCorrect ? 600 : (config.incorrectFeedbackDelayMs ?? 1800);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 md:p-5 w-full max-w-lg mx-auto">
      {/* ── TOP CONTENT (e.g. difficulty tabs) ──────── */}
      {topContent && (
        <div className="mb-4 pb-4 border-b border-[#E2E8F0]">
          {topContent}
        </div>
      )}

      {/* ── ACTIVE ──────────────────────────────────── */}
      {phase === 'active' && problem && (
        <div className="flex flex-col items-center gap-4 md:gap-5">
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

          {/* Current streak */}
          <div className="flex items-center justify-between w-full pt-2 border-t border-[#E2E8F0]">
            {/* Streak label — always visible so Reset has context */}
            <span className={`text-sm font-semibold ${stats.currentStreak > 0 ? 'text-amber-600' : 'text-[#94A3B8]'}`}>
              {stats.currentStreak > 0 ? '🔥 ' : ''}Streak: {stats.currentStreak}
            </span>

            {/* Reset / inline confirm */}
            {!resetPending ? (
              <button
                onClick={() => setResetPending(true)}
                className="text-xs text-[#94A3B8] hover:text-[#64748B] transition-colors px-2 py-1 rounded hover:bg-[#F1F5F9]"
              >
                Reset
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-xs text-[#64748B] mr-1">Reset streak?</span>
                <button
                  onClick={handleResetCurrentStreak}
                  className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded transition-colors"
                >
                  Yes
                </button>
                <button
                  onClick={() => setResetPending(false)}
                  className="text-xs font-semibold text-[#64748B] bg-[#F1F5F9] hover:bg-[#E2E8F0] px-2 py-1 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── COMPLETE ────────────────────────────────── */}
      {phase === 'complete' && result && (
        <ScoreCard
          result={result}
          stats={stats}
          isTimed={false}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
