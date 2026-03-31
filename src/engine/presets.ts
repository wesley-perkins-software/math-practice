import type { PracticeConfig } from './types';

// ─── Addition ───────────────────────────────────────────────────────────────

export const ADDITION_1_DIGIT: PracticeConfig = {
  storageKey: 'add-1d',
  label: '1-Digit Addition',
  operation: 'addition',
  mode: 'untimed',
  timerDuration: 60,
  operandA: { min: 1, max: 9 },
  operandB: { min: 1, max: 9 },
  carrying: false,
  problemCount: 20,
};

export const ADDITION_2_DIGIT: PracticeConfig = {
  storageKey: 'add-2d',
  label: '2-Digit Addition (No Carrying)',
  operation: 'addition',
  mode: 'untimed',
  timerDuration: 60,
  operandA: { min: 10, max: 99 },
  operandB: { min: 10, max: 99 },
  carrying: false,
  problemCount: 20,
};

export const ADDITION_2_DIGIT_CARRYING: PracticeConfig = {
  storageKey: 'add-2d-carry',
  label: 'Addition with Carrying',
  operation: 'addition',
  mode: 'untimed',
  timerDuration: 60,
  operandA: { min: 15, max: 99 },
  operandB: { min: 15, max: 99 },
  carrying: true,
  problemCount: 20,
};

export const ADDITION_GENERAL: PracticeConfig = {
  storageKey: 'add-general',
  label: 'Addition Practice',
  operation: 'addition',
  mode: 'untimed',
  timerDuration: 60,
  operandA: { min: 1, max: 99 },
  operandB: { min: 1, max: 99 },
  carrying: true,
  problemCount: 20,
};

// ─── Subtraction ────────────────────────────────────────────────────────────

export const SUBTRACTION_1_DIGIT: PracticeConfig = {
  storageKey: 'sub-1d',
  label: '1-Digit Subtraction',
  operation: 'subtraction',
  mode: 'untimed',
  timerDuration: 60,
  operandA: { min: 1, max: 9 },
  operandB: { min: 1, max: 9 },
  borrowing: false,
  problemCount: 20,
};

export const SUBTRACTION_2_DIGIT: PracticeConfig = {
  storageKey: 'sub-2d',
  label: '2-Digit Subtraction',
  operation: 'subtraction',
  mode: 'untimed',
  timerDuration: 60,
  operandA: { min: 10, max: 99 },
  operandB: { min: 10, max: 99 },
  borrowing: true,
  problemCount: 20,
};

export const SUBTRACTION_2_DIGIT_BORROWING: PracticeConfig = {
  storageKey: 'sub-2d-borrow',
  label: 'Subtraction with Borrowing',
  operation: 'subtraction',
  mode: 'untimed',
  timerDuration: 60,
  operandA: { min: 20, max: 99 },
  operandB: { min: 11, max: 49 },
  borrowing: true,
  problemCount: 20,
};

export const SUBTRACTION_GENERAL: PracticeConfig = {
  storageKey: 'sub-general',
  label: 'Subtraction Practice',
  operation: 'subtraction',
  mode: 'untimed',
  timerDuration: 60,
  operandA: { min: 1, max: 99 },
  operandB: { min: 1, max: 99 },
  borrowing: true,
  problemCount: 20,
};

// ─── Multiplication ─────────────────────────────────────────────────────────

export const MULTIPLICATION_FACTS: PracticeConfig = {
  storageKey: 'mult-facts',
  label: 'Multiplication Facts',
  operation: 'multiplication',
  mode: 'untimed',
  timerDuration: 60,
  operandA: { min: 1, max: 12 },
  operandB: { min: 1, max: 12 },
  factsMode: true,
  maxFactor: 12,
  problemCount: 20,
};

export const MULTIPLICATION_1_12: PracticeConfig = {
  storageKey: 'mult-1-12',
  label: 'Times Tables 1–12',
  operation: 'multiplication',
  mode: 'untimed',
  timerDuration: 60,
  operandA: { min: 1, max: 12 },
  operandB: { min: 1, max: 12 },
  factsMode: true,
  maxFactor: 12,
  problemCount: 20,
};

export const MULTIPLICATION_GENERAL: PracticeConfig = {
  storageKey: 'mult-general',
  label: 'Multiplication Practice',
  operation: 'multiplication',
  mode: 'untimed',
  timerDuration: 60,
  operandA: { min: 2, max: 12 },
  operandB: { min: 2, max: 12 },
  factsMode: true,
  maxFactor: 12,
  problemCount: 20,
};

// ─── Division ───────────────────────────────────────────────────────────────

export const DIVISION_FACTS: PracticeConfig = {
  storageKey: 'div-facts',
  label: 'Division Facts',
  operation: 'division',
  mode: 'untimed',
  timerDuration: 60,
  operandA: { min: 1, max: 12 },
  operandB: { min: 1, max: 12 },
  factsMode: true,
  maxFactor: 12,
  problemCount: 20,
};

export const DIVISION_GENERAL: PracticeConfig = {
  storageKey: 'div-general',
  label: 'Division Practice',
  operation: 'division',
  mode: 'untimed',
  timerDuration: 60,
  operandA: { min: 1, max: 12 },
  operandB: { min: 1, max: 12 },
  factsMode: true,
  maxFactor: 12,
  problemCount: 20,
};

// ─── Mixed / Speed Drill ────────────────────────────────────────────────────

export const MIXED_PRACTICE: PracticeConfig = {
  storageKey: 'mixed-general',
  label: 'Mixed Practice',
  operation: 'mixed',
  mode: 'untimed',
  timerDuration: 60,
  operandA: { min: 1, max: 12 },
  operandB: { min: 1, max: 12 },
  operations: ['addition', 'subtraction', 'multiplication', 'division'],
  factsMode: true,
  problemCount: 20,
};

export const MATH_DRILLS: PracticeConfig = {
  storageKey: 'math-drills',
  label: 'Math Drills',
  operation: 'mixed',
  mode: 'timed',
  timerDuration: 60,
  operandA: { min: 1, max: 12 },
  operandB: { min: 1, max: 12 },
  operations: ['addition', 'subtraction', 'multiplication', 'division'],
  factsMode: true,
  problemCount: 20,
};

export const MENTAL_MATH: PracticeConfig = {
  storageKey: 'mental-math',
  label: 'Mental Math',
  operation: 'mixed',
  mode: 'timed',
  timerDuration: 60,
  operandA: { min: 1, max: 25 },
  operandB: { min: 1, max: 25 },
  operations: ['addition', 'subtraction', 'multiplication'],
  problemCount: 20,
};

export const ARITHMETIC_SPEED_DRILL: PracticeConfig = {
  storageKey: 'speed-drill',
  label: 'Arithmetic Speed Drill',
  operation: 'mixed',
  mode: 'timed',
  timerDuration: 60,
  operandA: { min: 1, max: 12 },
  operandB: { min: 1, max: 12 },
  operations: ['addition', 'subtraction', 'multiplication', 'division'],
  factsMode: true,
  problemCount: 20,
};

export const MATH_FACTS_PRACTICE: PracticeConfig = {
  storageKey: 'math-facts',
  label: 'Math Facts Practice',
  operation: 'mixed',
  mode: 'untimed',
  timerDuration: 60,
  operandA: { min: 1, max: 12 },
  operandB: { min: 1, max: 12 },
  operations: ['multiplication', 'division'],
  factsMode: true,
  problemCount: 20,
};

export const MATH_PRACTICE_GENERAL: PracticeConfig = {
  storageKey: 'math-practice',
  label: 'Math Practice',
  operation: 'mixed',
  mode: 'untimed',
  timerDuration: 60,
  operandA: { min: 1, max: 20 },
  operandB: { min: 1, max: 20 },
  operations: ['addition', 'subtraction', 'multiplication', 'division'],
  problemCount: 20,
};

// ─── All presets (used by the progress dashboard) ───────────────────────────

export const ALL_PRESETS: PracticeConfig[] = [
  ADDITION_1_DIGIT,
  ADDITION_2_DIGIT,
  ADDITION_2_DIGIT_CARRYING,
  ADDITION_GENERAL,
  SUBTRACTION_1_DIGIT,
  SUBTRACTION_2_DIGIT,
  SUBTRACTION_2_DIGIT_BORROWING,
  SUBTRACTION_GENERAL,
  MULTIPLICATION_FACTS,
  MULTIPLICATION_1_12,
  MULTIPLICATION_GENERAL,
  DIVISION_FACTS,
  DIVISION_GENERAL,
  MIXED_PRACTICE,
  MATH_DRILLS,
  MENTAL_MATH,
  ARITHMETIC_SPEED_DRILL,
  MATH_FACTS_PRACTICE,
  MATH_PRACTICE_GENERAL,
];
