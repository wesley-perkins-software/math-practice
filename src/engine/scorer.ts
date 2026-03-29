import type { Problem, SessionResult } from './types';

export function scoreAnswer(problem: Problem, userAnswer: number): boolean {
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

export function buildSessionResult(
  correct: number,
  total: number,
  durationSeconds: number,
): SessionResult {
  return {
    correct,
    total,
    durationSeconds,
    score: calculateSessionScore(correct, total),
    timestamp: new Date().toISOString(),
  };
}
