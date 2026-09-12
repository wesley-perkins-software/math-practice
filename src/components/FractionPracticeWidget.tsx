import { useEffect, useRef, useState } from 'react';
import type { QuestionCount, PageStats, SessionResult } from '@/engine/types';
import type { FractionProblem, FractionSkillId, Fraction } from '@/engine/fractions/types';
import { generateFractionProblemSet } from '@/engine/fractions/generator';
import { validateFractionAnswer } from '@/engine/fractions/validation';
import { buildSessionResult } from '@/engine/scorer';
import { loadStats, saveStats, updateStatsAfterUntimedAnswer, appendSessionLog } from '@/engine/storage';
import { recordCompletedQuestion, finishAnswerFeedback, startPracticeSession, type PracticeSessionState } from '@/engine/session';
import FractionInput from './FractionInput';
import FractionDisplay from './FractionDisplay';
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
  // Symbolic-first: the fraction-bar model is opt-in scaffolding, not
  // permanent chrome, and defaults closed again for every new problem.
  const [modelOpen, setModelOpen] = useState(false);

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
        setModelOpen(false);
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
    setModelOpen(false);
    setPhase('active');
  }

  if (!problems) return null; // avoids a hydration mismatch between server render and the client's own unseeded generation

  const problem = problems[Math.min(problemIndex, problems.length - 1)]!;
  const isEquivalent = problem.skill === 'equivalent-fractions';
  const targetDenominator = problem.policy.kind === 'FIXED_DENOMINATOR_REQUIRED' ? problem.policy.targetDenominator : undefined;

  const feedback = (
    <div className="h-[length:var(--practice-feedback-h)] max-w-[length:var(--practice-feedback-max-w)] mx-auto flex items-center justify-center w-full">
      {feedbackState !== 'hidden' && (
        <div
          aria-live="polite"
          aria-atomic="true"
          className={`font-practice w-full flex items-center justify-center gap-2 text-[length:var(--practice-feedback-text)] font-bold px-4 py-[length:var(--practice-feedback-py)] rounded-xl animate-[fadeIn_0.15s_ease-out] ${
            feedbackState === 'correct' ? 'bg-[#047857] text-white' : 'bg-[#DC2626] text-white'
          }`}
        >
          {feedbackState === 'correct' ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
              <span>Correct!</span>
            </>
          ) : (
            <span>
              The answer was{' '}
              <span className="tabular-nums">{feedbackCorrectAnswer?.numerator}/{feedbackCorrectAnswer?.denominator}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div data-practice-instrument className="bg-white rounded-2xl border border-[#E4E1F5] w-full max-w-[length:var(--practice-card-max-w)] mx-auto overflow-hidden">
      <div className="px-[length:var(--practice-card-px)] pt-[length:var(--practice-card-pt)] pb-[length:var(--practice-card-pb)]">
        {phase === 'active' && (
          <div className="flex flex-col items-center gap-[length:var(--practice-stack-gap)]">
            {/* The math problem is the dominant element: a symbolic stacked-fraction
                expression, not inline slash notation, and (for Simplify) no bar by
                default — the visual model is opt-in scaffolding below, never
                permanent chrome above the prompt. */}
            {isEquivalent ? (
              <div className="flex flex-col items-center w-full">
                <FractionDisplay numerator={problem.prompt.numerator} denominator={problem.prompt.denominator} />
                <span className="font-practice font-bold text-[#211D4F] text-[length:var(--practice-operator-size)] leading-none my-2" aria-hidden="true">=</span>
                <FractionInput
                  key={problem.id}
                  denominatorEditable={false}
                  fixedDenominator={targetDenominator}
                  onSubmit={handleAnswer}
                  disabled={feedbackState !== 'hidden'}
                  feedbackState={feedbackState === 'hidden' ? 'idle' : feedbackState}
                  ariaLabel={promptDescription(problem)}
                  feedbackContent={feedback}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center w-full">
                <span className="font-practice text-sm font-semibold text-[#6B6690] mb-1">Simplify</span>
                <FractionDisplay numerator={problem.prompt.numerator} denominator={problem.prompt.denominator} />
                <div className="mt-3 w-full flex flex-col items-center">
                  <FractionInput
                    key={problem.id}
                    denominatorEditable={true}
                    onSubmit={handleAnswer}
                    disabled={feedbackState !== 'hidden'}
                    feedbackState={feedbackState === 'hidden' ? 'idle' : feedbackState}
                    ariaLabel={promptDescription(problem)}
                    feedbackContent={feedback}
                  />
                </div>
              </div>
            )}

            {/* Optional model: closed by default, never larger or more visually
                important than the symbolic problem above it. Opens without
                shifting anything above it — only adds content below. */}
            <div className="w-full flex flex-col items-center">
              <button
                type="button"
                onClick={() => setModelOpen((open) => !open)}
                aria-expanded={modelOpen}
                className="font-practice text-sm font-semibold text-[#4F46E5] hover:text-[#3E35C7] transition-colors py-1 px-2 -mx-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]/50"
              >
                {modelOpen ? 'Hide model' : 'Show model'}
              </button>

              {modelOpen && (
                <div className="mt-2 flex items-start justify-center gap-6 w-full">
                  <div className="flex flex-col items-center gap-1 w-28">
                    <FractionBar numerator={problem.prompt.numerator} denominator={problem.prompt.denominator} />
                    <span className="font-practice text-xs font-medium text-[#6B6690] tabular-nums">
                      {problem.prompt.numerator}/{problem.prompt.denominator}
                    </span>
                  </div>
                  {isEquivalent && (
                    <div className="flex flex-col items-center gap-1 w-28">
                      <FractionBar numerator={problem.correctAnswer.numerator} denominator={problem.correctAnswer.denominator} />
                      <span className="font-practice text-xs font-medium text-[#6B6690] tabular-nums">
                        ?/{targetDenominator}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Secondary status: Streak matches the arithmetic practice
                convention (PracticeWidget's untimed row) rather than
                inventing a new "Correct: N" live counter — score is not
                over-emphasized during active practice. */}
            <div className="flex items-end justify-between w-full font-practice pt-1">
              <div key={stats.currentStreak} className="flex flex-col gap-0.5 leading-none animate-[pop_0.25s_ease-out]">
                <span className="text-[13px] font-bold text-[#211D4F]">Streak</span>
                <span className="flex items-baseline gap-1">
                  <span className={`text-[2rem] font-extrabold leading-none tabular-nums ${stats.currentStreak > 0 ? 'text-amber-600' : 'text-[#8983B8]'}`}>
                    {stats.currentStreak}
                  </span>
                  {stats.currentStreak > 0 && <span aria-hidden="true" className="text-base leading-none translate-y-[-1px]">🔥</span>}
                </span>
              </div>
              <span className="text-xs font-medium text-[#8983B8]">
                Question {Math.min(totalAnsweredRef.current + 1, questionCount)} of {questionCount}
              </span>
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
            variant="prototype"
            questionCount={questionCount}
          />
        )}
      </div>
    </div>
  );
}
