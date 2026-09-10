import { assert, test } from './harness';
import {
  expirePracticeTimer,
  finishAnswerFeedback,
  recordCompletedQuestion,
  startPracticeSession,
} from '../src/engine/session';
import { buildSessionResult, buildTimedSessionResult, calculateTimedElapsedSeconds, calculateTimedScore } from '../src/engine/scorer';

function answerAndFinish(state = startPracticeSession(), target?: 10 | 20 | 30 | 50) {
  const submission = recordCompletedQuestion(state, target);
  const feedback = finishAnswerFeedback(submission.state);
  return { submission, feedback };
}

export const tests = [
  test('a ten-question session accepts and advances after answers one through nine', () => {
    let state = startPracticeSession();
    for (let answer = 1; answer <= 9; answer++) {
      const { submission, feedback } = answerAndFinish(state, 10);
      assert.equal(submission.accepted, true);
      assert.equal(submission.state.completedQuestions, answer);
      assert.equal(feedback.shouldGenerateNext, true);
      assert.equal(feedback.shouldComplete, false);
      state = feedback.state;
    }
  }),
  test('answer ten is counted and completes once without generating question eleven', () => {
    let state = startPracticeSession();
    for (let answer = 1; answer <= 10; answer++) {
      const step = answerAndFinish(state, 10);
      state = step.feedback.state;
      if (answer === 10) {
        assert.equal(step.submission.state.completedQuestions, 10);
        assert.equal(step.feedback.shouldComplete, true);
        assert.equal(step.feedback.shouldGenerateNext, false);
      }
    }
    const staleFeedback = finishAnswerFeedback(state);
    assert.equal(staleFeedback.shouldComplete, false);
    assert.equal(staleFeedback.shouldGenerateNext, false);
    assert.equal(recordCompletedQuestion(state, 10).accepted, false);
  }),
  test('an untimed session without a target remains unbounded', () => {
    let state = startPracticeSession();
    for (let answer = 0; answer < 100; answer++) state = answerAndFinish(state).feedback.state;
    assert.equal(state.status, 'active');
    assert.equal(state.completedQuestions, 100);
  }),
  test('a target session preserves final-answer accuracy for zero, partial, and all correct', () => {
    assert.equal(buildSessionResult(0, 10, 5).score, 0);
    assert.equal(buildSessionResult(2, 3, 5).score, 67);
    assert.equal(buildSessionResult(10, 10, 5).score, 100);
  }),
  test('replay resets finite progress while retaining the caller-owned target', () => {
    let state = startPracticeSession();
    for (let answer = 0; answer < 10; answer++) state = answerAndFinish(state, 10).feedback.state;
    assert.equal(state.status, 'complete');
    state = startPracticeSession();
    assert.deepEqual(state, {
      status: 'active', completedQuestions: 0, acceptingAnswer: true, questionCompletionPending: false,
    });
    assert.equal(answerAndFinish(state, 10).feedback.shouldGenerateNext, true);
  }),
  test('timed practice without a target advances until timer expiry', () => {
    const afterAnswer = answerAndFinish(startPracticeSession()).feedback;
    assert.equal(afterAnswer.shouldGenerateNext, true);
    const expired = expirePracticeTimer(afterAnswer.state);
    assert.equal(expired.shouldComplete, true);
    assert.equal(expired.state.status, 'complete');
  }),
  test('timed plus target completes when the target wins', () => {
    let state = startPracticeSession();
    for (let answer = 0; answer < 10; answer++) state = answerAndFinish(state, 10).feedback.state;
    assert.equal(state.status, 'complete');
    assert.equal(state.completionReason, 'question-limit');
    assert.equal(expirePracticeTimer(state).shouldComplete, false);
  }),
  test('timed plus target completes when the timer wins', () => {
    let state = startPracticeSession();
    for (let answer = 0; answer < 4; answer++) state = answerAndFinish(state, 10).feedback.state;
    const expired = expirePracticeTimer(state);
    assert.equal(expired.shouldComplete, true);
    assert.equal(expired.state.completedQuestions, 4);
    assert.equal(expired.state.completionReason, 'time-limit');
    assert.equal(recordCompletedQuestion(expired.state, 10).accepted, false);
  }),
  test('double submission during feedback counts at most once', () => {
    const first = recordCompletedQuestion(startPracticeSession(), 10);
    const duplicate = recordCompletedQuestion(first.state, 10);
    assert.equal(first.accepted, true);
    assert.equal(duplicate.accepted, false);
    assert.equal(duplicate.state.completedQuestions, 1);
  }),
  test('a final accepted submission wins the timer race while feedback remains visible', () => {
    let state = startPracticeSession();
    for (let answer = 0; answer < 9; answer++) state = answerAndFinish(state, 10).feedback.state;
    const finalSubmission = recordCompletedQuestion(state, 10);
    const timer = expirePracticeTimer(finalSubmission.state);
    const staleFeedback = finishAnswerFeedback(timer.state);
    assert.equal(timer.shouldComplete, false);
    assert.equal(staleFeedback.shouldComplete, true);
    assert.equal(staleFeedback.shouldGenerateNext, false);
    assert.equal(staleFeedback.state.completionReason, 'question-limit');
  }),
  test('stale delayed feedback cannot reopen a timer-completed session', () => {
    const submitted = recordCompletedQuestion(startPracticeSession(), 10);
    const expired = expirePracticeTimer(submitted.state);
    const delayed = finishAnswerFeedback(expired.state);
    assert.equal(delayed.state.status, 'complete');
    assert.equal(delayed.shouldGenerateNext, false);
  }),
  test('timed score normalization remains correct-per-sixty-seconds', () => {
    assert.equal(calculateTimedScore(10, 120), 5);
    assert.equal(calculateTimedScore(10, 30), 20);
  }),
  test('question-limit timed results distinguish actual elapsed time from the configured limit', () => {
    const result = buildTimedSessionResult(18, 20, 10_000, 62_400, 300, 'question-limit', 20);
    assert.deepEqual({
      correct: result.correct, total: result.total, duration: result.durationSeconds,
      elapsed: result.elapsedSeconds, limit: result.timeLimitSeconds,
      reason: result.completionReason, target: result.questionTarget,
    }, { correct: 18, total: 20, duration: 52.4, elapsed: 52.4, limit: 300, reason: 'question-limit', target: 20 });
    assert.equal(calculateTimedScore(result.correct, result.elapsedSeconds!), 21);
  }),
  test('time-limit timed result uses the exact logical countdown boundary and attempted-answer accuracy', () => {
    const result = buildTimedSessionResult(6, 8, 10_000, 41_750, 30, 'time-limit', 20);
    assert.deepEqual([result.durationSeconds, result.elapsedSeconds, result.timeLimitSeconds, result.completionReason, result.total, result.questionTarget, result.score], [30, 30, 30, 'time-limit', 8, 20, 75]);
  }),
  test('timed-only completion retains speed-drill score semantics', () => {
    const result = buildTimedSessionResult(24, 30, 5_000, 66_500, 60, 'time-limit');
    assert.deepEqual([result.durationSeconds, result.elapsedSeconds, result.timeLimitSeconds, result.completionReason, result.questionTarget], [60, 60, 60, 'time-limit', undefined]);
    assert.equal(calculateTimedScore(result.correct, result.elapsedSeconds!), 24);
  }),
  test('logical target completion time is frozen before feedback and clamped to the timer limit', () => {
    assert.equal(calculateTimedElapsedSeconds(1_000, 53_400, 300), 52.4);
    assert.equal(calculateTimedElapsedSeconds(1_000, 999_000, 300), 300);
    assert.equal(calculateTimedElapsedSeconds(0, 53_400, 300), 0);
  }),
  test('replay results receive fresh timing and completion metadata', () => {
    const first = buildTimedSessionResult(10, 10, 1_000, 11_000, 300, 'question-limit', 10);
    const replayState = startPracticeSession();
    const replay = buildTimedSessionResult(5, 5, 20_000, 25_000, 300, 'question-limit', 10);
    assert.equal(replayState.completionReason, undefined);
    assert.deepEqual([replay.elapsedSeconds, replay.timeLimitSeconds, replay.questionTarget], [5, 300, 10]);
    assert.equal(first.elapsedSeconds, 10);
  }),
];
