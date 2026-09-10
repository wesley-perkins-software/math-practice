import type { Problem, SessionResult } from './types';

export function scoreAnswer(problem: Problem, userAnswer: number, userRemainder?: number): boolean {
  if (problem.remainder !== undefined) {
    return userAnswer === problem.correctAnswer && userRemainder === problem.remainder;
  }
  return userAnswer === problem.correctAnswer;
}

/** Returns 0–100 integer percent */
export function calculateSessionScore(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

/** Normalizes to correct-per-60-seconds so scores are comparable across durations */
export function calculateTimedScore(correct: number, durationSeconds: number): number {
  if (durationSeconds === 0) return 0;
  return Math.round((correct / durationSeconds) * 60);
}

/** Uses the existing session clock and clamps scheduler delay to the configured limit. */
export function calculateTimedElapsedSeconds(startTimeMs: number, completionTimeMs: number, timeLimitSeconds: number): number {
  if (startTimeMs <= 0 || completionTimeMs <= startTimeMs) return 0;
  return Math.min(timeLimitSeconds, (completionTimeMs - startTimeMs) / 1000);
}

export interface SessionResultMetadata {
  elapsedSeconds?: number;
  timeLimitSeconds?: number;
  completionReason?: SessionResult['completionReason'];
  questionTarget?: SessionResult['questionTarget'];
}

export function buildTimedSessionResult(
  correct: number,
  total: number,
  startTimeMs: number,
  completionTimeMs: number,
  timeLimitSeconds: number,
  completionReason: NonNullable<SessionResult['completionReason']>,
  questionTarget?: SessionResult['questionTarget'],
): SessionResult {
  const elapsedSeconds = completionReason === 'time-limit'
    ? timeLimitSeconds
    : calculateTimedElapsedSeconds(startTimeMs, completionTimeMs, timeLimitSeconds);
  return buildSessionResult(correct, total, elapsedSeconds, {
    elapsedSeconds,
    timeLimitSeconds,
    completionReason,
    ...(questionTarget === undefined ? {} : { questionTarget }),
  });
}

export function buildSessionResult(
  correct: number,
  total: number,
  durationSeconds: number,
  metadata: SessionResultMetadata = {},
): SessionResult {
  return {
    correct,
    total,
    durationSeconds,
    ...metadata,
    score: calculateSessionScore(correct, total),
    timestamp: new Date().toISOString(),
  };
}
