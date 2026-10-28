'use client';

import { useState, useEffect } from 'react';
import HeaderNav from '@/components/HeaderNav';
import MatrixRain from '@/components/MatrixRain';
import LeaderboardTable from '@/components/LeaderboardTable';
import { LeaderboardEntry } from '@/lib/types';
import { RefreshCw, Trophy, Sparkles } from 'lucide-react';
import { sound } from '@/lib/audio';

export default function LeaderboardPage() {
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    displayName: string;
    role: string;
    teamId?: string;
  } | null>(null);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchLeaderboard = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});

    fetchLeaderboard();

    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchLeaderboard(true);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#080b10] text-slate-100 scanlines flex flex-col relative selection:bg-emerald-500 selection:text-black">
      <MatrixRain />
      <HeaderNav user={currentUser} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 relative z-10 w-full space-y-6">
        {/* Title Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 mb-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              OFFICIAL SYMPOSIUM STANDINGS
            </div>
            <h1 className="text-2xl sm:text-3xl font-mono font-black text-slate-100 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              DATA HEIST LEADERBOARD
            </h1>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Top 6 verified teams qualify for the secret venue map dispatch.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs font-mono text-slate-500 hidden sm:inline">
                Synced at: {lastUpdated}
              </span>
            )}
            <button
              onClick={() => {
                sound.playClick();
                fetchLeaderboard();
              }}
              disabled={refreshing}
              className="px-3 py-1.5 rounded font-mono text-xs bg-slate-900 hover:bg-slate-850 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'REFRESHING...' : 'REFRESH'}</span>
            </button>
          </div>
        </div>

        {/* Leaderboard Table */}
        {loading ? (
          <div className="p-12 text-center font-mono text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
            POLLING MAINFRAME SCORES...
          </div>
        ) : (
          <LeaderboardTable
            entries={leaderboard}
            currentTeamId={currentUser?.teamId}
          />
        )}
      </main>
    </div>
  );
}
