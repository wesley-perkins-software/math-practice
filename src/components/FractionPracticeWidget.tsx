import { useEffect, useRef, useState } from 'react';
import type { QuestionCount, PageStats, SessionResult } from '@/engine/types';
import type { FractionProblem, FractionSkillId, Fraction } from '@/engine/fractions/types';
import { generateFractionProblemSet } from '@/engine/fractions/generator';
import { validateFractionAnswer } from '@/engine/fractions/validation';
import { buildSessionResult } from '@/engine/scorer';
import { loadStats, saveStats, updateStatsAfterUntimedAnswer, appendSessionLog } from '@/engine/storage';
import { recordCompletedQuestion, finishAnswerFeedback, startPracticeSession, type PracticeSessionState } from '@/engine/session';
import FractionInput from './FractionInput';
import FractionBar from './FractionBar';
import ScoreCard from './ScoreCard';

type Phase = 'active' | 'complete';
type FeedbackState = 'correct' | 'incorrect' | 'hidden';

interface Props {
  skill: FractionSkillId;
  storageKey: string;
  label: string;
  questionCount?: QuestionCount;
}

function promptDescription(problem: FractionProblem): string {
  if (problem.skill === 'equivalent-fractions' && problem.policy.kind === 'FIXED_DENOMINATOR_REQUIRED') {
    return `What fraction with denominator ${problem.policy.targetDenominator} is equivalent to ${problem.prompt.numerator}/${problem.prompt.denominator}? Enter numerator and denominator.`;
  }
  return `Simplify ${problem.prompt.numerator}/${problem.prompt.denominator} to lowest terms. Enter numerator and denominator.`;
}

/**
 * A separate runner rather than an extension of `PracticeWidget`:
 * `PracticeWidget`'s answer/scoring pipeline (`handleAnswer(answer: number,
 * remainder?: number)` -> `scoreAnswer`) is hard-typed to scalar numeric
 * answers and has no render seam for a fraction bar or two-field fraction
 * input. This widget reuses the parts of the runtime that are already
 * answer-shape-agnostic instead: `session.ts`'s accept/feedback/completion
 * state machine, `storage.ts`'s PageStats/session-log persistence
 * (unchanged shape, a purely additive new storageKey), and `ScoreCard`.
 * Arithmetic practice (`PracticeWidget` itself) is untouched.
 */
export default function FractionPracticeWidget({ skill, storageKey, label, questionCount = 10 }: Props) {
  // Generation uses unseeded Math.random(), which would differ between the
  // server-rendered HTML and the client's own render — the same hydration
  // hazard DailyReviewWidget documents for its date-based generation.
  // Problems are generated only after mount (client-only), and nothing is
  // rendered until then, avoiding a React hydration mismatch.
  const [problems, setProblems] = useState<FractionProblem[] | null>(null);
  const [phase, setPhase] = useState<Phase>('active');
  const [problemIndex, setProblemIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedbackState, setFeedbackState] = useState<FeedbackState>('hidden');
  const [feedbackCorrectAnswer, setFeedbackCorrectAnswer] = useState<Fraction | null>(null);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [stats, setStats] = useState<PageStats>(() => loadStats(storageKey));
  const [preSessionScore, setPreSessionScore] = useState<number>(() => loadStats(storageKey).lastSessionScore);

  const sessionBoundaryRef = useRef<PracticeSessionState>(startPracticeSession());
  const sessionStartTimeRef = useRef<number>(Date.now());
  const totalAnsweredRef = useRef(0);
  const correctRef = useRef(0);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setProblems(generateFractionProblemSet(skill, questionCount));
    setStats(loadStats(storageKey));
    setPreSessionScore(loadStats(storageKey).lastSessionScore);
    sessionStartTimeRef.current = Date.now();
    // Runs once per mount; a skill/storageKey change remounts via the caller's own key, not here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleAnswer(answer: { numerator: number; denominator: number }) {
    if (phase !== 'active' || !problems) return;
    const problem = problems[Math.min(problemIndex, problems.length - 1)]!;

    const submission = recordCompletedQuestion(sessionBoundaryRef.current, questionCount);
    sessionBoundaryRef.current = submission.state;
    if (!submission.accepted) return;

    totalAnsweredRef.current = submission.state.completedQuestions;
    const isCorrect = validateFractionAnswer(problem.policy, answer, problem.correctAnswer);

    const currentStats = loadStats(storageKey);
    const updatedStats = updateStatsAfterUntimedAnswer(currentStats, isCorrect, true);
    saveStats(storageKey, updatedStats);
    setStats(updatedStats);

    if (isCorrect) {
      correctRef.current += 1;
      setCorrect((c) => c + 1);
      setFeedbackState('correct');
    } else {
      setFeedbackCorrectAnswer(problem.correctAnswer);
      setFeedbackState('incorrect');
    }

    const FEEDBACK_DELAY_MS = isCorrect ? 600 : 1800;
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = setTimeout(() => {
      const transition = finishAnswerFeedback(sessionBoundaryRef.current);
      sessionBoundaryRef.current = transition.state;
      if (transition.shouldComplete) {
        const sessionResult = buildSessionResult(
          correctRef.current,
          totalAnsweredRef.current,
          Math.round((Date.now() - sessionStartTimeRef.current) / 1000),
          { completionReason: 'question-limit', questionTarget: questionCount },
        );
        setResult(sessionResult);
        const current = loadStats(storageKey);
        saveStats(storageKey, {
          ...current,
          lastSessionScore: sessionResult.score,
          lastSessionDate: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })(),
          totalSessions: current.totalSessions + 1,
        });
        appendSessionLog({
          storageKey,
          label,
          correct: sessionResult.correct,
          total: sessionResult.total,
          score: sessionResult.score,
          durationSeconds: sessionResult.durationSeconds,
          completionReason: 'question-limit',
          questionTarget: questionCount,
          isTimed: false,
          timestamp: sessionResult.timestamp,
        });
        setPhase('complete');
      } else if (transition.shouldGenerateNext) {
        setProblemIndex((i) => i + 1);
        setFeedbackState('hidden');
      }
    }, FEEDBACK_DELAY_MS);
  }

  function handleRestart() {
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    sessionBoundaryRef.current = startPracticeSession();
    sessionStartTimeRef.current = Date.now();
    totalAnsweredRef.current = 0;
    correctRef.current = 0;
    setStats(loadStats(storageKey));
    setPreSessionScore(loadStats(storageKey).lastSessionScore);
    setProblems(generateFractionProblemSet(skill, questionCount));
    setResult(null);
    setCorrect(0);
    setProblemIndex(0);
    setFeedbackState('hidden');
    setPhase('active');
  }

  if (!problems) return null; // avoids a hydration mismatch between server render and the client's own unseeded generation

  const problem = problems[Math.min(problemIndex, problems.length - 1)]!;
  const barDenominator = Math.max(2, Math.min(12, problem.prompt.denominator));

  return (
    <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(79,70,229,0.10)] ring-1 ring-[#E0E7FF] w-full max-w-lg mx-auto overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#2563EB]" />
      <div className="px-4 py-4 md:px-6 md:py-5">
        {phase === 'active' && (
          <div className="flex flex-col items-center gap-4">
            <FractionBar numerator={problem.prompt.numerator} denominator={barDenominator} />

            <p className="text-center text-[#1E1B4B] font-semibold text-base md:text-lg">
              {problem.skill === 'equivalent-fractions'
                ? `${problem.prompt.numerator}/${problem.prompt.denominator} = ?/${problem.policy.kind === 'FIXED_DENOMINATOR_REQUIRED' ? problem.policy.targetDenominator : ''}`
                : `Simplify ${problem.prompt.numerator}/${problem.prompt.denominator}`}
            </p>

            <FractionInput
              key={problem.id}
              denominatorEditable={problem.skill !== 'equivalent-fractions'}
              fixedDenominator={problem.policy.kind === 'FIXED_DENOMINATOR_REQUIRED' ? problem.policy.targetDenominator : undefined}
              onSubmit={handleAnswer}
              disabled={feedbackState !== 'hidden'}
              feedbackState={feedbackState === 'hidden' ? 'idle' : feedbackState}
              ariaLabel={promptDescription(problem)}
              feedbackContent={
                <div className="min-h-[1.75rem] flex items-center justify-center w-full">
                  {feedbackState !== 'hidden' && (
                    <div
                      aria-live="polite"
                      aria-atomic="true"
                      className={`text-base font-semibold px-5 py-2 rounded-xl animate-[fadeIn_0.15s_ease-out] ${
                        feedbackState === 'correct'
                          ? 'bg-[#ECFDF5] text-[#065F46] border border-[#6EE7B7] shadow-[0_0_0_3px_rgba(16,185,129,0.15)]'
                          : 'bg-[#FEF2F2] text-[#991B1B] border border-[#FCA5A5] shadow-[0_0_0_3px_rgba(239,68,68,0.12)]'
                      }`}
                    >
                      {feedbackState === 'correct'
                        ? '✓ Correct!'
                        : `The answer was ${feedbackCorrectAnswer?.numerator}/${feedbackCorrectAnswer?.denominator}`}
                    </div>
                  )}
                </div>
              }
            />

            <div className="flex items-center justify-between w-full">
              <span className="text-sm font-semibold text-[#6B7280]">
                Question {Math.min(totalAnsweredRef.current + 1, questionCount)} of {questionCount}
              </span>
              <span className="text-sm font-semibold text-[#4F46E5]">Correct: {correct}</span>
            </div>
          </div>
        )}

        {phase === 'complete' && result && (
          <ScoreCard
            result={result}
            stats={stats}
            isTimed={false}
            preSessionScore={preSessionScore}
            preSessionPersonalBest={0}
            isNewStreakRecord={false}
            onRestart={handleRestart}
            questionCount={questionCount}
          />
        )}
      </div>
    </div>
  );
}
