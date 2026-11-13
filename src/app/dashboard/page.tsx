'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import HeaderNav from '@/components/HeaderNav';
import MatrixRain from '@/components/MatrixRain';
import EventCountdown from '@/components/EventCountdown';
import ChallengeProgressMap, { MapNode } from '@/components/ChallengeProgressMap';
import ChallengeTerminal from '@/components/ChallengeTerminal';
import CompletionReviewScreen from '@/components/CompletionReviewScreen';
import { ParticipantChallenge, Team } from '@/lib/types';
import { 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  Radio
} from 'lucide-react';
import { sound } from '@/lib/audio';

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    displayName: string;
    role: string;
    teamId?: string;
  } | null>(null);

  const [team, setTeam] = useState<Team | null>(null);
  const [mapNodes, setMapNodes] = useState<MapNode[]>([]);
  const [activeChallenge, setActiveChallenge] = useState<ParticipantChallenge | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      // 1. Fetch user session
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/');
        return;
      }
      const meData = await meRes.json();
      if (!meData.authenticated) {
        router.push('/');
        return;
      }
      setCurrentUser(meData.user);

      // If user is an organizer, redirect to organizer console
      if (meData.user.role === 'organizer') {
        router.push('/organizer');
        return;
      }

      // 2. Fetch challenge state
      const chRes = await fetch('/api/challenges/current');
      if (!chRes.ok) {
        const errData = await chRes.json();
        setError(errData.error || 'Failed to load challenge state.');
        return;
      }

      const chData = await chRes.json();
      const currentTeam = chData.team as Team;
      setTeam(currentTeam);
      setMapNodes(chData.mapNodes || []);
      setActiveChallenge(chData.activeChallenge);

      // Route guard: only redirect to /lobby when lobbyStatus is EXPLICITLY a
      // pre-game value. If lobbyStatus is undefined (stripped by old API shape) or
      // 'in_game', the team stays on the dashboard.
      if (
        currentTeam &&
        currentTeam.lobbyStatus &&
        (currentTeam.lobbyStatus === 'pending_admission' ||
          currentTeam.lobbyStatus === 'admitted') &&
        !currentTeam.isCompleted
      ) {
        router.push('/lobby');
        return;
      }

      // Set selected node to current unlocked node by default
      if (currentTeam) {
        setSelectedNodeId(Math.min(10, currentTeam.currentChallengeIndex));
      }
    } catch {
      setError('Network synchronization failure.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    fetchDashboardData();

    // Periodic sync every 15s to keep clock and state verified with server
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const handleSelectNode = async (nodeId: number) => {
    setSelectedNodeId(nodeId);

    // If it's the current active challenge, re-render active challenge
    if (team && nodeId === team.currentChallengeIndex && !team.isCompleted) {
      // Re-fetch to ensure fresh data
      fetchDashboardData(true);
      return;
    }

    // If it's a previously solved challenge, synthesize a read-only view
    const node = mapNodes.find(n => n.id === nodeId);
    if (node && node.status === 'completed') {
      setActiveChallenge({
        id: node.id,
        title: node.title,
        category: node.category as any,
        difficulty: node.difficulty as any,
        points: node.points,
        hintCost: Math.floor(node.points / 2),
        description: `This sector was successfully breached. Cryptographic override verified.`,
        clue: `Sector completed and saved to the central mainframe.`,
        artifactType: 'terminal_log',
        artifactContent: `[VERIFIED] NODE #${node.id} SECURED BY TEAM\nSTATUS: ACCESS_GRANTED`,
        answerFormatHint: 'COMPLETED',
        hasHint: false,
        hintPenaltySeconds: 0,
        isUnlocked: true,
        isSolved: true,
      });
    }
  };

  const handleAnswerSolved = (newChallengeIndex: number, isFinished: boolean) => {
    // Re-fetch dashboard data to update progress
    fetchDashboardData(true);
    if (!isFinished) {
      setSelectedNodeId(Math.min(10, newChallengeIndex));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080b10] flex items-center justify-center font-mono text-emerald-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-sm tracking-wider">CONNECTING TO SECURE MAINFRAME...</span>
        </div>
      </div>
    );
  }

  if (error && !team) {
    return (
      <div className="min-h-screen bg-[#080b10] flex items-center justify-center p-4 font-mono">
        <div className="bg-red-950/40 border border-red-500/50 rounded-xl p-6 text-center max-w-md space-y-4">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <p className="text-sm text-red-200">{error}</p>
          <button
            onClick={() => fetchDashboardData()}
            className="px-4 py-2 bg-red-900/60 hover:bg-red-900 text-red-100 rounded text-xs cursor-pointer"
          >
            RETRY CONNECTION
          </button>
        </div>
      </div>
    );
  }

  const isAllSolved = team?.isCompleted || (team && team.currentChallengeIndex > 10);

  return (
    <div className="min-h-screen bg-[#080b10] text-slate-100 scanlines flex flex-col relative selection:bg-emerald-500 selection:text-black">
      <MatrixRain />
      <HeaderNav 
        user={currentUser} 
        showTimer={true} 
        timerEndTime={team?.timerEndTime} 
        durationMinutes={team?.durationMinutes || 20} 
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 relative z-10 w-full space-y-6">
        {/* Error notification banner if any */}
        {error && (
          <div className="p-3 rounded-lg bg-red-950/50 border border-red-500/50 text-red-300 text-xs font-mono flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button 
              onClick={() => setError(null)} 
              className="text-red-400 hover:text-red-200 text-xs uppercase underline ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* =========================================================================
            TWO-COLUMN WORKSPACE: 
            - LEFT COLUMN: Sticky Vertical Challenge Pipeline Map (Top-Left Corner)
            - RIGHT COLUMN: Top HUD (Team Info + 20-Min Countdown) + Challenge Terminal / Completion Chamber
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-500">
          {/* LEFT COLUMN: Sticky Vertical Challenge Pipeline at top-left corner */}
          <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-20 z-20 space-y-4">
            <ChallengeProgressMap
              nodes={mapNodes}
              activeChallengeId={selectedNodeId}
              onSelectNode={handleSelectNode}
              layout="vertical"
            />
          </div>

          {/* RIGHT COLUMN: HUD Header (Timer + Team status) + Active Workspace */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            {/* Top Info & 20-Minute Countdown Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Team Status Card */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 font-mono flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block flex items-center gap-1">
                    <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                    TEAM CODENAME
                  </span>
                  <div className="text-base font-bold text-cyan-300 truncate max-w-[200px]">
                    {team?.name || 'DATA HEIST PARTICIPANT'}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Score: <span className="text-emerald-400 font-bold">{team?.score || 0} pts</span> &bull; Attempts: {team?.totalAttempts || 0}
                  </div>
                </div>

                <button
                  onClick={() => {
                    sound.playClick();
                    fetchDashboardData();
                  }}
                  disabled={refreshing}
                  className="p-2 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 border border-slate-800 cursor-pointer transition-colors"
                  title="Sync terminal with server"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
                </button>
              </div>

              {/* 20-Minute Authoritative Countdown Clock */}
              <div className="md:col-span-2">
                <EventCountdown 
                  endTime={team?.timerEndTime} 
                  durationMinutes={team?.durationMinutes || 20}
                  title="20-MINUTE HEIST COUNTDOWN"
                  onTimeExpired={() => {
                    fetchDashboardData(true);
                  }}
                />
              </div>
            </div>

            {/* If team solved all 10 challenges: Show Completion Chamber */}
            {isAllSolved ? (
              <CompletionReviewScreen
                completedAt={team?.completedAt || null}
                reviewStatus={team?.reviewStatus || 'none'}
                mapEligible={!!team?.mapEligible}
                finishRank={team?.finishRank || null}
                teamName={team?.name || 'Your Team'}
              />
            ) : (
              /* Focused Challenge Terminal */
              <ChallengeTerminal
                challenge={activeChallenge}
                onAnswerSolved={handleAnswerSolved}
                isCompletedEvent={false}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
