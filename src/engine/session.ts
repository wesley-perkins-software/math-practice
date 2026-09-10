import type { QuestionCount } from './types';

/**
 * The small, clock-free boundary state shared by timed and untimed practice.
 * React owns presentation and scoring; this module makes accepting an answer,
 * waiting for its feedback, and completing a session deterministic and testable.
 */
export interface PracticeSessionState {
  status: 'active' | 'complete';
  completedQuestions: number;
  acceptingAnswer: boolean;
  questionCompletionPending: boolean;
  /** Set as soon as a completion boundary wins, even if feedback is still showing. */
  completionReason?: 'time-limit' | 'question-limit';
}

export function startPracticeSession(): PracticeSessionState {
  return {
    status: 'active',
    completedQuestions: 0,
    acceptingAnswer: true,
    questionCompletionPending: false,
  };
}

export function recordCompletedQuestion(
  state: PracticeSessionState,
  questionCount?: QuestionCount,
): { state: PracticeSessionState; accepted: boolean } {
  if (state.status !== 'active' || !state.acceptingAnswer) {
    return { state, accepted: false };
  }

  const completedQuestions = state.completedQuestions + 1;
  return {
    accepted: true,
    state: {
      ...state,
      completedQuestions,
      acceptingAnswer: false,
      questionCompletionPending: questionCount !== undefined && completedQuestions >= questionCount,
      ...(questionCount !== undefined && completedQuestions >= questionCount
        ? { completionReason: 'question-limit' as const }
        : {}),
    },
  };
}

/** Runs after normal correct/incorrect feedback has remained visible. */
export function finishAnswerFeedback(state: PracticeSessionState): {
  state: PracticeSessionState;
  shouldGenerateNext: boolean;
  shouldComplete: boolean;
} {
  if (state.status !== 'active' || state.acceptingAnswer) {
    return { state, shouldGenerateNext: false, shouldComplete: false };
  }
  if (state.questionCompletionPending) {
    return {
      state: { ...state, status: 'complete', questionCompletionPending: false },
      shouldGenerateNext: false,
      shouldComplete: true,
    };
  }
  return {
    state: { ...state, acceptingAnswer: true },
    shouldGenerateNext: true,
    shouldComplete: false,
  };
}

/** Timer and question-count completion are first-condition-wins and idempotent. */
export function expirePracticeTimer(state: PracticeSessionState): {
  state: PracticeSessionState;
  shouldComplete: boolean;
} {
  // Reaching the target reserves completion at submission time. Its normal
  // feedback delay must not let a later countdown tick steal the boundary.
  if (state.status === 'complete' || state.questionCompletionPending) return { state, shouldComplete: false };
  return {
    state: { ...state, status: 'complete', acceptingAnswer: false, questionCompletionPending: false, completionReason: 'time-limit' },
    shouldComplete: true,
  };
}
