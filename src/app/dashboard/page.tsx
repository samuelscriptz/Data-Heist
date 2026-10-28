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
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
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
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      if (!meData.authenticated) {
        router.push('/login');
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
      setTeam(chData.team);
      setMapNodes(chData.mapNodes || []);
      setActiveChallenge(chData.activeChallenge);

      // Set selected node to current unlocked node by default
      if (chData.team) {
        setSelectedNodeId(Math.min(10, chData.team.currentChallengeIndex));
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
  }, [fetchDashboardData]);

  const handleSelectNode = async (nodeId: number) => {
    setSelectedNodeId(nodeId);

    // If it's the current active challenge, use activeChallenge
    if (team && nodeId === team.currentChallengeIndex && !team.isCompleted) {
      // already in activeChallenge
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
        description: `This sector was successfully breached. System logs show cryptographic override verified.`,
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

  if (error) {
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
      <HeaderNav user={currentUser} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 relative z-10 w-full space-y-6">
        {/* Top Info & Countdown Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
          {/* Team Status Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 font-mono flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block">
                TEAM CODENAME
              </span>
              <div className="text-base font-bold text-cyan-300">
                {team?.name || 'DATA HEIST PARTICIPANT'}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Current Score: <span className="text-emerald-400 font-bold">{team?.score || 0} pts</span> &bull; Attempts: {team?.totalAttempts || 0}
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

          {/* Countdown Clock */}
          <div className="lg:col-span-2">
            <EventCountdown />
          </div>
        </div>

        {/* 10 Challenge Progress Map */}
        <ChallengeProgressMap
          nodes={mapNodes}
          activeChallengeId={selectedNodeId}
          onSelectNode={handleSelectNode}
        />

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
      </main>
    </div>
  );
}
