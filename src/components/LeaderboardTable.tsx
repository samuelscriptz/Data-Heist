'use client';

import { Trophy, CheckCircle2, ShieldCheck, Clock, Award, Users } from 'lucide-react';
import { LeaderboardEntry } from '@/lib/types';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentTeamId?: string;
}

export default function LeaderboardTable({
  entries,
  currentTeamId,
}: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-8 text-center font-mono text-slate-500">
        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
        No team telemetry available yet. Submissions will appear as teams begin solving nodes.
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-950/80 border border-cyan-500/30 rounded-xl overflow-hidden backdrop-blur-md glow-cyan font-mono">
      {/* Table Header */}
      <div className="bg-slate-900/90 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">
            SYMPOSIUM LIVE LEADERBOARD
          </h2>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          REAL-TIME TELEMETRY
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/50 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4 w-16 text-center">RANK</th>
              <th className="py-3.5 px-4">TEAM NAME</th>
              <th className="py-3.5 px-4 text-center">SOLVED</th>
              <th className="py-3.5 px-4 text-center">SCORE</th>
              <th className="py-3.5 px-4 text-center">ATTEMPTS</th>
              <th className="py-3.5 px-4 text-center">LAST SOLVE</th>
              <th className="py-3.5 px-4 text-center">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {entries.map((entry) => {
              const isUserTeam = entry.teamId === currentTeamId;
              const isTopThree = entry.rank <= 3;
              const isTopSix = entry.rank <= 6;

              return (
                <tr
                  key={entry.teamId}
                  className={`transition-colors ${
                    isUserTeam
                      ? 'bg-cyan-950/30 border-l-4 border-l-cyan-400'
                      : isTopThree
                      ? 'bg-slate-900/40 hover:bg-slate-900/80'
                      : 'hover:bg-slate-900/60'
                  }`}
                >
                  {/* Rank */}
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${
                        entry.rank === 1
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 glow-amber'
                          : entry.rank === 2
                          ? 'bg-slate-300/20 text-slate-200 border border-slate-400/40'
                          : entry.rank === 3
                          ? 'bg-amber-700/20 text-amber-500 border border-amber-600/40'
                          : isTopSix
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
                          : 'text-slate-500'
                      }`}
                    >
                      {entry.rank}
                    </span>
                  </td>

                  {/* Team Name */}
                  <td className="py-3.5 px-4 font-bold text-slate-100">
                    <div className="flex items-center gap-2">
                      <span className={isUserTeam ? 'text-cyan-300' : ''}>
                        {entry.teamName}
                      </span>
                      {isUserTeam && (
                        <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.2 rounded font-normal">
                          YOU
                        </span>
                      )}
                      {entry.mapEligible && (
                        <span 
                          title="Qualified for Venue Map dispatch" 
                          className="text-[10px] bg-emerald-950/50 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded flex items-center gap-0.5"
                        >
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          TOP 6 MAP
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Solved Count */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
                      {entry.challengesSolved === 10 ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : null}
                      {entry.challengesSolved} / 10
                    </span>
                  </td>

                  {/* Score */}
                  <td className="py-3.5 px-4 text-center font-bold text-cyan-300">
                    {entry.score}
                  </td>

                  {/* Attempts */}
                  <td className="py-3.5 px-4 text-center text-slate-400">
                    {entry.totalAttempts}
                  </td>

                  {/* Last Solved */}
                  <td className="py-3.5 px-4 text-center text-slate-400 text-[11px]">
                    {entry.lastSolvedAt ? (
                      <span className="flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {new Date(entry.lastSolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 text-center">
                    {entry.isCompleted ? (
                      entry.reviewStatus === 'approved' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-500/40 font-bold">
                          FINISHED #{entry.finishRank || ''}
                        </span>
                      ) : entry.reviewStatus === 'pending' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950/40 text-amber-400 border border-amber-500/40">
                          IN REVIEW
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-red-950/40 text-red-400 border border-red-500/40">
                          REJECTED
                        </span>
                      )
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                        NODE #{entry.challengesSolved + 1}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Notes */}
      <div className="bg-slate-900/60 px-6 py-3 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-emerald-400" />
          <span>First six approved teams to complete Challenge 10 receive the venue map dispatch.</span>
        </div>
        <div>
          Ties broken by authoritative server completion timestamp and fewest attempts.
        </div>
      </div>
    </div>
  );
}
