import type { PageStats, SessionResult } from './types';
import { calculateTimedScore, calculateSessionScore } from './scorer';

const NAMESPACE = 'mp_stats_';
export const MODE_PREF_KEY = 'mp_mode_pref';
export const DURATION_PREF_KEY = 'mp_duration_pref';

export const DEFAULT_STATS: PageStats = {
  currentStreak: 0,
  longestStreak: 0,
  bestTimedScore: 0,
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

export function updateStatsAfterSession(
  existing: PageStats,
  result: SessionResult,
  isTimed: boolean,
): PageStats {
  const sessionScore = calculateSessionScore(result.correct, result.total);
  const timedScore = isTimed ? calculateTimedScore(result.correct, result.durationSeconds) : 0;

  // Streak: add correct answers from this session to current streak
  const newCurrentStreak = existing.currentStreak + result.correct;
  const newLongestStreak = Math.max(existing.longestStreak, newCurrentStreak);

  return {
    currentStreak: newCurrentStreak,
    longestStreak: newLongestStreak,
    bestTimedScore: Math.max(existing.bestTimedScore, timedScore),
    lastSessionScore: sessionScore,
    lastSessionDate: new Date().toISOString().slice(0, 10),
    totalProblemsAttempted: existing.totalProblemsAttempted + result.total,
    totalSessions: existing.totalSessions + 1,
  };
}

export function resetCurrentStreak(key: string): void {
  const stats = loadStats(key);
  saveStats(key, { ...stats, currentStreak: 0 });
}
