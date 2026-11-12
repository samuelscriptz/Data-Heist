'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Terminal, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import MatrixRain from '@/components/MatrixRain';
import { sound } from '@/lib/audio';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if organizer session is active
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          if (data.user.role === 'organizer') {
            router.push('/organizer');
          } else {
            router.push('/dashboard');
          }
        }
      })
      .catch(() => {});
  }, [router]);

  return (
    <div className="min-h-screen bg-[#080b10] text-slate-100 scanlines flex flex-col justify-center items-center p-4 relative font-mono selection:bg-emerald-500 selection:text-black">
      <MatrixRain />

      <div className="w-full max-w-md relative z-10 space-y-6 text-center">
        <div className="space-y-2">
          <div className="w-14 h-14 mx-auto rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 glow-green mb-2">
            <Terminal className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-wider">
            OPERATION <span className="text-emerald-400">DATA HEIST</span>
          </h1>
          <p className="text-xs text-slate-400">
            ADVANCED PROGRAMMING LAB // COLLEGE SYMPOSIUM 2026
          </p>
        </div>

        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-md space-y-5 text-left">
          <div className="space-y-2 text-center pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-cyan-400 tracking-wider">
              PASSWORDLESS PARTICIPANT ACCESS
            </span>
            <p className="text-xs text-slate-300">
              Participants do not require passwords! Simply enter your team codename to join the live waiting room.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href="/"
              onClick={() => sound.playClick()}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center gap-2 glow-green transition-all transform hover:scale-[1.02] cursor-pointer"
            >
              <Terminal className="w-4 h-4" />
              <span>JOIN WITH TEAM NAME</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/admin/login"
              onClick={() => sound.playClick()}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border border-purple-500/40 flex items-center justify-center gap-2 glow-purple transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4 text-purple-400" />
              <span>PROCTOR / ADMIN LOGIN</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
