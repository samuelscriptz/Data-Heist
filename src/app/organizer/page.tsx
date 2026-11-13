'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import HeaderNav from '@/components/HeaderNav';
import MatrixRain from '@/components/MatrixRain';
import VenueMapModal from '@/components/VenueMapModal';
import { Team, EventConfig, SubmissionRecord, VenueMapData, ActivityEvent } from '@/lib/types';
import { SERVER_CHALLENGES } from '@/lib/challenges-data';
import {
  ShieldCheck,
  Users,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  RotateCcw,
  RefreshCw,
  Eye,
  AlertTriangle,
  History,
  Terminal,
  Loader2,
  KeyRound,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Radio,
  Zap,
  Trophy,
  ExternalLink,
  Printer,
  Layers,
  ArrowRight
} from 'lucide-react';
import { sound } from '@/lib/audio';

export default function OrganizerPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    displayName: string;
    role: string;
  } | null>(null);

  const [teams, setTeams] = useState<Team[]>([]);
  const [pendingReview, setPendingReview] = useState<Team[]>([]);
  const [approvedTeams, setApprovedTeams] = useState<Team[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<SubmissionRecord[]>([]);
  const [eventConfig, setEventConfig] = useState<EventConfig | null>(null);
  const [mapQuota, setMapQuota] = useState<number>(6);
  const [mapSlotsOccupied, setMapSlotsOccupied] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [showAnswerKey, setShowAnswerKey] = useState(true);
  const [copiedAnswer, setCopiedAnswer] = useState<string | null>(null);

  // Mentimeter-style lobby and activity feed states
  const [pendingTeams, setPendingTeams] = useState<Team[]>([]);
  const [admittedTeams, setAdmittedTeams] = useState<Team[]>([]);
  const [inGameTeams, setInGameTeams] = useState<Team[]>([]);
  const [reconnectRequests, setReconnectRequests] = useState<Team[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>([]);
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  // Embedded Venue Map Viewer state
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [organizerMap, setOrganizerMap] = useState<VenueMapData | null>(null);
  const [mapModalOpen, setMapModalOpen] = useState(false);

  const floorBlueprints = [
    {
      floorNumber: 1,
      title: 'Floor 1 — Ground Level Blueprint',
      subtitle: 'Main Entrance, Reception & Primary Junction',
      imageUrl: '/floor 1.jpeg',
      clueZone: 'Floor 1 (Zone Alpha): Inspect the reception desk and primary electrical/network junction for Clue #1.',
    },
    {
      floorNumber: 2,
      title: 'Floor 2 — Mid Level Blueprint',
      subtitle: 'Computer Laboratories & Central Corridor',
      imageUrl: '/floor 2.jpeg',
      clueZone: 'Floor 2 (Zone Beta): Search the central corridor laboratories and workstation lockers for Clue #2.',
    },
    {
      floorNumber: 3,
      title: 'Floor 3 — Top Level Blueprint',
      subtitle: 'Advanced Programming Lab & Cyber Enclave',
      imageUrl: '/floor 3.jpeg',
      clueZone: 'Floor 3 (Zone Omega): Breach the final server rack alcove to locate Dropbox #3B and extract the Data Core.',
    },
  ];

  const fetchOrganizerData = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      // 1. Verify organizer session
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/admin/login');
        return;
      }
      const meData = await meRes.json();
      if (!meData.authenticated || meData.user.role !== 'organizer') {
        router.push('/admin/login');
        return;
      }
      setCurrentUser(meData.user);

      // 2. Fetch lobby & activity telemetry
      const lobbyRes = await fetch('/api/organizer/lobby');
      if (lobbyRes.ok) {
        const lobbyData = await lobbyRes.json();
        setPendingTeams(lobbyData.pendingTeams || []);
        setAdmittedTeams(lobbyData.admittedTeams || []);
        setInGameTeams(lobbyData.inGameTeams || []);
        setReconnectRequests(lobbyData.reconnectRequests || []);
        setGameStarted(lobbyData.gameStarted || false);
        setActivityFeed(lobbyData.activityFeed || []);
      }

      // 3. Fetch full team telemetry and review queue
      const res = await fetch('/api/organizer/teams');
      if (res.ok) {
        const data = await res.json();
        setTeams(data.teams || []);
        setPendingReview(data.pendingReview || []);
        setApprovedTeams(data.approvedTeams || []);
        setRecentSubmissions(data.recentSubmissions || []);
        setEventConfig(data.eventConfig || null);
        setMapQuota(data.mapQuota || 6);
        setMapSlotsOccupied(data.mapSlotsOccupied || 0);
      }
    } catch (err) {
      console.error('Failed to fetch organizer data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    fetchOrganizerData();

    // Fast polling every 3 seconds for live Mentimeter activity and countdown
    const interval = setInterval(() => {
      fetchOrganizerData(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchOrganizerData]);

  const handleCopyAnswer = (text: string) => {
    sound.playClick();
    navigator.clipboard.writeText(text);
    setCopiedAnswer(text);
    setTimeout(() => setCopiedAnswer(null), 2000);
  };

  // Lobby actions: admit, admit all, kick, approve reconnect, start game
  const handleLobbyAction = async (action: string, teamId?: string) => {
    sound.playClick();
    setActionInProgress(teamId || action);

    try {
      const res = await fetch('/api/organizer/lobby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, teamId }),
      });

      const data = await res.json();
      if (res.ok) {
        if (action === 'start_game') {
          sound.playVictory();
        } else {
          sound.playSuccess();
        }
        await fetchOrganizerData(true);
      } else {
        sound.playError();
        alert(data.error || 'Failed to execute lobby administrative action.');
      }
    } catch {
      sound.playError();
      alert('Network communication error.');
    } finally {
      setActionInProgress(null);
    }
  };

  // Approve / Reject Challenge 10 completion
  const handleReviewAction = async (teamId: string, action: 'approve' | 'reject') => {
    sound.playClick();
    setActionInProgress(teamId);

    try {
      const res = await fetch('/api/organizer/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, action }),
      });

      const data = await res.json();

      if (res.ok) {
        if (action === 'approve') sound.playSuccess();
        else sound.playAlert();
        await fetchOrganizerData(true);
      } else {
        sound.playError();
        alert(data.error || 'Failed to execute review action.');
      }
    } catch {
      sound.playError();
      alert('Network communication error.');
    } finally {
      setActionInProgress(null);
    }
  };

  // Event control action (pause, resume, reset)
  const handleEventControl = async (action: 'pause' | 'resume' | 'reset') => {
    if (action === 'reset') {
      const confirmed = window.confirm(
        'WARNING: COMPLETE RESET OF DATA HEIST EVENT?\n\nThis will completely remove all registered teams from the leaderboard, wipe all scores/submissions, and reset the 20-minute countdown back to the beginning.\n\nAre you sure you want to completely reset?'
      );
      if (!confirmed) return;
    }

    sound.playClick();
    try {
      const res = await fetch('/api/organizer/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        sound.playUnlock();
        await fetchOrganizerData(false);
      }
    } catch (err) {
      console.error('Event control error:', err);
    }
  };

  // Inspect Venue Map in modal
  const handlePreviewMap = async () => {
    sound.playClick();
    try {
      const res = await fetch('/api/venue-map');
      if (res.ok) {
        const data = await res.json();
        setOrganizerMap(data);
        setMapModalOpen(true);
      }
    } catch (err) {
      console.error('Error fetching venue map preview:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080b10] flex items-center justify-center font-mono text-amber-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-sm tracking-wider">LOADING ORGANIZER COMMAND TERMINAL...</span>
        </div>
      </div>
    );
  }

  const remainingQuota = Math.max(0, mapQuota - mapSlotsOccupied);

  // Top 10 Leaderboard ranking calculation
  const top10Teams = [...teams]
    .sort((a, b) => {
      // 1. Completion status
      if (a.isCompleted && !b.isCompleted) return -1;
      if (!a.isCompleted && b.isCompleted) return 1;

      // 2. Number of solved challenges
      const aSolved = a.isCompleted ? 10 : a.currentChallengeIndex - 1;
      const bSolved = b.isCompleted ? 10 : b.currentChallengeIndex - 1;
      if (aSolved !== bSolved) return bSolved - aSolved;

      // 3. Score (higher is better)
      if (b.score !== a.score) return b.score - a.score;

      // 4. Fewer attempts
      if (a.totalAttempts !== b.totalAttempts) return a.totalAttempts - b.totalAttempts;

      // 5. Earlier finish / last solved time
      const aTime = a.completedAt || a.lastSolvedAt || a.createdAt;
      const bTime = b.completedAt || b.lastSolvedAt || b.createdAt;
      return new Date(aTime).getTime() - new Date(bTime).getTime();
    })
    .slice(0, 10);

  const currentFloorData = floorBlueprints.find(f => f.floorNumber === selectedFloor) || floorBlueprints[0];

  return (
    <div className="min-h-screen bg-[#080b10] text-slate-100 scanlines flex flex-col relative selection:bg-amber-500 selection:text-black">
      <MatrixRain />
      <HeaderNav
        user={currentUser}
        showTimer={gameStarted}
        timerEndTime={eventConfig?.gameEndTime || eventConfig?.endTime || null}
        durationMinutes={eventConfig?.durationMinutes ?? 20}
        isPaused={eventConfig?.status === 'paused'}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 relative z-10 w-full space-y-8 font-mono">
        {/* =========================================================================
            HEADER TITLE & EVENT STATUS
           ========================================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-amber-500/30">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] bg-amber-950/40 text-amber-400 border border-amber-500/30 mb-1 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              RESTRICTED PROCTOR COMMAND &bull; ORGANIZER CLEARANCE
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-wider">
              OPERATION DATA HEIST // PROCTOR CONSOLE
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Centralized Mentimeter-style host start, device disconnect restoration, live telemetry & first-six map quota.
            </p>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviewMap}
              className="px-3 py-1.5 rounded text-xs bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 cursor-pointer glow-green"
              title="Preview Venue Blueprint Fullscreen"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>MAP BLUEPRINT</span>
            </button>

            {eventConfig?.status === 'active' ? (
              <button
                onClick={() => handleEventControl('pause')}
                className="px-3 py-1.5 rounded text-xs bg-amber-950/40 hover:bg-amber-950/60 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>PAUSE</span>
              </button>
            ) : (
              <button
                onClick={() => handleEventControl('resume')}
                className="px-3 py-1.5 rounded text-xs bg-emerald-950/40 hover:bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>RESUME</span>
              </button>
            )}

            <button
              onClick={() => handleEventControl('reset')}
              className="px-3 py-1.5 rounded text-xs bg-red-950/40 hover:bg-red-950/60 text-red-300 border border-red-500/40 flex items-center gap-1.5 cursor-pointer"
              title="Reset all team progress and return to waiting room"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET RUN</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                fetchOrganizerData();
              }}
              disabled={refreshing}
              className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-800 cursor-pointer transition-colors"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* =========================================================================
            MENTIMETER-STYLE SYNCHRONIZED START BAR (HERO PROCTOR ACTION)
           ========================================================================= */}
        <div className={`rounded-2xl p-6 sm:p-7 border-2 backdrop-blur-md transition-all ${
          gameStarted
            ? 'bg-emerald-950/30 border-emerald-500/50 glow-green'
            : 'bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-slate-950/60 border-amber-500/60 glow-amber'
        }`}>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2">
                <span className={`w-3 h-3 rounded-full ${gameStarted ? 'bg-emerald-400 animate-ping' : 'bg-amber-400 animate-pulse'}`} />
                <span className="text-xs uppercase font-bold tracking-widest text-slate-300">
                  {gameStarted ? 'OPERATION IN PROGRESS // 20-MINUTE SYNCHRONIZED CLOCK RUNNING' : 'LOBBY WAITING ROOM OPEN // HOST COMMENCEMENT READY'}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-100">
                {gameStarted
                  ? 'COMMENCED: ALL ADMITTED TEAMS ACTIVELY DECODING'
                  : 'SYNCHRONIZED EVENT COMMENCEMENT (MENTIMETER-STYLE)'}
              </h2>

              <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                {gameStarted
                  ? `Authoritative 20-minute countdown active. All admitted teams were automatically transitioned from the waiting room into Node #1.`
                  : `Teams enter their codename on the homepage to queue in the lobby. Once you verify the teams present in the hall, click Start below to commence the 20-minute heist simultaneously for all admitted screens.`}
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-1 text-xs text-slate-300">
                <span className="px-2.5 py-1 rounded bg-black/60 border border-slate-700">
                  Pending in Lobby: <strong className="text-amber-400">{pendingTeams.length}</strong>
                </span>
                <span className="px-2.5 py-1 rounded bg-black/60 border border-slate-700">
                  Admitted &amp; Ready: <strong className="text-emerald-400">{admittedTeams.length}</strong>
                </span>
                <span className="px-2.5 py-1 rounded bg-black/60 border border-slate-700">
                  Currently In-Game: <strong className="text-cyan-400">{inGameTeams.length}</strong>
                </span>
              </div>
            </div>

            {/* Start & Admit CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full lg:w-auto">
              {!gameStarted ? (
                <>
                  {pendingTeams.length > 0 && (
                    <button
                      onClick={() => handleLobbyAction('admit_all')}
                      disabled={actionInProgress === 'admit_all'}
                      className="w-full sm:w-auto px-5 py-3.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <CheckCircle className="w-4 h-4 text-cyan-400" />
                      <span>ADMIT ALL ({pendingTeams.length})</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleLobbyAction('start_game')}
                    disabled={actionInProgress === 'start_game'}
                    className="w-full sm:w-auto px-8 py-4 rounded-xl font-black text-sm sm:text-base bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center gap-3 glow-green transition-all transform hover:scale-105 active:scale-95 cursor-pointer shadow-xl shadow-emerald-500/20"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>COMMENCE DATA HEIST (START 20-MIN EVENT)</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  {pendingTeams.length > 0 && (
                    <button
                      onClick={() => handleLobbyAction('admit_all')}
                      disabled={actionInProgress === 'admit_all'}
                      className="w-full sm:w-auto px-5 py-3.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center gap-2 cursor-pointer transition-all glow-green shadow-lg animate-pulse"
                      title="Admit all late joiners directly into active game"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>ADMIT LATE TEAMS TO GAME ({pendingTeams.length})</span>
                    </button>
                  )}

                  <div className="flex items-center gap-3 bg-black/60 px-5 py-3 rounded-xl border border-emerald-500/40">
                    <Clock className="w-5 h-5 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">EVENT STATUS</span>
                      <span className="text-xs font-bold text-emerald-300">
                        {eventConfig?.status === 'paused' ? 'EVENT PAUSED' : 'SERVER CLOCK LIVE'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            URGENT ALERT: DEVICE RECONNECTION REQUESTS (ACCIDENTAL DISCONNECTS)
           ========================================================================= */}
        {reconnectRequests.length > 0 && (
          <div className="bg-amber-950/50 border-2 border-amber-500 rounded-2xl p-5 glow-amber space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-amber-500/40 pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400 animate-bounce" />
                <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
                  DEVICE RECONNECTION REQUESTS PENDING VERIFICATION ({reconnectRequests.length})
                </h2>
              </div>
              <span className="text-xs text-amber-200">
                Confirm team identity in person before authorizing
              </span>
            </div>

            <p className="text-xs text-slate-300">
              The following teams experienced a browser crash, closed tab, or network drop and requested device re-authorization. Once confirmed, click <strong>AUTHORIZE RECONNECTION</strong> to restore their exact node and score without penalty.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {reconnectRequests.map((t) => (
                <div
                  key={t.id}
                  className="bg-black/70 border border-amber-500/40 rounded-xl p-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-amber-400" />
                      <span>{t.name}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 space-x-2">
                      <span>Target: <strong className="text-cyan-400">Node #{t.currentChallengeIndex}</strong></span>
                      <span>&bull;</span>
                      <span>Score: <strong className="text-emerald-400">{t.score} pts</strong></span>
                      <span>&bull;</span>
                      <span>Attempts: {t.totalAttempts}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Requested at: {t.reconnectRequestedAt ? new Date(t.reconnectRequestedAt).toLocaleTimeString() : 'Just now'}
                    </div>
                  </div>

                  <button
                    onClick={() => handleLobbyAction('approve_reconnect', t.id)}
                    disabled={actionInProgress === t.id}
                    className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0 glow-green cursor-pointer transition-all"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>AUTHORIZE RECONNECTION</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TELEMETRY STAT CARDS
           ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Map Reveal Quota */}
          <div className="bg-slate-950/80 border border-emerald-500/40 rounded-xl p-5 glow-green">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>VENUE MAP QUOTA (ROUND 2)</span>
              <MapPin className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">
              {mapSlotsOccupied} / {mapQuota} CLAIMED
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {remainingQuota > 0 ? `${remainingQuota} slots open for first finishers` : 'All 6 slots allocated'}
            </div>
          </div>

          {/* Pending Reviews */}
          <div className={`bg-slate-950/80 border rounded-xl p-5 ${pendingReview.length > 0 ? 'border-amber-500/50 glow-amber' : 'border-slate-800'}`}>
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>NODE 10 REVIEW QUEUE</span>
              <AlertTriangle className={`w-4 h-4 ${pendingReview.length > 0 ? 'text-amber-400 animate-bounce' : 'text-slate-600'}`} />
            </div>
            <div className={`text-2xl font-black ${pendingReview.length > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
              {pendingReview.length} TEAMS
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Challenge 10 completed, awaiting proctor sign-off
            </div>
          </div>

          {/* Registered Teams */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>TOTAL REGISTERED TEAMS</span>
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-slate-100">
              {teams.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {inGameTeams.length} in game &bull; {pendingTeams.length} waiting
            </div>
          </div>

          {/* Total Submissions */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>TOTAL ATTEMPTS DISPATCHED</span>
              <Terminal className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-300">
              {teams.reduce((acc, t) => acc + t.totalAttempts, 0)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Server evaluated with rate-limiting
            </div>
          </div>
        </div>

        {/* =========================================================================
            WAITING ROOM / LOBBY QUEUE SECTION (ALWAYS VISIBLE WHEN TEAMS ARE WAITING)
           ========================================================================= */}
        {pendingTeams.length > 0 && (
          <div className="bg-slate-950/90 border border-cyan-500/40 rounded-xl overflow-hidden glow-cyan">
            <div className="bg-slate-900/90 px-6 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                  {gameStarted
                    ? `LATE-JOINING TEAMS IN WAITING ROOM (${pendingTeams.length})`
                    : `WAITING ROOM ADMISSIONS QUEUE (${pendingTeams.length})`}
                </h2>
              </div>
              <button
                onClick={() => handleLobbyAction('admit_all')}
                className="px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer glow-green shadow-md"
              >
                {gameStarted ? 'ADMIT ALL TO LIVE GAME' : 'ADMIT ALL TEAMS'}
              </button>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {pendingTeams.map((t) => (
                <div
                  key={t.id}
                  className="bg-black/60 border border-slate-800 rounded-lg p-3 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-200 truncate">{t.name}</div>
                    <div className="text-[10px] text-slate-500">
                      Joined: {new Date(t.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleLobbyAction('admit', t.id)}
                      className="px-2.5 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold cursor-pointer"
                    >
                      {gameStarted ? 'ADMIT TO GAME' : 'ADMIT'}
                    </button>
                    <button
                      onClick={() => handleLobbyAction('kick', t.id)}
                      className="px-2 py-1 rounded bg-red-950/40 hover:bg-red-900 text-red-300 border border-red-500/30 text-[11px] cursor-pointer"
                    >
                      KICK
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION: TOP 1 TO 10 LIVE LEADERBOARD
           ========================================================================= */}
        <div className="bg-slate-950/90 border border-cyan-500/40 rounded-xl overflow-hidden glow-cyan">
          <div className="bg-cyan-950/30 px-6 py-3.5 border-b border-cyan-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-cyan-400" />
              <h2 className="text-sm font-bold text-cyan-300 uppercase tracking-wider">
                TOP 1 TO 10 LIVE LEADERBOARD
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">
              Live ranking &bull; Top 6 qualify for VOC Block Map
            </span>
          </div>

          {top10Teams.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No active teams registered yet. Teams will appear here as they join and solve challenges.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/60 text-[11px] uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 text-center">RANK</th>
                    <th className="py-3 px-4">TEAM NAME</th>
                    <th className="py-3 px-4">CURRENT TARGET / STATUS</th>
                    <th className="py-3 px-4 text-center">SOLVED NODES</th>
                    <th className="py-3 px-4 text-center">SCORE</th>
                    <th className="py-3 px-4 text-center">ATTEMPTS</th>
                    <th className="py-3 px-4 text-center">MAP CLEARANCE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  {top10Teams.map((t, idx) => {
                    const rank = idx + 1;
                    const solvedCount = t.isCompleted ? 10 : t.currentChallengeIndex - 1;
                    const currentCh = SERVER_CHALLENGES.find(c => c.id === t.currentChallengeIndex);

                    return (
                      <tr
                        key={t.id}
                        className={`transition-colors ${
                          rank === 1
                            ? 'bg-amber-500/10 hover:bg-amber-500/15'
                            : rank <= 3
                            ? 'bg-cyan-950/20 hover:bg-cyan-950/30'
                            : rank <= 6
                            ? 'hover:bg-slate-900/40'
                            : 'hover:bg-slate-900/20 opacity-80'
                        }`}
                      >
                        {/* Rank Badge */}
                        <td className="py-3 px-4 text-center font-bold">
                          {rank === 1 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-400/30">
                              #1
                            </span>
                          ) : rank === 2 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-950 font-black text-xs">
                              #2
                            </span>
                          ) : rank === 3 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs">
                              #3
                            </span>
                          ) : (
                            <span className="text-slate-400 font-bold">#{rank}</span>
                          )}
                        </td>

                        {/* Team Name */}
                        <td className="py-3 px-4 font-bold text-slate-100">
                          {t.name}
                          {rank <= 6 && (
                            <span className="ml-2 text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-bold">
                              TOP 6 QUALIFY
                            </span>
                          )}
                        </td>

                        {/* Current Target */}
                        <td className="py-3 px-4">
                          {t.isCompleted ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              ALL 10 SOLVED
                            </span>
                          ) : currentCh ? (
                            <span className="text-cyan-300">
                              Node #{currentCh.id}: {currentCh.title}
                            </span>
                          ) : (
                            <span className="text-slate-500">WAITING</span>
                          )}
                        </td>

                        {/* Solved Count */}
                        <td className="py-3 px-4 text-center font-bold text-emerald-400">
                          {solvedCount} / 10
                        </td>

                        {/* Score */}
                        <td className="py-3 px-4 text-center font-bold text-amber-300 text-sm">
                          {t.score} pts
                        </td>

                        {/* Total Attempts */}
                        <td className="py-3 px-4 text-center text-slate-400">
                          {t.totalAttempts}
                        </td>

                        {/* Map Access Status */}
                        <td className="py-3 px-4 text-center">
                          {t.mapEligible ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                              APPROVED (SLOT #{t.finishRank})
                            </span>
                          ) : rank <= 6 ? (
                            <span className="text-cyan-400 text-[10px]">
                              ELIGIBLE ON FINISH
                            </span>
                          ) : (
                            <span className="text-slate-600 text-[10px]">
                              OUTSIDE TOP 6
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* =========================================================================
            CHALLENGE 10 COMPLETION REVIEW QUEUE (FIRST-SIX RACE GATEKEEPER)
           ========================================================================= */}
        <div className="bg-slate-950/90 border-2 border-amber-500/40 rounded-xl overflow-hidden glow-amber">
          <div className="bg-amber-950/30 px-6 py-3.5 border-b border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
                CHALLENGE 10 COMPLETION REVIEW QUEUE ({pendingReview.length})
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">
              Authoritative First-Six Race Gatekeeper
            </span>
          </div>

          {pendingReview.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No teams are currently awaiting review. As teams solve Node #10, their server timestamps will lock here for proctor review.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/60 text-[11px] uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">TEAM NAME</th>
                    <th className="py-3 px-4">SERVER TIME LOCKED</th>
                    <th className="py-3 px-4 text-center">SCORE</th>
                    <th className="py-3 px-4 text-center">ATTEMPTS</th>
                    <th className="py-3 px-4 text-center">MAP ELIGIBILITY</th>
                    <th className="py-3 px-4 text-right">PROCTOR ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {pendingReview.map((t) => (
                    <tr key={t.id} className="bg-amber-950/10 hover:bg-amber-950/20 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-100">
                        {t.name}
                        <span className="block text-[10px] text-slate-500">@{t.username}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="flex items-center gap-1 text-slate-200">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          {t.completedAt ? new Date(t.completedAt).toLocaleTimeString() : '—'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-400">
                        {t.score}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-400">
                        {t.totalAttempts}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {mapSlotsOccupied < mapQuota ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/50 text-emerald-300 border border-emerald-500/40 font-bold">
                            WILL QUALIFY (SLOT #{mapSlotsOccupied + 1})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                            QUOTA FULL (FINISH ONLY)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleReviewAction(t.id, 'approve')}
                            disabled={actionInProgress === t.id}
                            className="px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all glow-green"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            APPROVE
                          </button>
                          <button
                            onClick={() => handleReviewAction(t.id, 'reject')}
                            disabled={actionInProgress === t.id}
                            className="px-3 py-1.5 rounded bg-red-950/50 hover:bg-red-900 text-red-300 border border-red-500/30 text-xs flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            REJECT
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* =========================================================================
            EMBEDDED 3-FLOOR VENUE MAP VIEWER (DIRECTLY ACCESSIBLE BY ADMIN)
           ========================================================================= */}
        <div className="bg-slate-950/90 border border-emerald-500/40 rounded-xl overflow-hidden glow-green">
          <div className="bg-emerald-950/30 px-6 py-4 border-b border-emerald-500/30 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="text-sm font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                  VOC BLOCK 3-FLOOR VENUE BLUEPRINTS
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">
                    ROUND 2 TARGET ZONES
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Floors 1, 2, and 3 only. Floors 4 and 5 are strictly restricted.
                </p>
              </div>
            </div>

            {/* Floor Navigation Buttons */}
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((fNum) => (
                <button
                  key={fNum}
                  onClick={() => {
                    sound.playClick();
                    setSelectedFloor(fNum);
                  }}
                  className={`px-3 py-1.5 rounded text-xs font-bold font-mono transition-all cursor-pointer ${
                    selectedFloor === fNum
                      ? 'bg-emerald-500 text-slate-950 glow-green'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  FLOOR {fNum}
                </button>
              ))}

              <button
                onClick={handlePreviewMap}
                className="px-3 py-1.5 rounded text-xs bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 cursor-pointer ml-2"
                title="Open interactive blueprint modal"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>EXPAND</span>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Floor Info Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <div>
                <span className="text-xs font-bold text-emerald-400">
                  {currentFloorData.title}
                </span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  {currentFloorData.subtitle}
                </span>
              </div>
              <div className="text-xs text-slate-300 font-bold bg-black/60 px-3 py-1.5 rounded border border-emerald-500/30">
                {currentFloorData.clueZone}
              </div>
            </div>

            {/* Blueprint Image Display */}
            <div className="relative w-full h-[450px] bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
              <Image
                src={currentFloorData.imageUrl}
                alt={currentFloorData.title}
                fill
                className="object-contain p-2"
                priority
              />
            </div>
          </div>
        </div>

        {/* =========================================================================
            LIVE PARTICIPANT ACTIVITY TELEMETRY FEED (REAL-TIME STREAM)
           ========================================================================= */}
        <div className="bg-slate-950/90 border border-cyan-500/40 rounded-xl overflow-hidden glow-cyan">
          <div className="bg-slate-900/90 px-6 py-3.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                LIVE PARTICIPANT ACTIVITY TELEMETRY STREAM
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Auto-syncs every 3 seconds
            </span>
          </div>

          <div className="p-4 max-h-64 overflow-y-auto font-mono text-xs space-y-2 bg-black/40">
            {activityFeed.length === 0 ? (
              <div className="text-slate-500 text-center py-6">
                Waiting for participant events. Infiltration actions will stream here live.
              </div>
            ) : (
              activityFeed.map((ev) => {
                let badgeClass = 'bg-slate-800 text-slate-300 border-slate-700';
                if (ev.type === 'node_solved' || ev.type === 'completed' || ev.type === 'admitted') {
                  badgeClass = 'bg-emerald-950 text-emerald-300 border-emerald-500/40';
                } else if (ev.type === 'wrong_answer') {
                  badgeClass = 'bg-red-950 text-red-300 border-red-500/40';
                } else if (ev.type === 'hint_unlocked' || ev.type === 'reconnect_requested') {
                  badgeClass = 'bg-amber-950 text-amber-300 border-amber-500/40';
                } else if (ev.type === 'game_start') {
                  badgeClass = 'bg-purple-950 text-purple-300 border-purple-500/40';
                }

                return (
                  <div
                    key={ev.id}
                    className="p-2 rounded bg-slate-900/60 border border-slate-800/80 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-[10px] text-slate-500 shrink-0 mt-0.5">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase border shrink-0 ${badgeClass}`}>
                        {ev.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-slate-200">
                        {ev.message}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* =========================================================================
            FULL PARTICIPATING TEAMS MONITOR TABLE
           ========================================================================= */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden">
          <div className="bg-slate-900/80 px-6 py-3.5 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              ALL PARTICIPATING TEAMS TELEMETRY ({teams.length})
            </h2>
            <span className="text-xs text-slate-400">Live sequential progression</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/40 text-[11px] uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">TEAM</th>
                  <th className="py-3 px-4">CURRENT TARGET / CHALLENGE</th>
                  <th className="py-3 px-4 text-center">SOLVED COUNT</th>
                  <th className="py-3 px-4 text-center">SCORE</th>
                  <th className="py-3 px-4 text-center">TOTAL ATTEMPTS</th>
                  <th className="py-3 px-4 text-center">REVIEW STATUS</th>
                  <th className="py-3 px-4 text-center">MAP ACCESS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {teams.map((t) => {
                  const solvedCount = t.isCompleted ? 10 : t.currentChallengeIndex - 1;
                  const currentCh = SERVER_CHALLENGES.find(c => c.id === t.currentChallengeIndex);

                  return (
                    <tr key={t.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-200">
                        {t.name}
                        <span className="block text-[10px] text-slate-500">@{t.username}</span>
                      </td>

                      <td className="py-3 px-4">
                        {t.isCompleted ? (
                          <span className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 w-fit">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            ALL 10 SOLVED ({t.reviewStatus === 'approved' ? `APPROVED #${t.finishRank}` : 'AWAITING APPROVAL'})
                          </span>
                        ) : currentCh ? (
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                                NODE #{currentCh.id}
                              </span>
                              <span className="text-xs font-bold text-slate-200">
                                {currentCh.title}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                              <span>{currentCh.category}</span>
                              <span>&bull;</span>
                              <span className="text-cyan-400 font-mono">{currentCh.points} pts</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs font-mono">WAITING IN LOBBY</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center text-emerald-400 font-bold">
                        {solvedCount} / 10
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-cyan-300">
                        {t.score}
                      </td>

                      <td className="py-3 px-4 text-center text-slate-400">
                        {t.totalAttempts}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {t.reviewStatus === 'approved' && (
                          <span className="text-emerald-400 font-bold text-[11px]">APPROVED #{t.finishRank}</span>
                        )}
                        {t.reviewStatus === 'pending' && (
                          <span className="text-amber-400 font-bold text-[11px] animate-pulse">PENDING REVIEW</span>
                        )}
                        {t.reviewStatus === 'rejected' && (
                          <span className="text-red-400 font-bold text-[11px]">REJECTED</span>
                        )}
                        {t.reviewStatus === 'none' && (
                          <span className="text-slate-500 text-[11px]">IN PROGRESS</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {t.mapEligible ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                            REVEALED (RANK #{t.finishRank})
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[11px]">RESTRICTED</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* =========================================================================
            MASTER CHALLENGE ANSWERS & VERIFICATION MATRIX (ALL 10 NODES)
           ========================================================================= */}
        <div className="bg-slate-950/90 border-2 border-emerald-500/40 rounded-xl overflow-hidden glow-green">
          <div
            onClick={() => setShowAnswerKey(!showAnswerKey)}
            className="bg-emerald-950/40 px-6 py-4 border-b border-emerald-500/30 flex items-center justify-between cursor-pointer select-none hover:bg-emerald-950/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              <KeyRound className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="text-sm font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                  MASTER CHALLENGE ANSWERS &amp; VERIFICATION MATRIX
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40 font-mono">
                    10 NODES (OFFICIAL PROCTOR KEY)
                  </span>
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Complete answer reference in UPPERCASE, decryption algorithms, clues, and 50% hint penalty costs.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-emerald-400">
              <span className="text-xs">{showAnswerKey ? 'COLLAPSE' : 'EXPAND'}</span>
              {showAnswerKey ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>

          {showAnswerKey && (
            <div className="p-6 space-y-4 font-mono animate-in fade-in duration-300">
              <div className="grid grid-cols-1 gap-4">
                {SERVER_CHALLENGES.map((ch) => {
                  const acceptedUpper = ch.acceptedAnswers[0];
                  const isCopied = copiedAnswer === acceptedUpper;

                  return (
                    <div
                      key={ch.id}
                      className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 hover:border-emerald-500/40 transition-colors space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                            NODE #{ch.id}
                          </span>
                          <span className="text-sm font-bold text-slate-100">
                            {ch.title}
                          </span>
                          <span className="text-[11px] px-2 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {ch.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-emerald-400 font-bold">+{ch.points} PTS</span>
                          <span className="text-amber-400">HINT: -{ch.hintCost ?? Math.floor(ch.points / 2)} PTS (50%)</span>
                        </div>
                      </div>

                      {/* Clue & Solution Key */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 text-xs">
                        <div className="lg:col-span-4 space-y-1">
                          <span className="text-[10px] uppercase text-slate-500 block">CLUE / CIPHERTEXT:</span>
                          <div className="bg-black/60 p-2.5 rounded border border-slate-800 text-slate-300 text-[11px] break-all font-mono">
                            {ch.clue}
                          </div>
                        </div>

                        <div className="lg:col-span-4 space-y-1">
                          <span className="text-[10px] uppercase text-slate-500 block">METHODOLOGY / ALGORITHM:</span>
                          <div className="bg-black/60 p-2.5 rounded border border-slate-800 text-slate-300 text-[11px] leading-relaxed">
                            {ch.hintText}
                          </div>
                        </div>

                        <div className="lg:col-span-4 space-y-1">
                          <span className="text-[10px] uppercase text-emerald-400 font-bold block">
                            CORRECT ANSWER (UPPERCASE):
                          </span>
                          <div className="bg-emerald-950/30 border border-emerald-500/40 rounded p-2 flex items-center justify-between gap-2">
                            <code className="text-xs font-black text-emerald-300 tracking-wider">
                              {acceptedUpper}
                            </code>
                            <button
                              onClick={() => handleCopyAnswer(acceptedUpper)}
                              className="p-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-colors cursor-pointer shrink-0"
                              title="Copy uppercase answer"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          {ch.acceptedAnswers.length > 1 && (
                            <span className="text-[10px] text-slate-500 block">
                              Also accepts: {ch.acceptedAnswers.slice(1).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Venue Map Inspection Modal */}
      {organizerMap && (
        <VenueMapModal
          isOpen={mapModalOpen}
          onClose={() => setMapModalOpen(false)}
          mapData={organizerMap}
        />
      )}
    </div>
  );
}
