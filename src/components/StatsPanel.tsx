import { useEffect, useState } from 'react';
import { loadStats, clearStats, resetCurrentStreak } from '@/engine/storage';
import type { PageStats } from '@/engine/types';
import { DEFAULT_STATS } from '@/engine/storage';

interface Props {
  storageKey: string;
  /** Called when stats are reset so the widget can re-sync */
  onReset?: () => void;
}

export default function StatsPanel({ storageKey, onReset }: Props) {
  const [stats, setStats] = useState<PageStats>(DEFAULT_STATS);

  useEffect(() => {
    setStats(loadStats(storageKey));
  }, [storageKey]);

  function handleResetStreak() {
    resetCurrentStreak(storageKey);
    setStats(loadStats(storageKey));
    onReset?.();
  }

  function handleResetAll() {
    clearStats(storageKey);
    setStats({ ...DEFAULT_STATS });
    onReset?.();
  }

  return (
    <div className="grid grid-cols-3 gap-3 w-full mt-4">
      <StatCard
        label="Current Streak"
        value={stats.currentStreak}
        action={{ label: 'Reset', onClick: handleResetStreak }}
      />
      <StatCard
        label="Best Streak"
        value={stats.longestStreak}
        action={null}
      />
      <StatCard
        label="Best Score"
        value={stats.bestTimedScore > 0 ? `${stats.bestTimedScore}/min` : '—'}
        action={{ label: 'Clear All', onClick: handleResetAll }}
      />
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number | string;
  action: { label: string; onClick: () => void } | null;
}

function StatCard({ label, value, action }: StatCardProps) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 text-center">
      <div className="text-xl font-bold text-[#1E293B]">{value}</div>
      <div className="text-xs text-[#64748B] mt-0.5">{label}</div>
      {action && (
        <button
          onClick={action.onClick}
          className="text-xs text-[#3B82F6] hover:text-[#2563EB] mt-1 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
