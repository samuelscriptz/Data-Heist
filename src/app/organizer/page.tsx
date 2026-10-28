'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import HeaderNav from '@/components/HeaderNav';
import MatrixRain from '@/components/MatrixRain';
import VenueMapModal from '@/components/VenueMapModal';
import { Team, EventConfig, SubmissionRecord, VenueMapData } from '@/lib/types';
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
  Loader2
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

  // Venue map modal for organizer inspection
  const [organizerMap, setOrganizerMap] = useState<VenueMapData | null>(null);
  const [mapModalOpen, setMapModalOpen] = useState(false);

  const fetchOrganizerData = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      // 1. Verify organizer session
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      if (!meData.authenticated || meData.user.role !== 'organizer') {
        router.push('/login');
        return;
      }
      setCurrentUser(meData.user);

      // 2. Fetch full telemetry
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

    // Auto-refresh every 6 seconds for live monitoring
    const interval = setInterval(() => {
      fetchOrganizerData(true);
    }, 6000);

    return () => clearInterval(interval);
  }, [fetchOrganizerData]);

  // Approve / Reject completion
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
        'WARNING: RESET DATA HEIST EVENT?\n\nThis will reset all team challenge progression, clear submissions, and reset map reveal slots. Confirm?'
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
        await fetchOrganizerData(true);
      }
    } catch (err) {
      console.error('Event control error:', err);
    }
  };

  // Inspect Venue Map as Organizer
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

  return (
    <div className="min-h-screen bg-[#080b10] text-slate-100 scanlines flex flex-col relative selection:bg-amber-500 selection:text-black">
      <MatrixRain />
      <HeaderNav user={currentUser} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 relative z-10 w-full space-y-8 font-mono">
        {/* Title Bar & Event Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-amber-500/30">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] bg-amber-950/40 text-amber-400 border border-amber-500/30 mb-1 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              RESTRICTED PROCTOR CONSOLE // ROLE: ORGANIZER
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-wider">
              DATA HEIST COMMAND CENTER
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Live team telemetry, challenge 10 verification queue, and first-six venue map governance.
            </p>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviewMap}
              className="px-3 py-1.5 rounded text-xs bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 cursor-pointer glow-green"
              title="Preview Venue Blueprint"
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
                <span>PAUSE EVENT</span>
              </button>
            ) : (
              <button
                onClick={() => handleEventControl('resume')}
                className="px-3 py-1.5 rounded text-xs bg-emerald-950/40 hover:bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>RESUME EVENT</span>
              </button>
            )}

            <button
              onClick={() => handleEventControl('reset')}
              className="px-3 py-1.5 rounded text-xs bg-red-950/40 hover:bg-red-950/60 text-red-300 border border-red-500/40 flex items-center gap-1.5 cursor-pointer"
              title="Reset all team progress"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                fetchOrganizerData();
              }}
              disabled={refreshing}
              className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-800 cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Telemetry Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Map Reveal Quota */}
          <div className="bg-slate-950/80 border border-emerald-500/40 rounded-xl p-5 glow-green">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>VENUE MAP SLOTS</span>
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
          <div className={`bg-slate-950/80 border rounded-xl p-5 ${
            pendingReview.length > 0 ? 'border-amber-500/50 glow-amber' : 'border-slate-800'
          }`}>
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>PENDING APPROVALS</span>
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
              <span>ACTIVE TEAMS</span>
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-slate-100">
              {teams.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Participating in Advanced Programming Lab
            </div>
          </div>

          {/* Total Submissions */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>TOTAL ATTEMPTS</span>
              <Terminal className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-300">
              {teams.reduce((acc, t) => acc + t.totalAttempts, 0)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Rate-limited & server evaluated
            </div>
          </div>
        </div>

        {/* Challenge 10 Verification Queue (High Priority) */}
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

        {/* Live Team Monitor Grid */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden">
          <div className="bg-slate-900/80 px-6 py-3.5 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              PARTICIPATING TEAMS MONITOR ({teams.length})
            </h2>
            <span className="text-xs text-slate-400">Live sequential progression</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/40 text-[11px] uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">TEAM</th>
                  <th className="py-3 px-4 text-center">CURRENT NODE</th>
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

                  return (
                    <tr key={t.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-200">
                        {t.name}
                        <span className="block text-[10px] text-slate-500">@{t.username}</span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950/40 text-cyan-300 border border-cyan-500/30">
                          {t.isCompleted ? 'COMPLETED' : `NODE #${t.currentChallengeIndex}`}
                        </span>
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
                          <span className="text-amber-400 font-bold text-[11px]">PENDING</span>
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

        {/* Live Audit Log Submissions */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden">
          <div className="bg-slate-900/80 px-6 py-3.5 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-purple-400" />
              RECENT SUBMISSION AUDIT LOG (LAST 30)
            </h2>
            <span className="text-xs text-slate-400">Chronological telemetry</span>
          </div>

          {recentSubmissions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No submissions recorded in this session yet.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/50 text-[11px] uppercase text-slate-400 sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">TIMESTAMP</th>
                    <th className="py-2.5 px-4">TEAM</th>
                    <th className="py-2.5 px-4 text-center">NODE</th>
                    <th className="py-2.5 px-4">SUBMITTED PAYLOAD</th>
                    <th className="py-2.5 px-4 text-center">RESULT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {recentSubmissions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-900/30">
                      <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                        {new Date(s.submittedAt).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-200">
                        {s.teamName}
                      </td>
                      <td className="py-2.5 px-4 text-center text-cyan-400">
                        #{s.challengeId}
                      </td>
                      <td className="py-2.5 px-4 text-slate-300">
                        <code className="bg-black/60 px-1.5 py-0.5 rounded border border-slate-800 text-[11px]">
                          {s.submittedAnswer}
                        </code>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {s.isCorrect ? (
                          <span className="text-emerald-400 font-bold">CORRECT</span>
                        ) : (
                          <span className="text-red-400">DENIED</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Organizer Map Preview Modal */}
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
