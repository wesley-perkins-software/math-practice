import type { PracticeConfig, Problem, Operation } from './types';

let _idCounter = 0;
function nextId(): string {
  return String(++_idCounter);
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Returns true if adding two non-negative integers requires a carry in any column */
function hasCarry(a: number, b: number): boolean {
  while (a > 0 || b > 0) {
    if ((a % 10) + (b % 10) >= 10) return true;
    a = Math.floor(a / 10);
    b = Math.floor(b / 10);
  }
  return false;
}

function generateAddition(config: PracticeConfig): Problem {
  const { operandA, operandB, carrying } = config;
  const noCarry = carrying === false;
  const requireCarry = carrying === true;
  let a: number, b: number;
  let attempts = 0;
  do {
    a = randInt(operandA.min, operandA.max);
    b = randInt(operandB.min, operandB.max);
    attempts++;
    // Safety valve: after 100 attempts relax the constraint to avoid infinite loops
    if (attempts > 100) break;
  } while ((noCarry && hasCarry(a, b)) || (requireCarry && !hasCarry(a, b)));

  return { id: nextId(), operandA: a, operandB: b, operation: 'addition', correctAnswer: a + b };
}

function generateSubtraction(config: PracticeConfig): Problem {
  const { operandA, operandB, borrowing } = config;
  const noBorrow = borrowing === false;
  let a = randInt(operandA.min, operandA.max);
  let b = randInt(operandB.min, operandB.max);

  if (noBorrow) {
    // Ensure a >= b so no borrowing is needed
    if (b > a) [a, b] = [b, a];
  } else {
    // Always ensure a >= b for valid (non-negative) subtraction answers
    if (b > a) [a, b] = [b, a];
  }

  return { id: nextId(), operandA: a, operandB: b, operation: 'subtraction', correctAnswer: a - b };
}

function generateMultiplication(config: PracticeConfig): Problem {
  const maxF = config.maxFactor ?? 12;
  let a: number, b: number;
  if (config.factsMode) {
    a = randInt(1, maxF);
    b = randInt(1, maxF);
  } else {
    a = randInt(config.operandA.min, config.operandA.max);
    b = randInt(config.operandB.min, config.operandB.max);
  }
  return { id: nextId(), operandA: a, operandB: b, operation: 'multiplication', correctAnswer: a * b };
}

function generateDivision(config: PracticeConfig): Problem {
  const maxF = config.maxFactor ?? 12;
  let divisor: number, quotient: number;
  if (config.factsMode) {
    divisor = randInt(1, maxF);
    quotient = randInt(1, maxF);
  } else {
    divisor = randInt(Math.max(config.operandB.min, 1), config.operandB.max);
    quotient = randInt(config.operandA.min, config.operandA.max);
  }
  const dividend = divisor * quotient;
  return { id: nextId(), operandA: dividend, operandB: divisor, operation: 'division', correctAnswer: quotient };
}

function generateSingle(config: PracticeConfig, op: Exclude<Operation, 'mixed'>): Problem {
  switch (op) {
    case 'addition':      return generateAddition(config);
    case 'subtraction':   return generateSubtraction(config);
    case 'multiplication': return generateMultiplication(config);
    case 'division':      return generateDivision(config);
  }
}

export function generateProblem(config: PracticeConfig): Problem {
  if (config.operation === 'mixed') {
    const ops = config.operations ?? ['addition', 'subtraction', 'multiplication', 'division'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    return generateSingle(config, op);
  }
  return generateSingle(config, config.operation);
}

export function generateProblemSet(config: PracticeConfig, count: number): Problem[] {
  return Array.from({ length: count }, () => generateProblem(config));
}
