import { useEffect, useState } from 'react';
import { ALL_PRESETS } from '@/engine/presets';
import { loadStats, DEFAULT_STATS } from '@/engine/storage';
import type { PageStats } from '@/engine/types';

interface PresetRow {
  label: string;
  stats: PageStats;
}

export default function ProgressDashboard() {
  const [rows, setRows] = useState<PresetRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const data = ALL_PRESETS.map((preset) => ({
      label: preset.label ?? preset.storageKey,
      stats: loadStats(preset.storageKey),
    }));
    setRows(data);
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  const practiced = rows.filter((r) => r.stats.totalSessions > 0);

  const totalProblems = practiced.reduce((sum, r) => sum + r.stats.totalProblemsAttempted, 0);
  const totalSessions = practiced.reduce((sum, r) => sum + r.stats.totalSessions, 0);
  const bestSpeed = practiced.reduce((max, r) => Math.max(max, r.stats.bestTimedScore), 0);
  const bestStreak = practiced.reduce((max, r) => Math.max(max, r.stats.longestStreak), 0);

  if (practiced.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">📊</div>
        <p className="text-[#1E293B] font-semibold text-lg">No practice data yet</p>
        <p className="text-[#64748B] mt-2 text-sm">Complete a session on any practice page to see your progress here.</p>
        <a
          href="/math-practice"
          className="inline-block mt-6 py-2.5 px-6 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold text-sm rounded-xl transition-colors"
        >
          Start Practicing
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="Total Problems" value={totalProblems.toLocaleString()} />
        <SummaryCard label="Total Sessions" value={totalSessions.toLocaleString()} />
        <SummaryCard
          label="Best Speed"
          value={bestSpeed > 0 ? `${bestSpeed}/min` : '—'}
        />
        <SummaryCard label="Best Streak" value={bestStreak.toLocaleString()} />
      </div>

      {/* Per-preset table */}
      <div>
        <h2 className="text-base font-semibold text-[#1E293B] mb-3">By practice type</h2>
        <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th className="text-left px-4 py-3 text-[#64748B] font-medium">Practice</th>
                <th className="text-right px-4 py-3 text-[#64748B] font-medium">Sessions</th>
                <th className="text-right px-4 py-3 text-[#64748B] font-medium">Problems</th>
                <th className="text-right px-4 py-3 text-[#64748B] font-medium hidden sm:table-cell">Best Speed</th>
                <th className="text-right px-4 py-3 text-[#64748B] font-medium hidden sm:table-cell">Best Streak</th>
              </tr>
            </thead>
            <tbody>
              {practiced.map((row, i) => (
                <tr
                  key={row.label}
                  className={i < practiced.length - 1 ? 'border-b border-[#E2E8F0]' : ''}
                >
                  <td className="px-4 py-3 text-[#1E293B] font-medium">{row.label}</td>
                  <td className="px-4 py-3 text-right text-[#64748B]">{row.stats.totalSessions}</td>
                  <td className="px-4 py-3 text-right text-[#64748B]">{row.stats.totalProblemsAttempted}</td>
                  <td className="px-4 py-3 text-right text-[#64748B] hidden sm:table-cell">
                    {row.stats.bestTimedScore > 0 ? `${row.stats.bestTimedScore}/min` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-[#64748B] hidden sm:table-cell">
                    {row.stats.longestStreak}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: string;
}

function SummaryCard({ label, value }: SummaryCardProps) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 text-center">
      <div className="text-2xl font-bold text-[#1E293B]">{value}</div>
      <div className="text-xs text-[#64748B] mt-1">{label}</div>
    </div>
  );
}
