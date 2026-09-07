import assert from 'node:assert/strict';
export { assert };
export type TestCase = { name: string; run: () => void | Promise<void> };
export const test = (name: string, run: TestCase['run']): TestCase => ({ name, run });
export function sequence(values: number[], fallback = values.at(-1) ?? 0) {
  let i = 0;
  return () => values[i++] ?? fallback;
}
