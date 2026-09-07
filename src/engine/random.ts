/** A source of values in the same [0, 1) range as Math.random(). */
export type RandomSource = () => number;

/** Identifies the deterministic algorithm used by createSeededRandom. */
export const RNG_VERSION = 'rng-v1' as const;
export type RngVersion = typeof RNG_VERSION;

/** The normal application boundary remains Math.random unless explicitly replaced. */
export const defaultRandom: RandomSource = () => Math.random();

/**
 * Creates a small, non-cryptographic Mulberry32 random source.
 *
 * Reproducibility is guaranteed only for the same seed and RNG_VERSION. The
 * optional version argument makes callers stateful-version-ready without
 * pretending future algorithms can silently preserve old sequences.
 */
export function createSeededRandom(seed: number, version: RngVersion = RNG_VERSION): RandomSource {
  if (version !== RNG_VERSION) {
    throw new Error(`Unsupported RNG version: ${version}`);
  }

  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
