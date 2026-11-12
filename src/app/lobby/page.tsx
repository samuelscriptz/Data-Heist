'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Terminal, 
  Clock, 
  ShieldCheck, 
  Radio, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  ArrowRight,
  LogOut,
  Zap,
  Sparkles
} from 'lucide-react';
import MatrixRain from '@/components/MatrixRain';
import AudioToggle from '@/components/AudioToggle';
import { sound } from '@/lib/audio';

export default function LobbyPage() {
  const router = useRouter();
  const [team, setTeam] = useState<{
    id: string;
    name: string;
    lobbyStatus: 'pending_admission' | 'admitted' | 'in_game' | 'rejected';
    reconnectPending: boolean;
  } | null>(null);

  const [gameStarted, setGameStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reconnectSent, setReconnectSent] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/lobby/status');
      if (!res.ok) return;

      const data = await res.json();

      if (!data.authenticated || !data.team) {
        router.push('/');
        return;
      }

      setTeam(data.team);
      setGameStarted(data.gameStarted);

      // If game is started and team is in_game or admitted, redirect directly to challenge terminal!
      if (data.gameStarted && (data.team.lobbyStatus === 'in_game' || data.team.lobbyStatus === 'admitted')) {
        sound.playVictory();
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Lobby status check error:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const handleLeaveLobby = async () => {
    sound.playClick();
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const handleRequestReconnect = async () => {
    if (!team) return;
    sound.playClick();
    try {
      const res = await fetch('/api/lobby/reconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: team.id }),
      });
      if (res.ok) {
        sound.playSuccess();
        setReconnectSent(true);
      }
    } catch (err) {
      console.error('Reconnect error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080b10] flex items-center justify-center font-mono text-emerald-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-sm tracking-wider">SYNCING WITH SYMPOSIUM LOBBY...</span>
        </div>
      </div>
    );
  }

  const isPending = team?.lobbyStatus === 'pending_admission';
  const isAdmitted = team?.lobbyStatus === 'admitted';

  return (
    <div className="min-h-screen bg-[#080b10] text-slate-100 scanlines flex flex-col justify-between p-4 sm:p-6 relative selection:bg-emerald-500 selection:text-black">
      <MatrixRain />

      {/* Top Bar */}
      <header className="relative z-20 flex items-center justify-between max-w-5xl mx-auto w-full pt-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 glow-green">
            <Terminal className="w-4 h-4" />
          </div>
          <span className="font-mono font-black text-sm tracking-widest text-emerald-400">
            DATA HEIST // LOBBY
          </span>
        </div>

        <div className="flex items-center gap-3">
          <AudioToggle />
          <button
            onClick={handleLeaveLobby}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/30 bg-slate-950/80 transition-colors cursor-pointer"
            title="Leave waiting room"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CHANGE TEAM</span>
          </button>
        </div>
      </header>

      {/* Central Waiting Room Card */}
      <main className="relative z-10 max-w-2xl mx-auto w-full my-auto py-8">
        <div className="bg-slate-950/90 border border-cyan-500/30 rounded-2xl p-6 sm:p-10 backdrop-blur-md glow-cyan font-mono text-center space-y-6">
          
          {/* Animated Status Beacon */}
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            <div className={`absolute inset-0 rounded-full animate-ping opacity-25 ${
              isAdmitted ? 'bg-emerald-500' : 'bg-amber-500'
            }`} style={{ animationDuration: '3s' }} />
            
            <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center ${
              isAdmitted 
                ? 'bg-emerald-950/60 border-emerald-400 text-emerald-300 glow-green' 
                : 'bg-amber-950/60 border-amber-400 text-amber-300 glow-amber'
            }`}>
              {isAdmitted ? (
                <CheckCircle2 className="w-10 h-10 animate-pulse text-emerald-400" />
              ) : (
                <Radio className="w-10 h-10 animate-spin text-amber-400" style={{ animationDuration: '10s' }} />
              )}
            </div>
          </div>

          {/* Status Headline */}
          <div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border mb-2 ${
              isAdmitted 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isAdmitted ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`} />
              {isAdmitted ? 'CLEARANCE GRANTED // ADMITTED' : 'WAITING FOR PROCTOR ADMISSION'}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-wide mt-2">
              TEAM <span className="text-cyan-300">{team?.name}</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
              {isAdmitted
                ? 'Your team is officially admitted into the enclave! Please keep this tab open. The challenge terminal and the 20-minute countdown will launch automatically the moment the host begins.'
                : 'Your transmission has been queued. The symposium proctor is currently verifying and admitting teams at the control console.'}
            </p>
          </div>

          {/* Host Synchronized Notification */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-left text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400 font-bold border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Clock className="w-4 h-4" />
                SYNCHRONIZED EVENT PROTOCOL:
              </span>
              <span className="text-emerald-400 font-mono">20:00 CAP</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300 pt-1">
              <div className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">&bull;</span>
                <span><strong>Mentimeter-Style Start:</strong> All admitted teams start at the exact same millisecond.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">&bull;</span>
                <span><strong>Sequential Unlock:</strong> 10 sequential cryptographic & CTF nodes.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">&bull;</span>
                <span><strong>Top 6 Qualified:</strong> First 6 approved finishes receive the 3-floor physical venue maps.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">&bull;</span>
                <span><strong>All Answers UPPERCASE:</strong> Strictly uppercase input for all 10 challenges.</span>
              </div>
            </div>
          </div>

          {/* Reconnect Option if disconnected on another device */}
          <div className="pt-2 text-center">
            {team?.reconnectPending || reconnectSent ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                <span>Reconnection request active. Please ask the proctor at the desk to authorize this device.</span>
              </div>
            ) : (
              <button
                onClick={handleRequestReconnect}
                className="text-[11px] text-slate-500 hover:text-cyan-400 underline cursor-pointer transition-colors"
              >
                Accidentally disconnected earlier? Request host to restore previous session.
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-2 text-xs font-mono text-slate-600">
        COLLEGE SYMPOSIUM 2026 // VOC BLOCK &bull; DEPARTMENT OF DATA SCIENCE
      </footer>
    </div>
  );
}

