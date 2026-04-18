import type { PageStats, SessionResult, SessionLogEntry } from './types';
import { calculateTimedScore, calculateSessionScore } from './scorer';

const NAMESPACE = 'mp_stats_';
export const MODE_PREF_KEY = 'mp_mode_pref';
export const DURATION_PREF_KEY = 'mp_duration_pref';

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
  try {
    const raw = localStorage.getItem(storageKey(key));
    if (!raw) return { ...DEFAULT_STATS };
    return { ...DEFAULT_STATS, ...JSON.parse(raw) } as PageStats;
  } catch {
    return { ...DEFAULT_STATS };
  }
}

export function saveStats(key: string, stats: PageStats): void {
  try {
    localStorage.setItem(storageKey(key), JSON.stringify(stats));
  } catch {
    // Private browsing or storage full — silently ignore
  }
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
  try {
    const raw = localStorage.getItem(SESSION_LOG_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SessionLogEntry[];
  } catch {
    return [];
  }
}

export function appendSessionLog(entry: SessionLogEntry): void {
  try {
    const log = loadSessionLog();
    log.push(entry);
    // Keep only the most recent SESSION_LOG_MAX entries
    const trimmed = log.length > SESSION_LOG_MAX ? log.slice(log.length - SESSION_LOG_MAX) : log;
    localStorage.setItem(SESSION_LOG_KEY, JSON.stringify(trimmed));
  } catch {
    // Private browsing or storage full — silently ignore
  }
}
