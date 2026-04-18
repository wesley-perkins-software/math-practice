import { useEffect, useState } from 'react';
import { ALL_PRESETS } from '@/engine/presets';
import { loadStats, loadSessionLog, DEFAULT_STATS, clearAllProgress } from '@/engine/storage';
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

function localDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function relativeDate(isoDate: string): string {
  if (!isoDate) return '—';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Parse as local midnight to avoid UTC-shift bug
  const [y, m, day] = isoDate.split('-').map(Number);
  const d = new Date(y, m - 1, day);
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
  { key: 'mixed', label: 'Speed Drills', color: 'text-rose-700 bg-rose-50 border-rose-200' },
];

// ─── Achievement definitions ──────────────────────────────────────────────────

interface AchievementDef {
  id: string;
  label: string;
  description: string;
  check: (data: AchievementData) => boolean;
  /** Returns 0–1 progress ratio for unearned achievements (used for "Next Achievement" hint) */
  progress?: (data: AchievementData) => number;
}

interface AchievementData {
  totalProblems: number;
  totalSessions: number;
  longestStreak: number;
  operationsPracticed: Set<Operation>;
}

// Ordered easiest → hardest
const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-session',
    label: 'First Steps',
    description: 'Complete your first session',
    check: ({ totalSessions }) => totalSessions >= 1,
    progress: ({ totalSessions }) => Math.min(1, totalSessions / 1),
  },
  {
    id: 'speed-racer',
    label: 'Speed Racer',
    description: 'Complete a timed drill',
    check: ({ totalSessions }) => totalSessions >= 1,
  },
  {
    id: 'problem-solver',
    label: 'Problem Solver',
    description: 'Solve 100 problems',
    check: ({ totalProblems }) => totalProblems >= 100,
    progress: ({ totalProblems }) => Math.min(1, totalProblems / 100),
  },
  {
    id: 'streak-starter',
    label: 'Streak Starter',
    description: 'Reach a 10-answer streak',
    check: ({ longestStreak }) => longestStreak >= 10,
    progress: ({ longestStreak }) => Math.min(1, longestStreak / 10),
  },
  {
    id: 'consistent',
    label: 'Consistent Learner',
    description: 'Complete 5 sessions',
    check: ({ totalSessions }) => totalSessions >= 5,
    progress: ({ totalSessions }) => Math.min(1, totalSessions / 5),
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
    progress: ({ operationsPracticed }) => {
      const ops: Operation[] = ['addition', 'subtraction', 'multiplication', 'division'];
      return ops.filter((o) => operationsPracticed.has(o)).length / 4;
    },
  },
  {
    id: 'math-machine',
    label: 'Math Machine',
    description: 'Solve 500 problems',
    check: ({ totalProblems }) => totalProblems >= 500,
    progress: ({ totalProblems }) => Math.min(1, totalProblems / 500),
  },
  {
    id: 'streak-champion',
    label: 'Streak Champion',
    description: 'Reach a 25-answer streak',
    check: ({ longestStreak }) => longestStreak >= 25,
    progress: ({ longestStreak }) => Math.min(1, longestStreak / 25),
  },
  {
    id: 'dedicated-student',
    label: 'Dedicated Student',
    description: 'Complete 25 sessions',
    check: ({ totalSessions }) => totalSessions >= 25,
    progress: ({ totalSessions }) => Math.min(1, totalSessions / 25),
  },
  {
    id: 'math-whiz',
    label: 'Math Whiz',
    description: 'Solve 1,000 problems',
    check: ({ totalProblems }) => totalProblems >= 1000,
    progress: ({ totalProblems }) => Math.min(1, totalProblems / 1000),
  },
  {
    id: 'streak-master',
    label: 'Streak Master',
    description: 'Reach a 50-answer streak',
    check: ({ longestStreak }) => longestStreak >= 50,
    progress: ({ longestStreak }) => Math.min(1, longestStreak / 50),
  },
  {
    id: 'math-scholar',
    label: 'Math Scholar',
    description: 'Complete 100 sessions',
    check: ({ totalSessions }) => totalSessions >= 100,
    progress: ({ totalSessions }) => Math.min(1, totalSessions / 100),
  },
  {
    id: 'math-titan',
    label: 'Math Titan',
    description: 'Solve 2,500 problems',
    check: ({ totalProblems }) => totalProblems >= 2500,
    progress: ({ totalProblems }) => Math.min(1, totalProblems / 2500),
  },
  {
    id: 'unstoppable',
    label: 'Unstoppable',
    description: 'Reach a 100-answer streak',
    check: ({ longestStreak }) => longestStreak >= 100,
    progress: ({ longestStreak }) => Math.min(1, longestStreak / 100),
  },
  {
    id: 'math-juggernaut',
    label: 'Math Juggernaut',
    description: 'Solve 5,000 problems',
    check: ({ totalProblems }) => totalProblems >= 5000,
    progress: ({ totalProblems }) => Math.min(1, totalProblems / 5000),
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
  achievement: AchievementDef;
  earned: boolean;
}

function AchievementBadge({ achievement, earned }: AchievementBadgeProps) {
  return (
    <div
      className={`rounded-xl border p-3 text-left transition-all ${
        earned
          ? 'bg-[#4F46E5] border-[#4338CA] shadow-sm'
          : 'bg-[#F8FAFC] border-[#E2E8F0]'
      }`}
    >
      <div className={`text-xs font-bold leading-snug ${earned ? 'text-white' : 'text-[#475569]'}`}>
        {achievement.label}
      </div>
      <div className={`text-[11px] mt-0.5 leading-snug ${earned ? 'text-[#C7D2FE]' : 'text-[#94A3B8]'}`}>
        {achievement.description}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProgressDashboard() {
  const [rows, setRows] = useState<PresetRow[]>([]);
  const [sessionLog, setSessionLog] = useState<SessionLogEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

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

  if (!loaded) return <div className="min-h-[500px] rounded-xl" />;

  const practiced = rows.filter((r) => r.stats.totalProblemsAttempted > 0 || r.stats.totalSessions > 0);

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
  const longestStreak = practiced.reduce((m, r) => Math.max(m, r.stats.longestStreak), 0);

  // Days active: count unique lastSessionDate values
  const uniqueDates = new Set(practiced.map((r) => r.stats.lastSessionDate).filter(Boolean));
  const daysActive = uniqueDates.size;

  // Operations practiced (for achievements + grouping)
  const operationsPracticed = new Set<Operation>(practiced.map((r) => r.operation));

  // ── Today's Stats ───────────────────────────────────────────────────────────
  const todayStr = localDateString();
  const todayLog = sessionLog.filter((e) => e.timestamp.slice(0, 10) === todayStr);
  const todayProblems = todayLog.reduce((s, e) => s + e.total, 0);
  const currentStreakToday = practiced.reduce((m, r) => Math.max(m, r.stats.currentStreak), 0);

  // ── Achievements ────────────────────────────────────────────────────────────
  const achievementData: AchievementData = { totalProblems, totalSessions, longestStreak, operationsPracticed };
  const earnedIds = new Set(ACHIEVEMENTS.filter((a) => a.check(achievementData)).map((a) => a.id));

  // Next achievements: unearned with progress >= 10%, sorted by closest to completion
  const nextAchievements = ACHIEVEMENTS
    .filter((a) => !earnedIds.has(a.id) && a.progress)
    .map((a) => ({ achievement: a, ratio: a.progress!(achievementData) }))
    .filter(({ ratio }) => ratio >= 0.1)
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 2);

  // ── Operations Strength ─────────────────────────────────────────────────────
  const OP_KEYS: { key: Operation; label: string; color: string }[] = [
    { key: 'addition', label: 'Addition', color: 'bg-emerald-500' },
    { key: 'subtraction', label: 'Subtraction', color: 'bg-sky-500' },
    { key: 'multiplication', label: 'Multiplication', color: 'bg-violet-500' },
    { key: 'division', label: 'Division', color: 'bg-orange-500' },
  ];
  const opTotals = OP_KEYS.map(({ key }) =>
    practiced.filter((r) => r.operation === key).reduce((s, r) => s + r.stats.totalProblemsAttempted, 0)
  );
  const opMax = Math.max(...opTotals, 1);

  // ── Practice Calendar (5 weeks = 35 days) ──────────────────────────────────
  const calendarDays: { date: string; active: boolean; isToday: boolean }[] = [];
  for (let i = 34; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    calendarDays.push({ date: dateStr, active: uniqueDates.has(dateStr), isToday: dateStr === todayStr });
  }

  // ── Recent sessions ─────────────────────────────────────────────────────────
  const recentSessions = [...sessionLog].reverse().slice(0, 6);

  return (
    <div className="space-y-8">

      {/* ── Today's Stats banner ─────────────────────────────────────────────── */}
      {todayProblems > 0 && (
        <div className="bg-[#4F46E5] rounded-xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-white font-semibold text-sm">Today's Practice</div>
            <div className="text-[#C7D2FE] text-xs mt-0.5">Keep up the great work!</div>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-white font-bold text-xl">{todayProblems}</div>
              <div className="text-[#C7D2FE] text-[11px]">problems today</div>
            </div>
            {currentStreakToday > 0 && (
              <div className="text-center">
                <div className="text-white font-bold text-xl">{currentStreakToday}</div>
                <div className="text-[#C7D2FE] text-[11px]">current streak</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Hero stats ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <HeroCard label="Total Problems" value={totalProblems.toLocaleString()} />
        <HeroCard label="Total Sessions" value={totalSessions.toLocaleString()} />
        <HeroCard label="Days Active" value={daysActive.toLocaleString()} />
        <HeroCard label="Longest Streak" value={longestStreak > 0 ? longestStreak.toLocaleString() : '—'} sub={longestStreak > 0 ? 'in a row' : undefined} />
      </div>

      {/* ── Achievements ─────────────────────────────────────────────────────── */}
      <div>
        <div className="mb-3">
          <h2 className="text-base font-semibold text-[#1E293B]">Achievements</h2>
          <p className="text-xs text-[#64748B] mt-0.5">Earn badges by reaching milestones in your practice.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {ACHIEVEMENTS.map((a) => (
            <AchievementBadge key={a.id} achievement={a} earned={earnedIds.has(a.id)} />
          ))}
        </div>

        {/* Next Achievement hints */}
        {nextAchievements.length > 0 && (
          <div className="mt-3 space-y-2">
            {nextAchievements.map(({ achievement, ratio }) => {
              const pct = Math.round(ratio * 100);
              // Compute the "X away" label
              let awayLabel = '';
              if (achievement.id.startsWith('math-') || achievement.id === 'problem-solver') {
                const targets: Record<string, number> = {
                  'problem-solver': 100, 'math-machine': 500,
                  'math-whiz': 1000, 'math-titan': 2500, 'math-juggernaut': 5000,
                };
                const target = targets[achievement.id];
                if (target) awayLabel = `${(target - totalProblems).toLocaleString()} problems away`;
              } else if (achievement.id.includes('streak')) {
                const targets: Record<string, number> = {
                  'streak-starter': 10, 'streak-champion': 25,
                  'streak-master': 50, 'unstoppable': 100,
                };
                const target = targets[achievement.id];
                if (target) awayLabel = `${target - longestStreak} streak away`;
              } else if (achievement.id.includes('session') || achievement.id === 'consistent' || achievement.id === 'dedicated-student' || achievement.id === 'math-scholar') {
                const targets: Record<string, number> = {
                  'consistent': 5, 'dedicated-student': 25, 'math-scholar': 100,
                };
                const target = targets[achievement.id];
                if (target) awayLabel = `${target - totalSessions} sessions away`;
              } else if (achievement.id === 'well-rounded') {
                const ops: Operation[] = ['addition', 'subtraction', 'multiplication', 'division'];
                const missing = ops.filter((o) => !operationsPracticed.has(o));
                awayLabel = `Practice ${missing.join(', ')} to unlock`;
              }
              return (
                <div key={achievement.id} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-[#1E293B]">Next: {achievement.label}</span>
                    <span className="text-[11px] text-[#64748B]">{awayLabel}</span>
                  </div>
                  <div className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#4F46E5] rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-[#94A3B8] mt-1">{pct}% complete</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Operations Strength ───────────────────────────────────────────────── */}
      {opTotals.some((t) => t > 0) && (
        <div>
          <div className="mb-3">
            <h2 className="text-base font-semibold text-[#1E293B]">Operations Strength</h2>
            <p className="text-xs text-[#64748B] mt-0.5">How many problems you've solved in each type of math — a longer bar means more practice in that area.</p>
          </div>
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-3">
            {OP_KEYS.map(({ label, color }, i) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#64748B] font-medium">{label}</span>
                  <span className="text-xs text-[#94A3B8]">{opTotals[i].toLocaleString()} problems</span>
                </div>
                <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${color}`}
                    style={{ width: `${Math.round((opTotals[i] / opMax) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Practice Calendar ─────────────────────────────────────────────────── */}
      <div>
        <div className="mb-3">
          <h2 className="text-base font-semibold text-[#1E293B]">Practice Calendar</h2>
          <p className="text-xs text-[#64748B] mt-0.5">Each square is a day. Filled squares show when you practiced over the last 5 weeks.</p>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 w-fit">
          {/* Parse first day as local midnight to get the correct weekday */}
          {(() => {
            const [fy, fm, fd] = calendarDays[0].date.split('-').map(Number);
            const firstDayOfWeek = new Date(fy, fm - 1, fd).getDay();
            return (
              <div className="inline-grid grid-cols-7 gap-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={i} className="w-6 text-center text-[10px] font-semibold text-[#94A3B8] pb-0.5">{d}</div>
                ))}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`pad-${i}`} className="w-6 h-6" />
                ))}
                {calendarDays.map(({ date, active, isToday }) => (
                  <div
                    key={date}
                    title={date}
                    className={`w-6 h-6 rounded transition-colors ${
                      isToday
                        ? active
                          ? 'bg-[#4F46E5] ring-2 ring-[#4F46E5] ring-offset-1'
                          : 'ring-2 ring-[#C7D2FE] ring-offset-1 bg-white'
                        : active
                        ? 'bg-[#4F46E5]'
                        : 'bg-[#F1F5F9]'
                    }`}
                  />
                ))}
              </div>
            );
          })()}
          <div className="flex items-center gap-4 mt-3 text-[11px] text-[#94A3B8]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#4F46E5] inline-block" />
              Practiced
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#F1F5F9] inline-block border border-[#E2E8F0]" />
              No practice
            </span>
          </div>
        </div>
      </div>

      {/* ── Per-operation grouped practice table ─────────────────────────────── */}
      <div>
        <div className="mb-3">
          <h2 className="text-base font-semibold text-[#1E293B]">By Practice Type</h2>
          <p className="text-xs text-[#64748B] mt-0.5">Your stats broken down by each individual practice type.</p>
        </div>
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
                      <th className="text-right px-3 py-2.5 text-[#64748B] font-medium hidden sm:table-cell">
                        {key === 'mixed' ? 'Best Score' : 'Longest Streak'}
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
                        <td className="px-4 py-3">
                          <div className="text-[#1E293B] font-medium">{row.label}</div>
                          <div className="sm:hidden text-[11px] text-[#94A3B8] mt-0.5">
                            {row.isTimed
                              ? (row.stats.bestTimedScore > 0
                                  ? `${row.stats.bestTimedScore}/min best`
                                  : 'No timed sessions yet')
                              : (row.stats.longestStreak > 0
                                  ? `${row.stats.longestStreak} streak best`
                                  : '')}
                            {row.stats.lastSessionDate
                              ? ` · ${relativeDate(row.stats.lastSessionDate)}`
                              : ''}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right text-[#64748B] hidden sm:table-cell">
                          {relativeDate(row.stats.lastSessionDate)}
                        </td>
                        <td className="px-3 py-3 text-right text-[#64748B]">{row.stats.totalSessions}</td>
                        <td className="px-3 py-3 text-right text-[#64748B]">{row.stats.totalProblemsAttempted}</td>
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
          <div className="mb-3">
            <h2 className="text-base font-semibold text-[#1E293B]">Recent Sessions</h2>
            <p className="text-xs text-[#64748B] mt-0.5">Your 6 most recent practice sessions.</p>
          </div>
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

      {/* ── Reset all progress ───────────────────────────────────────────────── */}
      <div className="pt-2 border-t border-[#E2E8F0]">
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="text-xs text-[#94A3B8] hover:text-red-500 transition-colors font-medium"
          >
            Reset All Progress
          </button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="text-red-500 text-xl leading-none mt-0.5">⚠️</div>
              <div className="flex-1">
                <div className="text-sm font-bold text-red-700">DANGER: This Cannot Be Undone!</div>
                <div className="text-xs text-red-600 mt-1 leading-relaxed">
                  You are about to permanently erase <strong>ALL</strong> of your practice history — every session, every streak, every achievement, and every record. Once deleted, this data is gone forever and cannot be recovered.
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      clearAllProgress();
                      window.location.reload();
                    }}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    Yes, Delete Everything Forever
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-3 py-1.5 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#475569] text-xs font-medium rounded-lg transition-colors"
                  >
                    Cancel, Keep My Progress
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
