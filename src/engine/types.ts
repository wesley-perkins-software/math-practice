export type Operation = 'addition' | 'subtraction' | 'multiplication' | 'division' | 'mixed';
export type PracticeMode = 'untimed' | 'timed';
export type TimerDuration = 30 | 60 | 120 | 300;

export interface DigitRange {
  min: number;
  max: number;
}

export interface PracticeConfig {
  /** Unique key per page for localStorage namespacing */
  storageKey: string;
  /** Human-readable name for display in the progress dashboard */
  label?: string;
  operation: Operation;
  /** Default mode when page loads */
  mode: PracticeMode;
  /** Used only when mode === 'timed'. Default 60. */
  timerDuration: TimerDuration;
  /** If true, timer duration is fixed and users cannot change it in the UI. */
  fixedTimerDuration?: boolean;
  operandA: DigitRange;
  operandB: DigitRange;
  /** Addition: if false, generator guarantees no carrying */
  carrying?: boolean;
  /** Subtraction: if false, generator guarantees A >= B (no borrowing) */
  borrowing?: boolean;
  /** Multiplication/Division: constrain to 1–12 facts table */
  factsMode?: boolean;
  /** Upper bound for facts mode. Default 12. */
  maxFactor?: number;
  /** Division: generate problems with remainders */
  withRemainder?: boolean;
  /** Override the delay (ms) before advancing after a correct answer (default: 600) */
  correctFeedbackDelayMs?: number;
  /** Override the delay (ms) before advancing after an incorrect answer (default: 1800) */
  incorrectFeedbackDelayMs?: number;
/** Explicit operation list when operation === 'mixed' */
  operations?: Exclude<Operation, 'mixed'>[];
}

export interface Problem {
  id: string;
  operandA: number;
  operandB: number;
  operation: Exclude<Operation, 'mixed'>;
  correctAnswer: number;
  /** Division with remainders: the remainder portion of the answer */
  remainder?: number;
}

export interface SessionResult {
  correct: number;
  total: number;
  durationSeconds: number;
  /** 0–100 integer percent correct */
  score: number;
  /** ISO 8601 */
  timestamp: string;
}

export interface PageStats {
  currentStreak: number;
  longestStreak: number;
  /** Correct answers per 60s, normalized across durations */
  bestTimedScore: number;
  /** 0–100 percent correct from most recent session */
  lastSessionScore: number;
  /** ISO 8601 date */
  lastSessionDate: string;
  totalProblemsAttempted: number;
  totalSessions: number;
}
