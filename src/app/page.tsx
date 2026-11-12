'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Terminal, 
  Shield, 
  Clock, 
  MapPin, 
  Users, 
  Cpu, 
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Lock,
  RefreshCw,
  Trophy,
  Radio
} from 'lucide-react';
import HeaderNav from '@/components/HeaderNav';
import MatrixRain from '@/components/MatrixRain';
import { sound } from '@/lib/audio';

export default function HomePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    displayName: string;
    role: string;
    teamId?: string;
  } | null>(null);

  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Reconnection state if an active team is entered
  const [activeConflict, setActiveConflict] = useState<{
    teamId: string;
    teamName: string;
    currentChallengeIndex: number;
    score: number;
  } | null>(null);
  const [reconnectSending, setReconnectSending] = useState(false);
  const [reconnectSuccess, setReconnectSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleJoinLobby = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = teamName.trim();
    if (!trimmed || loading) return;

    sound.playClick();
    setLoading(true);
    setJoinError(null);
    setActiveConflict(null);
    setReconnectSuccess(false);

    try {
      const res = await fetch('/api/lobby/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName: trimmed }),
      });

      const data = await res.json();

      if (!res.ok && !data.alreadyActive) {
        sound.playError();
        setJoinError(data.error || data.message || 'Failed to enter lobby.');
        return;
      }

      if (data.alreadyActive) {
        // Team is already in-game from another device/browser
        sound.playAlert();
        setActiveConflict({
          teamId: data.team.id,
          teamName: data.team.name,
          currentChallengeIndex: data.team.currentChallengeIndex,
          score: data.team.score,
        });
        return;
      }

      // Success!
      sound.playSuccess();
      if (data.gameStarted && (data.status === 'in_game' || data.team?.lobbyStatus === 'in_game')) {
        router.push('/dashboard');
      } else {
        router.push('/lobby');
      }
    } catch {
      sound.playError();
      setJoinError('Network synchronization failure. Please verify server connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReconnect = async () => {
    if (!activeConflict || reconnectSending) return;
    sound.playClick();
    setReconnectSending(true);

    try {
      const res = await fetch('/api/lobby/reconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: activeConflict.teamId }),
      });

      const data = await res.json();

      if (res.ok) {
        sound.playSuccess();
        setReconnectSuccess(true);
      } else {
        sound.playError();
        setJoinError(data.error || 'Failed to dispatch reconnection request.');
      }
    } catch {
      sound.playError();
      setJoinError('Failed to communicate with proctor station.');
    } finally {
      setReconnectSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080b10] text-slate-100 scanlines flex flex-col relative selection:bg-emerald-500 selection:text-black">
      <MatrixRain />
      <HeaderNav user={currentUser} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10 w-full space-y-12">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-6 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-950/40 text-cyan-300 border border-cyan-500/40 glow-cyan">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            COLLEGE SYMPOSIUM 2026 // ADVANCED PROGRAMMING LAB
          </div>

          <h1 className="text-4xl sm:text-6xl font-mono font-black tracking-tight text-slate-100">
            OPERATION <span className="text-emerald-400 text-glow-green">DATA HEIST</span>
          </h1>

          <p className="text-sm sm:text-base font-mono text-slate-300 leading-relaxed max-w-2xl mx-auto">
            A high-stakes 20-minute synchronized cryptanalytic infiltration. Decode corrupted packet captures, defeat polyalphabetic ciphers, and capture CTF flags. The first six approved teams claim the physical VOC Block venue blueprints.
          </p>

          {/* MENTIMETER-STYLE PASSWORDLESS JOIN FORM */}
          <div className="pt-4 max-w-xl mx-auto">
            {currentUser ? (
              /* Already Authenticated Card */
              <div className="bg-slate-950/90 border border-emerald-500/40 rounded-2xl p-6 glow-green font-mono space-y-4">
                <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>SESSION ACTIVE: {currentUser.displayName}</span>
                </div>
                <p className="text-xs text-slate-400">
                  You are currently authenticated as an active {currentUser.role}.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href={currentUser.role === 'organizer' ? '/organizer' : '/dashboard'}
                    onClick={() => sound.playClick()}
                    className="px-6 py-3 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-2 glow-green transition-all transform hover:scale-105 cursor-pointer"
                  >
                    <Terminal className="w-4 h-4" />
                    ENTER {currentUser.role === 'organizer' ? 'ORGANIZER COMMAND' : 'CHALLENGE TERMINAL'}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  {currentUser.role === 'participant' && (
                    <Link
                      href="/lobby"
                      onClick={() => sound.playClick()}
                      className="px-5 py-3 rounded-xl text-sm bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 flex items-center gap-2 transition-all cursor-pointer"
                    >
                      WAITING ROOM LOBBY
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              /* Passwordless Team Join Form */
              <div className="bg-slate-950/90 border border-cyan-500/40 rounded-2xl p-6 sm:p-8 backdrop-blur-md glow-cyan font-mono text-left space-y-5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400 tracking-wider flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                      MENTIMETER-STYLE INSTANT TEAM ACCESS
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase">NO PASSWORD REQUIRED</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">
                    ENTER YOUR TEAM CODENAME
                  </h3>
                  <p className="text-xs text-slate-400">
                    Submit your team codename to join the symposium waiting room. The lead proctor will admit all teams and trigger the synchronized 20-minute heist.
                  </p>
                </div>

                <form onSubmit={handleJoinLobby} className="space-y-4">
                  <div>
                    <div className="relative flex items-center bg-black/80 border border-slate-700 rounded-xl focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/30 transition-all">
                      <div className="pl-4 pr-2 text-slate-500 flex items-center shrink-0">
                        <Users className="w-5 h-5 text-cyan-400" />
                      </div>
                      <input
                        type="text"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="e.g. Cyber Hawks, Bit Busters, Team Zero..."
                        maxLength={32}
                        disabled={loading}
                        autoFocus
                        required
                        className="w-full bg-transparent py-3.5 px-2 text-sm sm:text-base font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !teamName.trim()}
                    className={`w-full py-3.5 px-6 rounded-xl font-mono font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all transform cursor-pointer ${
                      teamName.trim() && !loading
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 glow-green hover:scale-[1.02] active:scale-[0.98]'
                        : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>JOINING OPERATION LOBBY...</span>
                      </>
                    ) : (
                      <>
                        <span>ENTER SYMPOSIUM WAITING ROOM</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>

                {/* Error Banner */}
                {joinError && (
                  <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/50 text-red-300 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{joinError}</span>
                  </div>
                )}

                {/* Conflict / Already In-Game State & Reconnection Request */}
                {activeConflict && (
                  <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/50 text-amber-200 text-xs space-y-3 animate-in fade-in">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-amber-300 text-sm">
                          TEAM &quot;{activeConflict.teamName}&quot; IS ALREADY ENGAGED IN THE HEIST
                        </strong>
                        <p className="text-slate-300 mt-1">
                          Another device or session is currently active at <strong>Node #{activeConflict.currentChallengeIndex}</strong> with <strong>{activeConflict.score} points</strong>. To prevent session hijacking, direct entry is blocked.
                        </p>
                      </div>
                    </div>

                    <div className="bg-black/60 p-3 rounded-lg border border-amber-500/30 space-y-2">
                      <p className="text-slate-300 text-[11px]">
                        <strong>Accidental Disconnect?</strong> If this is your team and you closed your tab, lost Wi-Fi, or refreshed your browser, click below. The proctor will verify and reconnect your device at your exact node without losing points.
                      </p>

                      {reconnectSuccess ? (
                        <div className="p-2.5 rounded bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>
                            <strong>RECONNECTION REQUEST DISPATCHED:</strong> Please notify the lead proctor at the desk to authorize your new session!
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleRequestReconnect}
                          disabled={reconnectSending}
                          className="w-full py-2 px-4 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all glow-amber"
                        >
                          {reconnectSending ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>SENDING RECONNECT ALERT TO PROCTOR...</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4" />
                              <span>REQUEST PROCTOR RECONNECTION (ACCIDENTAL DISCONNECT)</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Sub links */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                  <Link
                    href="/leaderboard"
                    onClick={() => sound.playClick()}
                    className="hover:text-cyan-400 transition-colors flex items-center gap-1.5"
                  >
                    <Trophy className="w-3.5 h-3.5 text-cyan-400" />
                    <span>VIEW LIVE LEADERBOARD</span>
                  </Link>

                  <Link
                    href="/admin/login"
                    onClick={() => sound.playClick()}
                    className="hover:text-purple-400 transition-colors flex items-center gap-1.5 text-slate-500 hover:text-slate-300"
                  >
                    <Lock className="w-3.5 h-3.5 text-purple-400" />
                    <span>PROCTOR GATEWAY (ADMIN ONLY)</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Event Specification Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 backdrop-blur-md hover:border-cyan-500/40 transition-all">
            <div className="w-8 h-8 rounded bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-xs uppercase text-slate-400 mb-1">EVENT DURATION</h3>
            <div className="text-lg font-bold text-slate-100">20 Minutes</div>
            <p className="text-[11px] text-slate-400 mt-1">Authoritative server clock synchronization.</p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 backdrop-blur-md hover:border-emerald-500/40 transition-all">
            <div className="w-8 h-8 rounded bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-xs uppercase text-slate-400 mb-1">TEAM COMPOSITION</h3>
            <div className="text-lg font-bold text-slate-100">2–3 Participants</div>
            <p className="text-[11px] text-slate-400 mt-1">Single shared terminal session per team.</p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 backdrop-blur-md hover:border-purple-500/40 transition-all">
            <div className="w-8 h-8 rounded bg-purple-950/50 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="text-xs uppercase text-slate-400 mb-1">CHALLENGE PIPELINE</h3>
            <div className="text-lg font-bold text-slate-100">10 Sequential Nodes</div>
            <p className="text-[11px] text-slate-400 mt-1">4 Decrypting, 4 Puzzles & 2 CTF flags.</p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 backdrop-blur-md hover:border-amber-500/40 transition-all">
            <div className="w-8 h-8 rounded bg-amber-950/50 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="text-xs uppercase text-slate-400 mb-1">FINAL CLEARANCE</h3>
            <div className="text-lg font-bold text-amber-300">Top 6 Venue Maps</div>
            <p className="text-[11px] text-slate-400 mt-1">First six approved teams advance to Round 2.</p>
          </div>
        </div>

        {/* Rules & Protocol Briefing */}
        <div className="bg-slate-950/80 border border-cyan-500/30 rounded-xl p-6 backdrop-blur-md glow-cyan font-mono space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              OPERATIONAL DIRECTIVES & RULES OF ENGAGEMENT
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 leading-relaxed">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">01.</span>
                <p><strong>Sequential Progression:</strong> Challenges unlock strictly one by one. You must submit the verified answer for Node N to unlock Node N+1.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">02.</span>
                <p><strong>Synchronized Launch:</strong> All admitted teams wait in the lobby until the host commences the event. The 20-minute countdown starts for everyone together.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">03.</span>
                <p><strong>50% Tactical Hint Cost:</strong> Hints reveal cryptographic methods or logic patterns, costing exactly 50% of the challenge value (e.g., a 150-pt challenge hint costs 75 pts).</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">04.</span>
                <p><strong>AI Assistance Strictly Prohibited:</strong> Using ChatGPT, Claude, Copilot, or automated AI solvers will lead to immediate disqualification by proctors.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">05.</span>
                <p><strong>Round 2 Advancement:</strong> Only the top 6 teams with verified completion of all 10 nodes receive the 3-floor VOC Block physical blueprints.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">06.</span>
                <p><strong>Disconnect Recovery:</strong> If your tab closes or Wi-Fi drops, request reconnection on this page and the proctor will verify and restore your session instantly.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950/80 py-6 text-center font-mono text-xs text-slate-500 relative z-10">
        <p>OPERATION DATA HEIST &bull; Advanced Programming Lab &bull; College Symposium 2026</p>
        <p className="text-[10px] text-slate-600 mt-1">Secured with Next.js App Router & Centralized Proctor Governance</p>
      </footer>
    </div>
  );
}
