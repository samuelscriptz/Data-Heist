'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Radio, 
  RefreshCw,
  Trophy,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '@/lib/audio';
import { VenueMapData } from '@/lib/types';
import VenueMapModal from './VenueMapModal';

interface CompletionReviewScreenProps {
  completedAt: string | null;
  reviewStatus: 'none' | 'pending' | 'approved' | 'rejected';
  mapEligible: boolean;
  finishRank: number | null;
  teamName: string;
}

export default function CompletionReviewScreen({
  completedAt,
  reviewStatus: initialStatus,
  mapEligible: initialMapEligible,
  finishRank: initialFinishRank,
  teamName,
}: CompletionReviewScreenProps) {
  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const [mapEligible, setMapEligible] = useState(initialMapEligible);
  const [finishRank, setFinishRank] = useState<number | null>(initialFinishRank);
  const [isPolling, setIsPolling] = useState(false);
  const [venueMapData, setVenueMapData] = useState<VenueMapData | null>(null);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [loadingMap, setLoadingMap] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Poll for organizer approval every 5 seconds if pending
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        setIsPolling(true);
        const res = await fetch('/api/challenges/current');
        if (res.ok) {
          const data = await res.json();
          if (data.team) {
            const newStatus = data.team.reviewStatus;
            const newMapEligible = data.team.mapEligible;
            const newRank = data.team.finishRank;

            if (newStatus !== currentStatus && newStatus === 'approved') {
              if (newMapEligible) {
                sound.playVictory();
                confetti({
                  particleCount: 150,
                  spread: 90,
                  origin: { y: 0.5 },
                  colors: ['#00ff9d', '#00f0ff', '#ffd700'],
                });
              }
            }

            setCurrentStatus(newStatus);
            setMapEligible(newMapEligible);
            setFinishRank(newRank);
          }
        }
      } catch (err) {
        console.error('Error polling completion status:', err);
      } finally {
        setIsPolling(false);
      }
    };

    if (currentStatus === 'pending') {
      interval = setInterval(checkStatus, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentStatus]);

  // Request secure venue map from the protected server endpoint
  const handleOpenVenueMap = async () => {
    sound.playClick();
    setLoadingMap(true);
    setMapError(null);

    try {
      const res = await fetch('/api/venue-map');
      const data = await res.json();

      if (res.ok && data.accessGranted) {
        setVenueMapData(data);
        setMapModalOpen(true);
        sound.playVictory();
      } else {
        sound.playError();
        setMapError(data.error || 'Failed to fetch venue blueprint.');
      }
    } catch {
      sound.playError();
      setMapError('Network connection failed while accessing the secure map enclave.');
    } finally {
      setLoadingMap(false);
    }
  };

  const formattedTime = completedAt ? new Date(completedAt).toLocaleTimeString() : 'RECORDED';

  return (
    <div className="w-full bg-slate-950/90 border-2 border-emerald-500/50 rounded-2xl p-6 sm:p-8 backdrop-blur-md glow-green text-center relative overflow-hidden">
      {/* Background cyber radial glow */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#00ff9d_1px,transparent_1px)] [background-size:20px_20px]" />

      <div className="relative z-10 max-w-2xl mx-auto space-y-6">
        {/* Animated Trophy / Shield */}
        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-950/60 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 glow-green animate-pulse">
          <Trophy className="w-10 h-10" />
        </div>

        <div>
          <div className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 mb-2">
            ALL 10 SECTORS OVERRIDDEN
          </div>
          <h2 className="text-2xl sm:text-3xl font-mono font-black text-slate-100 tracking-wider">
            DATA CORE BREACH COMPLETE
          </h2>
          <p className="text-sm font-mono text-slate-300 mt-2">
            Congratulations, <span className="text-emerald-400 font-bold">{teamName}</span>! You have successfully solved all 10 challenge nodes of DATA HEIST.
          </p>
        </div>

        {/* Server Clock Timestamp Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 font-mono text-xs text-left grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="text-slate-400 block mb-0.5">AUTHORITATIVE SERVER TIME:</span>
            <div className="text-slate-200 font-bold flex items-center gap-1.5 text-sm">
              <Clock className="w-4 h-4 text-cyan-400" />
              {formattedTime}
            </div>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">ORGANIZER REVIEW STATUS:</span>
            <div className="font-bold flex items-center gap-1.5 text-sm">
              {currentStatus === 'pending' && (
                <span className="text-amber-400 flex items-center gap-1">
                  <Radio className="w-4 h-4 animate-spin text-amber-400" />
                  AWAITING REVIEW
                </span>
              )}
              {currentStatus === 'approved' && (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  VERIFIED & APPROVED
                </span>
              )}
              {currentStatus === 'rejected' && (
                <span className="text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  CLEARANCE REJECTED
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status Breakdown & Map Dispatch Callout */}
        {currentStatus === 'pending' && (
          <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-5 text-left font-mono space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs text-amber-300 font-bold flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
                AUDIT VERIFICATION IN PROGRESS (LEAD PROCTOR APPROVAL REQUIRED)
              </h4>
              <button
                onClick={() => sound.playClick()}
                disabled={isPolling}
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isPolling ? 'animate-spin' : ''}`} />
                {isPolling ? 'Checking...' : 'Check Status'}
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your submission timestamp has been recorded. All 10 challenge sectors are solved! The 3-floor physical venue blueprints remain encrypted under quarantine until the symposium proctor reviews and authorizes your clearance in the Organizer Console.
            </p>

            <div className="bg-slate-900/80 border border-amber-500/30 rounded-lg p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-amber-300">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>3-FLOOR VENUE BLUEPRINTS: <strong className="text-amber-200">LOCKED (AWAITING ADMIN APPROVAL)</strong></span>
              </div>
              <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                PENDING
              </span>
            </div>
          </div>
        )}

        {currentStatus === 'approved' && mapEligible && (
          <div className="bg-emerald-950/40 border-2 border-emerald-400 rounded-xl p-5 text-center font-mono space-y-4 glow-green">
            <div className="flex items-center justify-center gap-2 text-emerald-300 font-bold text-sm sm:text-base">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              TOP 6 CLEARANCE CONFIRMED (RANK #{finishRank || 1})
            </div>
            <p className="text-xs text-slate-200">
              Your finish has been certified! You are officially authorized to retrieve the physical Symposium Data Core from the 3rd floor enclave.
            </p>

            <button
              onClick={handleOpenVenueMap}
              disabled={loadingMap}
              className="px-6 py-3 rounded-lg font-mono font-black text-sm bg-emerald-400 hover:bg-emerald-300 text-slate-950 flex items-center justify-center gap-2 mx-auto cursor-pointer glow-green transition-all transform hover:scale-105"
            >
              <MapPin className="w-4 h-4" />
              {loadingMap ? 'AUTHENTICATING CLEARANCE...' : 'VIEW 3-FLOOR VENUE BLUEPRINTS'}
            </button>

            {mapError && (
              <p className="text-xs text-red-400 mt-2">{mapError}</p>
            )}
          </div>
        )}

        {currentStatus === 'approved' && !mapEligible && (
          <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-5 text-center font-mono space-y-4">
            <h4 className="text-sm font-bold text-slate-200">
              SUBMISSION VERIFIED (RANK #{finishRank || 7})
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
              All 10 challenges verified. The initial venue map quota (first 6 teams) has been claimed, but you have unlocked the facility maps for exploration.
            </p>
            <button
              onClick={handleOpenVenueMap}
              disabled={loadingMap}
              className="px-6 py-2.5 rounded-lg font-mono font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center gap-2 mx-auto cursor-pointer transition-all"
            >
              <MapPin className="w-4 h-4" />
              {loadingMap ? 'LOADING...' : 'VIEW 3-FLOOR VENUE BLUEPRINTS'}
            </button>
          </div>
        )}

        {currentStatus === 'rejected' && (
          <div className="bg-red-950/30 border border-red-500/40 rounded-xl p-4 text-left font-mono space-y-1">
            <h4 className="text-xs font-bold text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              VERIFICATION REJECTED BY PROCTOR
            </h4>
            <p className="text-xs text-slate-300">
              One or more anomalies were detected in your submission audit trail. Please signal a lab proctor for manual review.
            </p>
          </div>
        )}
      </div>

      {/* Secure Map Modal */}
      {venueMapData && (
        <VenueMapModal
          isOpen={mapModalOpen}
          onClose={() => setMapModalOpen(false)}
          mapData={venueMapData}
        />
      )}
    </div>
  );
}
