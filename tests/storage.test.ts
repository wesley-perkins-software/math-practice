import { assert, test } from './harness';
import {
  DEFAULT_STATS,
  DURATION_PREF_KEY,
  MODE_PREF_KEY,
  VERSIONED_RECORD_VERSION,
  appendSessionLog,
  clearAllProgress,
  clearStats,
  createVersionedRecordAdapter,
  loadSessionLog,
  loadStats,
  resetCurrentStreak,
  resetLongestStreak,
  resetPersonalBestScore,
  saveStats,
  updateStatsAfterSession, updateStatsAfterUntimedAnswer,
} from '../src/engine/storage';

class MemoryStorage {
  data = new Map<string, string>();
  get length() { return this.data.size; }
  key(i: number) { return [...this.data.keys()][i] ?? null; }
  getItem(k: string) { return this.data.get(k) ?? null; }
  setItem(k: string, v: string) { this.data.set(k, String(v)); }
  removeItem(k: string) { this.data.delete(k); }
  clear() { this.data.clear(); }
}

const setup = () => {
  const storage = new MemoryStorage();
  Object.defineProperty(globalThis, 'localStorage', { value: storage, writable: true, configurable: true });
  return storage;
};

const stats = {
  ...DEFAULT_STATS,
  currentStreak: 4,
  longestStreak: 8,
  bestTimedScore: 12,
  personalBestScore: 10,
  lastSessionScore: 50,
  lastSessionDate: 'old',
  totalProblemsAttempted: 20,
  totalSessions: 2,
};

const entry = (n: number) => ({
  storageKey: `s${n}`,
  label: `S ${n}`,
  correct: n,
  total: n + 1,
  score: 50,
  durationSeconds: 60,
  isTimed: true,
  timestamp: `t${n}`,
});

type Fixture = { name: string; amount: number };
const fixtureAdapter = createVersionedRecordAdapter<Fixture>(
  (value): value is Fixture => typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
    && typeof (value as Record<string, unknown>).name === 'string'
    && typeof (value as Record<string, unknown>).amount === 'number'
    && Number.isFinite((value as Record<string, unknown>).amount),
);

export const tests = [
  test('storage key constants and valid legacy stats round trip unchanged', () => {
    setup();
    assert.equal(MODE_PREF_KEY, 'mp_mode_pref');
    assert.equal(DURATION_PREF_KEY, 'mp_duration_pref');
    saveStats('x', stats);
    assert.deepEqual(loadStats('x'), stats);
  }),
  test('missing, malformed, and wrong-container stats return defaults', () => {
    const storage = setup();
    assert.deepEqual(loadStats('none'), DEFAULT_STATS);
    for (const [key, value] of [['bad', '{'], ['null', 'null'], ['array', '[]'], ['string', '"stats"'], ['number', '4']] as const) {
      storage.setItem(`mp_stats_${key}`, value);
      assert.deepEqual(loadStats(key), DEFAULT_STATS);
    }
  }),
  test('partial legacy stats default missing fields and preserve valid zero and decimals', () => {
    const storage = setup();
    storage.setItem('mp_stats_partial', JSON.stringify({ currentStreak: 3, lastSessionScore: 87.5, totalSessions: 0 }));
    assert.deepEqual(loadStats('partial'), { ...DEFAULT_STATS, currentStreak: 3, lastSessionScore: 87.5, totalSessions: 0 });
  }),
  test('invalid legacy stat field types and impossible numbers reject the record', () => {
    const storage = setup();
    const invalid = [
      { totalSessions: '12' },
      { totalSessions: -1 },
      { totalSessions: null }, // JSON representations of NaN and Infinity are null.
      { bestTimedScore: { value: 12 } },
      { lastSessionScore: 101 },
      { lastSessionDate: 42 },
    ];
    invalid.forEach((value, index) => {
      storage.setItem(`mp_stats_invalid${index}`, JSON.stringify(value));
      assert.deepEqual(loadStats(`invalid${index}`), DEFAULT_STATS);
    });
    storage.setItem('mp_stats_infinity', '{"bestTimedScore":1e400}');
    assert.deepEqual(loadStats('infinity'), DEFAULT_STATS);
    storage.setItem('mp_stats_nan', '{"bestTimedScore":NaN}');
    assert.deepEqual(loadStats('nan'), DEFAULT_STATS);
  }),
  test('individual reset helpers preserve their scopes', () => {
    setup();
    saveStats('x', stats);
    resetCurrentStreak('x');
    assert.equal(loadStats('x').currentStreak, 0);
    assert.equal(loadStats('x').longestStreak, 8);
    resetLongestStreak('x');
    assert.equal(loadStats('x').longestStreak, 0);
    resetPersonalBestScore('x');
    assert.equal(loadStats('x').personalBestScore, 0);
    assert.equal(loadStats('x').bestTimedScore, 0);
    clearStats('x');
    assert.deepEqual(loadStats('x'), DEFAULT_STATS);
  }),
  test('timed and untimed session updates preserve current score and best semantics', () => {
    setup();
    const result = { correct: 8, total: 10, durationSeconds: 30, score: 80, timestamp: 'x' };
    const timed = updateStatsAfterSession(stats, result, true);
    assert.deepEqual([timed.bestTimedScore, timed.personalBestScore, timed.lastSessionScore, timed.totalProblemsAttempted, timed.totalSessions], [16, 10, 80, 30, 3]);
    const untimed = updateStatsAfterSession(stats, result, false);
    assert.deepEqual([untimed.bestTimedScore, untimed.personalBestScore], [12, 10]);
    assert.deepEqual([untimed.currentStreak, untimed.longestStreak], [4, 8]);
  }),
  test('untimed answer updates can suppress only streak persistence', () => {
    const sharedCorrect = updateStatsAfterUntimedAnswer(stats, true, false);
    const sharedWrong = updateStatsAfterUntimedAnswer(sharedCorrect, false, false);
    assert.deepEqual([sharedWrong.currentStreak, sharedWrong.longestStreak], [stats.currentStreak, stats.longestStreak]);
    assert.equal(sharedWrong.totalProblemsAttempted, stats.totalProblemsAttempted + 2);
    assert.ok(sharedWrong.lastSessionDate.length > 0);
    const canonicalCorrect = updateStatsAfterUntimedAnswer(stats, true);
    assert.deepEqual([canonicalCorrect.currentStreak, canonicalCorrect.longestStreak], [stats.currentStreak + 1, stats.longestStreak]);
    const canonicalWrong = updateStatsAfterUntimedAnswer(canonicalCorrect, false);
    assert.equal(canonicalWrong.currentStreak, 0);
  }),
  test('session log preserves valid entries in order and filters malformed entries', () => {
    const storage = setup();
    storage.setItem('mp_session_log', JSON.stringify([entry(1), null, { ...entry(2), score: '50' }, entry(3)]));
    assert.deepEqual(loadSessionLog(), [entry(1), entry(3)]);
  }),
  test('session log rejects malformed containers and non-finite or negative fields', () => {
    const storage = setup();
    for (const value of ['{}', 'null', '"log"']) {
      storage.setItem('mp_session_log', value);
      assert.deepEqual(loadSessionLog(), []);
    }
    storage.setItem('mp_session_log', JSON.stringify([{ ...entry(1), correct: -1 }, { ...entry(2), durationSeconds: null }, { ...entry(3), score: 101 }, { ...entry(4), correct: 6, total: 5 }]));
    assert.deepEqual(loadSessionLog(), []);
    storage.setItem('mp_session_log', `[{"storageKey":"s","label":"S","correct":1e400,"total":2,"score":50,"durationSeconds":60,"isTimed":true,"timestamp":"t"}]`);
    assert.deepEqual(loadSessionLog(), []);
  }),
  test('session log appends in order and retains the latest fifty', () => {
    setup();
    for (let i = 0; i < 55; i++) appendSessionLog(entry(i));
    const log = loadSessionLog();
    assert.equal(log.length, 50);
    assert.equal(log[0].storageKey, 's5');
    assert.equal(log[49].storageKey, 's54');
  }),
  test('clear all removes only stats and session log, preserving preferences and unrelated data', () => {
    const storage = setup();
    storage.setItem('mp_stats_a', '{}');
    storage.setItem('mp_session_log', '[]');
    storage.setItem(MODE_PREF_KEY, 'timed');
    storage.setItem(DURATION_PREF_KEY, '120');
    storage.setItem('other', 'yes');
    clearAllProgress();
    assert.equal(storage.getItem('mp_stats_a'), null);
    assert.equal(storage.getItem('mp_session_log'), null);
    assert.equal(storage.getItem(MODE_PREF_KEY), 'timed');
    assert.equal(storage.getItem(DURATION_PREF_KEY), '120');
    assert.equal(storage.getItem('other'), 'yes');
  }),
  test('storage read, write, quota, and SSR-like exceptions are swallowed', () => {
    setup();
    Object.defineProperty(globalThis, 'localStorage', {
      value: { getItem() { throw Error('blocked'); }, setItem() { throw Error('quota'); }, removeItem() { throw Error('blocked'); }, get length() { throw Error('blocked'); }, key() { return null; } },
      configurable: true,
    });
    assert.deepEqual(loadStats('x'), DEFAULT_STATS);
    assert.doesNotThrow(() => saveStats('x', stats));
    assert.doesNotThrow(() => clearStats('x'));
    assert.doesNotThrow(clearAllProgress);
    assert.deepEqual(loadSessionLog(), []);
    assert.doesNotThrow(() => appendSessionLog(entry(1)));
    delete (globalThis as { localStorage?: Storage }).localStorage;
    assert.deepEqual(loadStats('x'), DEFAULT_STATS);
    assert.doesNotThrow(() => saveStats('x', stats));
  }),
  test('versioned adapter accepts version one and always writes the supported envelope', () => {
    const storage = setup();
    assert.equal(VERSIONED_RECORD_VERSION, 1);
    storage.setItem('fixture', JSON.stringify({ version: 1, data: { name: 'Ada', amount: 2.5 } }));
    assert.deepEqual(fixtureAdapter.read('fixture'), { name: 'Ada', amount: 2.5 });
    fixtureAdapter.write('fixture', { name: 'Grace', amount: 0 });
    assert.deepEqual(JSON.parse(storage.getItem('fixture')!), { version: 1, data: { name: 'Grace', amount: 0 } });
  }),
  test('versioned adapter rejects missing, future, and malformed records without throwing', () => {
    const storage = setup();
    const values: unknown[] = [null, 'text', 3, [], {}, { data: { name: 'Ada', amount: 1 } }, { version: 99, data: { name: 'Ada', amount: 1 } }, { version: 1, data: { name: 'Ada', amount: '1' } }];
    values.forEach((value) => {
      storage.setItem('fixture', JSON.stringify(value));
      assert.equal(fixtureAdapter.read('fixture'), undefined);
    });
    storage.setItem('fixture', '{');
    assert.equal(fixtureAdapter.read('fixture'), undefined);
    const hostile = createVersionedRecordAdapter<Fixture>((_value): _value is Fixture => { throw Error('hostile validator'); });
    assert.doesNotThrow(() => hostile.read('fixture'));
    assert.doesNotThrow(() => hostile.write('fixture', { name: 'Ada', amount: 1 }));
  }),
  test('versioned adapter does not persist invalid or unserializable data', () => {
    const storage = setup();
    fixtureAdapter.write('fixture', { name: 'Ada', amount: Number.NaN });
    assert.equal(storage.getItem('fixture'), null);
    const circular: { name: string; amount: number; self?: unknown } = { name: 'Ada', amount: 1 };
    circular.self = circular;
    assert.doesNotThrow(() => fixtureAdapter.write('fixture', circular));
    assert.equal(storage.getItem('fixture'), null);
  }),
];
