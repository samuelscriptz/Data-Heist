'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Terminal, 
  Shield, 
  Clock, 
  MapPin, 
  ChevronRight, 
  Users, 
  Cpu, 
  KeyRound, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import HeaderNav from '@/components/HeaderNav';
import MatrixRain from '@/components/MatrixRain';
import EventCountdown from '@/components/EventCountdown';
import { sound } from '@/lib/audio';

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    displayName: string;
    role: string;
  } | null>(null);

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
            A high-stakes 90-minute cryptanalytic infiltration. Decode corrupted packet captures, defeat polyalphabetic ciphers, and capture flags to breach the mainframe. The first six approved teams claim the physical venue map and data core.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            {currentUser ? (
              <Link
                href={currentUser.role === 'organizer' ? '/organizer' : '/dashboard'}
                onClick={() => sound.playClick()}
                className="px-6 py-3 rounded-lg font-mono font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-2 glow-green transition-all transform hover:scale-105 cursor-pointer"
              >
                <Terminal className="w-4 h-4" />
                ENTER {currentUser.role === 'organizer' ? 'ORGANIZER CONSOLE' : 'PARTICIPANT TERMINAL'}
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => sound.playClick()}
                  className="px-6 py-3 rounded-lg font-mono font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-2 glow-green transition-all transform hover:scale-105 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  AUTHENTICATE TEAM CREDENTIALS
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/leaderboard"
                  onClick={() => sound.playClick()}
                  className="px-5 py-3 rounded-lg font-mono text-sm bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 flex items-center gap-2 transition-all cursor-pointer"
                >
                  VIEW LIVE LEADERBOARD
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Live Timer Banner */}
        <div className="max-w-2xl mx-auto">
          <EventCountdown />
        </div>

        {/* Event Specification Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 backdrop-blur-md hover:border-cyan-500/40 transition-all">
            <div className="w-8 h-8 rounded bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-xs uppercase text-slate-400 mb-1">EVENT DURATION</h3>
            <div className="text-lg font-bold text-slate-100">90 Minutes</div>
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
            <p className="text-[11px] text-slate-400 mt-1">Mystery solving, ciphers & CTF flags.</p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 backdrop-blur-md hover:border-amber-500/40 transition-all">
            <div className="w-8 h-8 rounded bg-amber-950/50 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="text-xs uppercase text-slate-400 mb-1">FINAL CLEARANCE</h3>
            <div className="text-lg font-bold text-amber-300">Top 6 Venue Maps</div>
            <p className="text-[11px] text-slate-400 mt-1">Proctor verified. Server-enforced quota.</p>
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
                <p><strong>Server-Side Validation:</strong> Answer keys are never sent to the client. Automated rate-limiting enforces a 2-second cooldown to discourage script brute forcing.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">03.</span>
                <p><strong>Tactical Hints:</strong> Each node offers an optional hint with a 25-point penalty deducted from your team score.</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">04.</span>
                <p><strong>Challenge 10 Verification:</strong> Upon completing Node #10, your server timestamp is locked. An authenticated proctor will review your audit trail.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">05.</span>
                <p><strong>Venue Map Dispatch:</strong> Only the first six verified teams receive the venue map coordinates to claim the physical Data Core trophy.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">06.</span>
                <p><strong>Audio FX:</strong> Interactive sound synth responds to terminal actions. Mute or unmute at any time via the header toggle.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950/80 py-6 text-center font-mono text-xs text-slate-500 relative z-10">
        <p>DATA HEIST &bull; Advanced Programming Lab &bull; College Symposium 2026</p>
        <p className="text-[10px] text-slate-600 mt-1">Secured with Next.js App Router, Supabase RBAC & Server-Side Verification</p>
      </footer>
    </div>
  );
}
