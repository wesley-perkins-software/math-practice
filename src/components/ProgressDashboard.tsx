import { useEffect, useState } from 'react';
import { ALL_PRESETS } from '@/engine/presets';
import { loadStats, loadSessionLog, DEFAULT_STATS } from '@/engine/storage';
import type { PageStats, SessionLogEntry } from '@/engine/types';
import type { Operation } from '@/engine/types';

interface PresetRow {
  storageKey: string;
  label: string;
  path?: string;
  operation: Operation;
  isTimed: boolean;
  stats: PageStats;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeDate(isoDate: string): string {
  if (!isoDate) return '—';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(isoDate);
  d.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return '1 month ago';
  return `${Math.floor(diffDays / 30)} months ago`;
}

function relativeTimestamp(isoTimestamp: string): string {
  const now = Date.now();
  const t = new Date(isoTimestamp).getTime();
  const diffMs = now - t;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 2) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return relativeDate(isoTimestamp.slice(0, 10));
}

const OPERATION_GROUPS: { key: Operation; label: string; color: string }[] = [
  { key: 'addition', label: 'Addition', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { key: 'subtraction', label: 'Subtraction', color: 'text-sky-700 bg-sky-50 border-sky-200' },
  { key: 'multiplication', label: 'Multiplication', color: 'text-violet-700 bg-violet-50 border-violet-200' },
  { key: 'division', label: 'Division', color: 'text-orange-700 bg-orange-50 border-orange-200' },
  { key: 'mixed', label: 'Mixed & Speed', color: 'text-rose-700 bg-rose-50 border-rose-200' },
];

// ─── Achievement definitions ──────────────────────────────────────────────────

interface Achievement {
  id: string;
  label: string;
  description: string;
  check: (data: { totalProblems: number; totalSessions: number; bestSpeed: number; longestStreak: number; operationsPracticed: Set<Operation> }) => boolean;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-session',
    label: 'First Steps',
    description: 'Complete your first session',
    check: ({ totalSessions }) => totalSessions >= 1,
  },
  {
    id: 'consistent',
    label: 'Consistent Learner',
    description: 'Complete 5 sessions',
    check: ({ totalSessions }) => totalSessions >= 5,
  },
  {
    id: 'problem-solver',
    label: 'Problem Solver',
    description: 'Solve 100 problems',
    check: ({ totalProblems }) => totalProblems >= 100,
  },
  {
    id: 'math-machine',
    label: 'Math Machine',
    description: 'Solve 500 problems',
    check: ({ totalProblems }) => totalProblems >= 500,
  },
  {
    id: 'speed-racer',
    label: 'Speed Racer',
    description: 'Score on a timed drill',
    check: ({ bestSpeed }) => bestSpeed > 0,
  },
  {
    id: 'streak-starter',
    label: 'Streak Starter',
    description: 'Reach a 10-answer streak',
    check: ({ longestStreak }) => longestStreak >= 10,
  },
  {
    id: 'streak-champion',
    label: 'Streak Champion',
    description: 'Reach a 25-answer streak',
    check: ({ longestStreak }) => longestStreak >= 25,
  },
  {
    id: 'well-rounded',
    label: 'Well-Rounded',
    description: 'Practice all 4 operations',
    check: ({ operationsPracticed }) =>
      operationsPracticed.has('addition') &&
      operationsPracticed.has('subtraction') &&
      operationsPracticed.has('multiplication') &&
      operationsPracticed.has('division'),
  },
];

// ─── Components ──────────────────────────────────────────────────────────────

interface HeroCardProps {
  label: string;
  value: string;
  sub?: string;
}

function HeroCard({ label, value, sub }: HeroCardProps) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 text-center">
      <div className="text-2xl font-bold text-[#1E293B]">{value}</div>
      {sub && <div className="text-[10px] text-[#94A3B8] uppercase tracking-wide font-medium mt-0.5">{sub}</div>}
      <div className="text-xs text-[#64748B] mt-1">{label}</div>
    </div>
  );
}

interface AchievementBadgeProps {
  achievement: Achievement;
  earned: boolean;
}

function AchievementBadge({ achievement, earned }: AchievementBadgeProps) {
  return (
    <div
      title={achievement.description}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
        earned
          ? 'bg-[#4F46E5] text-white border-[#4338CA] shadow-sm'
          : 'bg-white text-[#CBD5E1] border-[#E2E8F0]'
      }`}
    >
      {achievement.label}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProgressDashboard() {
  const [rows, setRows] = useState<PresetRow[]>([]);
  const [sessionLog, setSessionLog] = useState<SessionLogEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const data = ALL_PRESETS.map((preset) => ({
      storageKey: preset.storageKey,
      label: preset.label ?? preset.storageKey,
      path: preset.path,
      operation: preset.operation,
      isTimed: preset.mode === 'timed',
      stats: loadStats(preset.storageKey),
    }));
    setRows(data);
    setSessionLog(loadSessionLog());
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  const practiced = rows.filter((r) => r.stats.totalSessions > 0);

  if (practiced.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">📊</div>
        <p className="text-[#1E293B] font-semibold text-lg">No practice data yet</p>
        <p className="text-[#64748B] mt-2 text-sm">Complete a session on any practice page to see your stats here.</p>
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-sm mx-auto">
          {[
            { label: 'Addition', href: '/addition', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            { label: 'Subtraction', href: '/subtraction', color: 'bg-sky-50 text-sky-700 border-sky-200' },
            { label: 'Multiplication', href: '/multiplication', color: 'bg-violet-50 text-violet-700 border-violet-200' },
            { label: 'Division', href: '/division/facts', color: 'bg-orange-50 text-orange-700 border-orange-200' },
          ].map((op) => (
            <a
              key={op.href}
              href={op.href}
              className={`border rounded-xl p-3 text-center text-xs font-semibold transition-all hover:shadow-sm ${op.color}`}
            >
              {op.label}
            </a>
          ))}
        </div>
      </div>
    );
  }

  // ── Aggregate stats ─────────────────────────────────────────────────────────
  const totalProblems = practiced.reduce((s, r) => s + r.stats.totalProblemsAttempted, 0);
  const totalSessions = practiced.reduce((s, r) => s + r.stats.totalSessions, 0);
  const bestSpeed = practiced.reduce((m, r) => Math.max(m, r.stats.bestTimedScore), 0);
  const longestStreak = practiced.reduce((m, r) => Math.max(m, r.stats.longestStreak), 0);

  // Days active: count unique lastSessionDate values
  const uniqueDates = new Set(practiced.map((r) => r.stats.lastSessionDate).filter(Boolean));
  const daysActive = uniqueDates.size;

  // Avg accuracy: weighted by sessions per practice type
  const totalWeightedScore = practiced.reduce((s, r) => s + r.stats.lastSessionScore * r.stats.totalSessions, 0);
  const avgAccuracy = totalSessions > 0 ? Math.round(totalWeightedScore / totalSessions) : 0;

  // Operations practiced (for achievements + grouping)
  const operationsPracticed = new Set<Operation>(practiced.map((r) => r.operation));

  // ── Achievements ────────────────────────────────────────────────────────────
  const achievementData = { totalProblems, totalSessions, bestSpeed, longestStreak, operationsPracticed };

  // ── Recent sessions ─────────────────────────────────────────────────────────
  const recentSessions = [...sessionLog].reverse().slice(0, 6);

  return (
    <div className="space-y-8">

      {/* ── Hero stats ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <HeroCard label="Total Problems" value={totalProblems.toLocaleString()} />
        <HeroCard label="Total Sessions" value={totalSessions.toLocaleString()} />
        <HeroCard
          label="Best Speed"
          value={bestSpeed > 0 ? `${bestSpeed}/min` : '—'}
          sub={bestSpeed > 0 ? 'timed drills' : undefined}
        />
        <HeroCard label="Longest Streak" value={longestStreak > 0 ? longestStreak.toLocaleString() : '—'} sub={longestStreak > 0 ? 'in a row' : undefined} />
        <HeroCard label="Days Active" value={daysActive.toLocaleString()} />
        <HeroCard label="Avg Accuracy" value={avgAccuracy > 0 ? `${avgAccuracy}%` : '—'} sub={avgAccuracy > 0 ? 'last session each' : undefined} />
      </div>

      {/* ── Achievements ─────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-[#1E293B] mb-3">Achievements</h2>
        <div className="flex flex-wrap gap-2">
          {ACHIEVEMENTS.map((a) => (
            <AchievementBadge key={a.id} achievement={a} earned={a.check(achievementData)} />
          ))}
        </div>
      </div>

      {/* ── Per-operation grouped practice table ─────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-[#1E293B] mb-3">By Practice Type</h2>
        <div className="space-y-4">
          {OPERATION_GROUPS.map(({ key, label, color }) => {
            const group = practiced.filter((r) => r.operation === key);
            if (group.length === 0) return null;
            return (
              <div key={key} className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                <div className={`px-4 py-2 border-b border-[#E2E8F0] flex items-center gap-2`}>
                  <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${color}`}>
                    {label}
                  </span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                      <th className="text-left px-4 py-2.5 text-[#64748B] font-medium">Practice</th>
                      <th className="text-right px-3 py-2.5 text-[#64748B] font-medium hidden sm:table-cell">Last Practiced</th>
                      <th className="text-right px-3 py-2.5 text-[#64748B] font-medium">Sessions</th>
                      <th className="text-right px-3 py-2.5 text-[#64748B] font-medium">Problems</th>
                      <th className="text-right px-3 py-2.5 text-[#64748B] font-medium hidden md:table-cell">Accuracy</th>
                      <th className="text-right px-3 py-2.5 text-[#64748B] font-medium hidden sm:table-cell">
                        {key === 'mixed' ? 'Best Speed' : 'Longest Streak'}
                      </th>
                      <th className="px-3 py-2.5 hidden sm:table-cell" />
                    </tr>
                  </thead>
                  <tbody>
                    {group.map((row, i) => (
                      <tr
                        key={row.storageKey}
                        className={i < group.length - 1 ? 'border-b border-[#E2E8F0]' : ''}
                      >
                        <td className="px-4 py-3 text-[#1E293B] font-medium">{row.label}</td>
                        <td className="px-3 py-3 text-right text-[#64748B] hidden sm:table-cell">
                          {relativeDate(row.stats.lastSessionDate)}
                        </td>
                        <td className="px-3 py-3 text-right text-[#64748B]">{row.stats.totalSessions}</td>
                        <td className="px-3 py-3 text-right text-[#64748B]">{row.stats.totalProblemsAttempted}</td>
                        <td className="px-3 py-3 text-right text-[#64748B] hidden md:table-cell">
                          {row.stats.lastSessionScore > 0 ? `${row.stats.lastSessionScore}%` : '—'}
                        </td>
                        <td className="px-3 py-3 text-right text-[#64748B] hidden sm:table-cell">
                          {row.isTimed
                            ? (row.stats.bestTimedScore > 0 ? `${row.stats.bestTimedScore}/min` : '—')
                            : (row.stats.longestStreak > 0 ? row.stats.longestStreak : '—')}
                        </td>
                        <td className="px-3 py-3 hidden sm:table-cell">
                          {row.path && (
                            <a
                              href={row.path}
                              className="text-xs text-[#4F46E5] hover:text-[#3730A3] font-medium transition-colors whitespace-nowrap"
                            >
                              Practice →
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Recent sessions ──────────────────────────────────────────────────── */}
      {recentSessions.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-[#1E293B] mb-3">Recent Sessions</h2>
          <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left px-4 py-2.5 text-[#64748B] font-medium">Practice</th>
                  <th className="text-right px-4 py-2.5 text-[#64748B] font-medium hidden sm:table-cell">When</th>
                  <th className="text-right px-4 py-2.5 text-[#64748B] font-medium">Result</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.map((entry, i) => {
                  const isGood = entry.score >= 80;
                  const isMid = entry.score >= 60 && entry.score < 80;
                  const scoreColor = isGood
                    ? 'text-emerald-600'
                    : isMid
                    ? 'text-amber-600'
                    : 'text-red-500';
                  return (
                    <tr key={i} className={i < recentSessions.length - 1 ? 'border-b border-[#E2E8F0]' : ''}>
                      <td className="px-4 py-3 text-[#1E293B] font-medium">{entry.label}</td>
                      <td className="px-4 py-3 text-right text-[#64748B] hidden sm:table-cell">
                        {relativeTimestamp(entry.timestamp)}
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${scoreColor}`}>
                        {entry.isTimed
                          ? `${entry.correct} correct`
                          : `${entry.score}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
