import type { PageStats, SessionResult, SessionLogEntry } from './types';
import { calculateTimedScore, calculateSessionScore } from './scorer';

const NAMESPACE = 'mp_stats_';
export const MODE_PREF_KEY = 'mp_mode_pref';
export const DURATION_PREF_KEY = 'mp_duration_pref';

type Validator<T> = (value: unknown) => value is T;

function safeReadJson(key: string): unknown | undefined {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? undefined : JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
}

function safeWriteJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be unavailable or full, and values may not be serializable.
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonNegativeFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/** New persisted record types should use this adapter; legacy keys remain unwrapped. */
export const VERSIONED_RECORD_VERSION = 1 as const;

export function createVersionedRecordAdapter<T>(validateData: Validator<T>) {
  return {
    read(key: string): T | undefined {
      const value = safeReadJson(key);
      try {
        if (!isRecord(value) || value.version !== VERSIONED_RECORD_VERSION || !('data' in value)) return undefined;
        return validateData(value.data) ? value.data : undefined;
      } catch {
        return undefined;
      }
    },
    write(key: string, data: T): void {
      try {
        if (!validateData(data)) return;
        safeWriteJson(key, { version: VERSIONED_RECORD_VERSION, data });
      } catch {
        // A validator supplied for a future record must not make storage fatal.
      }
    },
  };
}

export const DEFAULT_STATS: PageStats = {
  currentStreak: 0,
  longestStreak: 0,
  bestTimedScore: 0,
  personalBestScore: 0,
  lastSessionScore: 0,
  lastSessionDate: '',
  totalProblemsAttempted: 0,
  totalSessions: 0,
};

function storageKey(key: string): string {
  return `${NAMESPACE}${key}`;
}

export function loadStats(key: string): PageStats {
  const value = safeReadJson(storageKey(key));
  if (!isRecord(value)) return { ...DEFAULT_STATS };

  const stats = { ...DEFAULT_STATS };
  for (const field of Object.keys(DEFAULT_STATS) as (keyof PageStats)[]) {
    if (!(field in value)) continue;
    const fieldValue = value[field];
    if (field === 'lastSessionDate') {
      if (typeof fieldValue !== 'string') return { ...DEFAULT_STATS };
    } else if (!isNonNegativeFiniteNumber(fieldValue)) {
      return { ...DEFAULT_STATS };
    } else if (field === 'lastSessionScore' && fieldValue > 100) {
      return { ...DEFAULT_STATS };
    }
    // The field checks above narrow each runtime value to its legacy field type.
    (stats as unknown as Record<keyof PageStats, string | number>)[field] = fieldValue;
  }
  return stats;
}

export function saveStats(key: string, stats: PageStats): void {
  safeWriteJson(storageKey(key), stats);
}

export function clearStats(key: string): void {
  try {
    localStorage.removeItem(storageKey(key));
  } catch {
    // ignore
  }
}

export function clearAllProgress(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(NAMESPACE)) keysToRemove.push(k);
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    localStorage.removeItem(SESSION_LOG_KEY);
  } catch {
    // ignore
  }
}

export function updateStatsAfterSession(
  existing: PageStats,
  result: SessionResult,
  isTimed: boolean,
): PageStats {
  const sessionScore = calculateSessionScore(result.correct, result.total);
  const timedScore = isTimed ? calculateTimedScore(result.correct, result.durationSeconds) : 0;

  // Streak is updated per-answer in PracticeWidget — preserve existing values here.
  return {
    currentStreak: existing.currentStreak,
    longestStreak: existing.longestStreak,
    bestTimedScore: Math.max(existing.bestTimedScore, timedScore),
    personalBestScore: isTimed ? Math.max(existing.personalBestScore, result.correct) : existing.personalBestScore,
    lastSessionScore: sessionScore,
    lastSessionDate: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })(),
    totalProblemsAttempted: existing.totalProblemsAttempted + result.total,
    totalSessions: existing.totalSessions + 1,
  };
}

/** Records an untimed answer while optionally preserving canonical streak state. */
export function updateStatsAfterUntimedAnswer(
  existing: PageStats,
  isCorrect: boolean,
  trackStreaks = true,
): PageStats {
  const currentStreak = trackStreaks ? (isCorrect ? existing.currentStreak + 1 : 0) : existing.currentStreak;
  return {
    ...existing,
    currentStreak,
    longestStreak: trackStreaks ? Math.max(existing.longestStreak, currentStreak) : existing.longestStreak,
    totalProblemsAttempted: existing.totalProblemsAttempted + 1,
    lastSessionDate: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })(),
  };
}

export function resetCurrentStreak(key: string): void {
  const stats = loadStats(key);
  saveStats(key, { ...stats, currentStreak: 0 });
}

export function resetLongestStreak(key: string): void {
  const stats = loadStats(key);
  saveStats(key, { ...stats, longestStreak: 0 });
}

export function resetPersonalBestScore(key: string): void {
  const stats = loadStats(key);
  saveStats(key, { ...stats, personalBestScore: 0, bestTimedScore: 0 });
}

// ─── Session Log ─────────────────────────────────────────────────────────────

const SESSION_LOG_KEY = 'mp_session_log';
const SESSION_LOG_MAX = 50;

export function loadSessionLog(): SessionLogEntry[] {
  const value = safeReadJson(SESSION_LOG_KEY);
  if (!Array.isArray(value)) return [];
  // Preserve valid entries and their order rather than discarding an entire log.
  return value.filter(isSessionLogEntry);
}

function isSessionLogEntry(value: unknown): value is SessionLogEntry {
  if (!isRecord(value)) return false;
  if (!(typeof value.storageKey === 'string'
    && typeof value.label === 'string'
    && isNonNegativeFiniteNumber(value.correct)
    && isNonNegativeFiniteNumber(value.total)
    && isNonNegativeFiniteNumber(value.score)
    && isNonNegativeFiniteNumber(value.durationSeconds)
    && typeof value.isTimed === 'boolean'
    && typeof value.timestamp === 'string')) return false;
  return value.correct <= value.total && value.score <= 100;
}

export function appendSessionLog(entry: SessionLogEntry): void {
  const log = loadSessionLog();
  log.push(entry);
  // Keep only the most recent SESSION_LOG_MAX entries
  const trimmed = log.length > SESSION_LOG_MAX ? log.slice(log.length - SESSION_LOG_MAX) : log;
  safeWriteJson(SESSION_LOG_KEY, trimmed);
}
