'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertTriangle, PauseCircle, CheckCircle } from 'lucide-react';
import { EventStatus } from '@/lib/types';

interface EventCountdownProps {
  onTimeUpdate?: (remainingSeconds: number) => void;
  compact?: boolean;
  endTime?: string | null;
  durationMinutes?: number;
  initialSeconds?: number;
  title?: string;
  isActive?: boolean;
  onTimeExpired?: () => void;
}

export default function EventCountdown({
  onTimeUpdate,
  compact = false,
  endTime,
  durationMinutes: propDuration = 20,
  initialSeconds,
  title = '20-MINUTE HEIST COUNTDOWN',
  isActive = true,
  onTimeExpired,
}: EventCountdownProps) {
  const [durationMinutes, setDurationMinutes] = useState<number>(propDuration);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    if (initialSeconds !== undefined) return initialSeconds;
    if (endTime) {
      return Math.max(0, Math.floor((new Date(endTime).getTime() - Date.now()) / 1000));
    }
    // No endTime = game hasn't started, show full duration statically (no ticking)
    return propDuration * 60;
  });
  const [status, setStatus] = useState<EventStatus>('active');
  const [serverSynced, setServerSynced] = useState<boolean>(false);

  // Sync if propDuration changes
  useEffect(() => {
    if (propDuration) {
      setDurationMinutes(propDuration);
    }
  }, [propDuration]);

  // Recalculate when endTime prop is first set or changes (game just started)
  useEffect(() => {
    if (endTime) {
      const calc = Math.max(0, Math.floor((new Date(endTime).getTime() - Date.now()) / 1000));
      setRemainingSeconds(calc);
      setServerSynced(true);
      if (onTimeUpdate) onTimeUpdate(calc);
    }
  }, [endTime, onTimeUpdate]);

  // 1-second countdown — ONLY runs when endTime is set (i.e. game has started).
  // Before the game starts, endTime is null/undefined, so we never tick and never
  // hit the server — that prevents the "00:00:00 (EXPIRED)" bug.
  useEffect(() => {
    if (!isActive) return;
    if (!endTime) return; // Game not started — do not tick

    const timerId = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (onTimeExpired) onTimeExpired();
          if (onTimeUpdate) onTimeUpdate(0);
          return 0;
        }
        const next = prev - 1;
        if (onTimeUpdate) onTimeUpdate(next);
        return next;
      });
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, [endTime, isActive, onTimeUpdate, onTimeExpired]);

  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const timeFormatted = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  const totalSeconds = durationMinutes * 60;
  const progressPercent = Math.min(100, Math.max(0, ((totalSeconds - remainingSeconds) / totalSeconds) * 100));

  const isLowTime = remainingSeconds < 300 && remainingSeconds > 0; // Less than 5 mins
  const isExpired = remainingSeconds === 0 && !!endTime; // Only "expired" if game actually started

  // ── COMPACT MODE ──────────────────────────────────────────────────────────
  if (compact) {
    // Game hasn't started yet — show neutral badge instead of a countdown
    if (!endTime) {
      return (
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded font-mono text-xs border bg-slate-900/60 border-slate-700 text-slate-500"
          title="Game has not started yet"
        >
          <Clock className="w-3.5 h-3.5" />
          <span className="font-bold tracking-wider">AWAITING START</span>
        </div>
      );
    }

    return (
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded font-mono text-xs border ${
          status === 'paused'
            ? 'bg-amber-950/20 border-amber-500/30 text-amber-400'
            : isExpired
            ? 'bg-red-950/40 border-red-500/50 text-red-400 font-bold glow-red'
            : isLowTime
            ? 'bg-red-950/30 border-red-500/50 text-red-300 animate-pulse glow-red'
            : 'bg-cyan-950/20 border-cyan-500/30 text-cyan-300 glow-cyan'
        }`}
        title={`Authoritative Clock: ${isExpired ? 'TIME EXPIRED' : timeFormatted} (${durationMinutes} min limit)`}
      >
        <Clock className="w-3.5 h-3.5" />
        <span className="font-bold tracking-wider">{isExpired ? '00:00:00 (EXPIRED)' : timeFormatted}</span>
        {status === 'paused' && <span className="text-[10px] uppercase bg-amber-500/20 px-1 rounded">PAUSED</span>}
      </div>
    );
  }

  // ── FULL MODE ─────────────────────────────────────────────────────────────
  // Game hasn't started — show static "waiting for host" placeholder
  if (!endTime) {
    return (
      <div className="p-4 rounded-xl border border-slate-700 bg-black/60 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="text-xs uppercase font-mono tracking-widest text-slate-500">
              {title}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-500 border border-slate-700">
            WAITING FOR HOST
          </span>
        </div>
        <div className="text-3xl md:text-4xl font-mono font-black tracking-widest text-slate-600">
          20:00:00
        </div>
        <div className="text-right text-xs text-slate-600 font-mono mt-1">
          {durationMinutes} MINUTE CAP // 10 CHALLENGES
        </div>
        <div className="w-full bg-slate-900/80 h-1.5 rounded-full mt-3 overflow-hidden border border-slate-800">
          <div className="h-full w-0 bg-slate-700" />
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-xl border bg-black/60 backdrop-blur-md transition-all ${
      status === 'paused'
        ? 'border-amber-500/30'
        : isExpired
        ? 'border-red-500/60 bg-red-950/20 glow-red'
        : isLowTime
        ? 'border-red-500/50 glow-red'
        : 'border-cyan-500/30 glow-cyan'
    }`}>
      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-2">
          <Clock className={`w-4 h-4 ${isLowTime || isExpired ? 'text-red-400 animate-bounce' : 'text-cyan-400'}`} />
          <span className="text-xs uppercase font-mono tracking-widest text-slate-400">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {serverSynced && !isExpired && (
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              SERVER SYNCED
            </span>
          )}
          {status === 'active' && !isExpired && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">
              ACTIVE
            </span>
          )}
          {status === 'paused' && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/40 text-amber-400 border border-amber-500/30 flex items-center gap-1">
              <PauseCircle className="w-3 h-3" /> PAUSED
            </span>
          )}
          {isExpired && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-950/60 text-red-300 border border-red-500/50 flex items-center gap-1 font-bold">
              <CheckCircle className="w-3 h-3" /> TIME EXPIRED
            </span>
          )}
        </div>
      </div>

      <div className="flex items-baseline justify-between">
        <div className={`text-3xl md:text-4xl font-mono font-black tracking-widest ${
          isExpired
            ? 'text-red-500 text-glow-red animate-pulse'
            : isLowTime
            ? 'text-red-400 text-glow-amber animate-pulse'
            : 'text-cyan-300 text-glow-cyan'
        }`}>
          {timeFormatted}
        </div>
        <div className="text-right text-xs text-slate-400 font-mono">
          {durationMinutes} MINUTE CAP // 10 CHALLENGES
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-900/80 h-1.5 rounded-full mt-3 overflow-hidden border border-slate-800">
        <div
          className={`h-full transition-all duration-1000 ${
            isExpired ? 'bg-red-600' : isLowTime ? 'bg-red-500' : 'bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-400'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {isLowTime && (
        <div className="flex items-center gap-1.5 mt-2 text-[11px] font-mono text-red-400">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>URGENT: Less than 5 minutes remaining. Finalize challenge submissions.</span>
        </div>
      )}

      {isExpired && (
        <div className="flex items-center gap-1.5 mt-2 text-[11px] font-mono text-red-400 font-bold">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{durationMinutes}-minute challenge window has concluded. New submissions are locked.</span>
        </div>
      )}
    </div>
  );
}
