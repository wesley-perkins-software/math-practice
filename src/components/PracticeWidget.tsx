import { useEffect, useMemo, useRef, useState } from 'react';
import type { PracticeConfig, Problem, SessionResult, PageStats } from '@/engine/types';
import { generateProblem } from '@/engine/generator';
import { scoreAnswer } from '@/engine/scorer';
import { loadStats, saveStats, updateStatsAfterSession, resetCurrentStreak } from '@/engine/storage';
import { DEFAULT_STATS } from '@/engine/storage';

import ProblemDisplay from './ProblemDisplay';
import AnswerInput from './AnswerInput';
import FeedbackBanner from './FeedbackBanner';
import ScoreCard from './ScoreCard';

type Phase = 'idle' | 'active' | 'complete';
type FeedbackState = 'correct' | 'incorrect' | 'hidden';

interface Props {
  config: PracticeConfig;
  topContent?: React.ReactNode;
}

export default function PracticeWidget({ config, topContent }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [problem, setProblem] = useState<Problem | null>(null);
  const [problemIndex, setProblemIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [feedbackState, setFeedbackState] = useState<FeedbackState>('hidden');
  const [feedbackCorrectAnswer, setFeedbackCorrectAnswer] = useState(0);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [stats, setStats] = useState<PageStats>(DEFAULT_STATS);
  const [answerValue, setAnswerValue] = useState('');

  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const correctRef = useRef(0);
  correctRef.current = correct;
  const phaseRef = useRef<Phase>('idle');
  phaseRef.current = phase;

  const useAlignedAnswerLayout = useMemo(() => {
    const supportsWrittenArithmetic =
      config.operation === 'addition' || config.operation === 'subtraction' || config.operation === 'division';

    const hasMultiDigitOperands = config.operandA.max >= 10 || config.operandB.max >= 10;

    return supportsWrittenArithmetic && hasMultiDigitOperands;
  }, [config.operation, config.operandA.max, config.operandB.max]);

  useEffect(() => {
    setStats(loadStats(config.storageKey));
    if (phaseRef.current === 'active') {
      setProblem(generateProblem(config));
      setFeedbackState('hidden');
      setAnswerValue('');
    } else {
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
    setAnswerValue('');
  }

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

    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = setTimeout(() => {
      setProblemIndex((i) => i + 1);
      setProblem(generateProblem(config));
      setFeedbackState('hidden');
      setAnswerValue('');
    }, FEEDBACK_DELAY_MS);
  }

  function handleRestart() {
    setResult(null);
    setFeedbackState('hidden');
    setAnswerValue('');
    setStats(loadStats(config.storageKey));
    startSession();
  }

  function handleResetCurrentStreak() {
    resetCurrentStreak(config.storageKey);
    setStats(loadStats(config.storageKey));
  }

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  const answerDigitLimit = problem
    ? Math.max(String(problem.correctAnswer).length, String(problem.operandA).length, String(problem.operandB).length)
    : 3;

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 md:p-8 w-full max-w-lg mx-auto">
      {topContent && (
        <div className="mb-4 pb-4 border-b border-[#E2E8F0]">
          {topContent}
        </div>
      )}

      {phase === 'active' && problem && (
        <div className="flex flex-col items-center gap-4 md:gap-5">
          <ProblemDisplay
            problem={problem}
            showAlignedAnswer={useAlignedAnswerLayout}
            answerValue={answerValue}
            answerMaxDigits={answerDigitLimit}
            answerFeedbackState={feedbackState === 'hidden' ? 'idle' : feedbackState}
          />

          <AnswerInput
            value={answerValue}
            onValueChange={setAnswerValue}
            onSubmit={handleAnswer}
            maxDigits={answerDigitLimit}
            layout={useAlignedAnswerLayout ? 'aligned' : 'standard'}
            disabled={feedbackState !== 'hidden'}
            feedbackState={feedbackState === 'hidden' ? 'idle' : feedbackState}
            feedbackContent={(
              <div className="h-8 flex items-center justify-center w-full">
                <FeedbackBanner state={feedbackState} correctAnswer={feedbackCorrectAnswer} />
              </div>
            )}
          />

          <div className="flex items-center justify-between w-full pt-2 border-t border-[#E2E8F0]">
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
