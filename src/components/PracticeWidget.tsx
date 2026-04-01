import { useEffect, useRef, useState } from 'react';
import type { PracticeConfig, Problem, SessionResult, PageStats } from '@/engine/types';
import { generateProblem } from '@/engine/generator';
import { scoreAnswer } from '@/engine/scorer';
import { loadStats, saveStats, updateStatsAfterSession, resetCurrentStreak } from '@/engine/storage';
import { DEFAULT_STATS } from '@/engine/storage';

import WrittenProblemInput from './WrittenProblemInput';
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
  const [result, setResult] = useState<SessionResult | null>(null);
  const [stats, setStats] = useState<PageStats>(DEFAULT_STATS);
  const [isResetArmed, setIsResetArmed] = useState(false);

  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetArmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs that are always current — safe to read in callbacks/effects without stale closures
  const correctRef = useRef(0);
  correctRef.current = correct;
  const phaseRef = useRef<Phase>('idle');
  phaseRef.current = phase;

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

    const FEEDBACK_DELAY_MS = isCorrect ? 600 : 1800;

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
    if (!isResetArmed) {
      setIsResetArmed(true);
      if (resetArmTimerRef.current) clearTimeout(resetArmTimerRef.current);
      resetArmTimerRef.current = setTimeout(() => setIsResetArmed(false), 2200);
      return;
    }

    resetCurrentStreak(config.storageKey);
    setStats(loadStats(config.storageKey));
    setIsResetArmed(false);
    if (resetArmTimerRef.current) clearTimeout(resetArmTimerRef.current);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      if (resetArmTimerRef.current) clearTimeout(resetArmTimerRef.current);
    };
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 md:p-8 w-full max-w-lg mx-auto border border-[#E2E8F0]">
      {/* ── TOP CONTENT (e.g. difficulty tabs) ──────── */}
      {topContent && (
        <div className="mb-5 pb-4 border-b border-[#E2E8F0]">
          {topContent}
        </div>
      )}

      {/* ── ACTIVE ──────────────────────────────────── */}
      {phase === 'active' && problem && (
        <div className="flex flex-col items-center gap-4 md:gap-5">
          {/* Written arithmetic block + input + number pad */}
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

          {/* Current streak */}
          <div className="w-full flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2">
            <span className="text-sm text-[#64748B]">
              🔥 Streak <span className="font-semibold text-base text-[#0F172A] tabular-nums align-middle">{stats.currentStreak}</span>
            </span>
            <button
              onClick={handleResetCurrentStreak}
              className={`text-xs font-medium rounded-md px-2 py-1 transition-colors ${
                isResetArmed
                  ? 'text-[#B91C1C] bg-[#FEE2E2] hover:bg-[#FECACA]'
                  : 'text-[#64748B] hover:text-[#475569] hover:bg-[#EEF2F7]'
              }`}
              aria-label={isResetArmed ? 'Tap again to reset streak' : 'Reset streak'}
            >
              {isResetArmed ? 'Tap again' : 'Reset'}
            </button>
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
