'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Terminal, Shield, Trophy, LogOut, Radio, UserCheck } from 'lucide-react';
import AudioToggle from './AudioToggle';
import EventCountdown from './EventCountdown';
import { sound } from '@/lib/audio';

interface HeaderNavProps {
  user?: {
    username: string;
    displayName: string;
    role: string;
    teamId?: string;
  } | null;
}

export default function HeaderNav({ user }: HeaderNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    sound.playClick();
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            onClick={() => sound.playClick()}
            className="flex items-center gap-2 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:border-emerald-300 transition-all glow-green">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-black tracking-widest text-base sm:text-lg text-emerald-400 text-glow-green">
                  DATA HEIST
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/50 text-cyan-400 border border-cyan-500/30">
                  APL&apos;26
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                <span>MAINFRAME ACTIVE</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation links & Countdown */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Compact countdown */}
          <div className="hidden md:block">
            <EventCountdown compact />
          </div>

          <nav className="flex items-center gap-1">
            {user?.role === 'participant' && (
              <Link
                href="/dashboard"
                onClick={() => sound.playClick()}
                className={`px-3 py-1.5 rounded font-mono text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                  pathname === '/dashboard'
                    ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">TERMINAL</span>
              </Link>
            )}

            <Link
              href="/leaderboard"
              onClick={() => sound.playClick()}
              className={`px-3 py-1.5 rounded font-mono text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                pathname === '/leaderboard'
                  ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">LEADERBOARD</span>
            </Link>

            {user?.role === 'organizer' && (
              <Link
                href="/organizer"
                onClick={() => sound.playClick()}
                className={`px-3 py-1.5 rounded font-mono text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                  pathname === '/organizer'
                    ? 'bg-amber-950/40 text-amber-400 border border-amber-500/40'
                    : 'text-amber-500 hover:text-amber-300 hover:bg-amber-950/20'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>ORGANIZER</span>
              </Link>
            )}
          </nav>

          {/* Sound Toggle */}
          <AudioToggle />

          {/* User Status / Logout */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="hidden lg:flex flex-col items-end text-right">
                <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-emerald-400" />
                  {user.displayName}
                </span>
                <span className="text-[10px] font-mono text-slate-400 uppercase">
                  {user.role}
                </span>
              </div>

              <button
                onClick={handleLogout}
                title="Disconnect from Mainframe"
                className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-500/30 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => sound.playClick()}
              className="px-3 py-1.5 rounded font-mono text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all cursor-pointer glow-green"
            >
              SIGN IN
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
