'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Terminal, 
  KeyRound, 
  ShieldCheck, 
  Lock, 
  AlertCircle, 
  Loader2, 
  ArrowLeft
} from 'lucide-react';
import MatrixRain from '@/components/MatrixRain';
import AudioToggle from '@/components/AudioToggle';
import { sound } from '@/lib/audio';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password || loading) return;

    sound.playClick();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        sound.playError();
        setErrorMessage(data.error || 'Authentication denied.');
        return;
      }

      sound.playSuccess();
      router.push('/organizer');
      router.refresh();
    } catch {
      sound.playError();
      setErrorMessage('Failed to connect to authentication server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080b10] text-slate-100 scanlines flex flex-col justify-center items-center p-4 relative selection:bg-emerald-500 selection:text-black">
      <MatrixRain />

      <div className="absolute top-4 right-4 z-20">
        <AudioToggle />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-purple-400 glow-purple mb-2">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-mono font-black text-slate-100 tracking-wider">
            PROCTOR <span className="text-purple-400">COMMAND GATEWAY</span>
          </h1>
          <p className="text-xs font-mono text-slate-400">
            ADVANCED PROGRAMMING LAB // ORGANIZER CLEARANCE ONLY
          </p>
        </div>

        <div className="bg-slate-950/90 border border-purple-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-md glow-purple font-mono space-y-5">
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label 
                htmlFor="admin-username"
                className="block text-xs text-slate-300 font-bold mb-1.5 flex items-center gap-1.5"
              >
                <Terminal className="w-3.5 h-3.5 text-purple-400" />
                PROCTOR ID / USERNAME:
              </label>
              <input
                id="admin-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-purple-400"
                required
              />
            </div>

            <div>
              <label 
                htmlFor="admin-password"
                className="block text-xs text-slate-300 font-bold mb-1.5 flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                AUTHORIZATION PASSPHRASE:
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-purple-400"
                required
              />
            </div>

            {errorMessage && (
              <div className="p-3 rounded bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-bold text-sm bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-purple-900/30"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>VERIFYING CLEARANCE...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>AUTHENTICATE PROCTOR</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800 text-center">
            <Link 
              href="/"
              onClick={() => sound.playClick()}
              className="text-xs text-slate-500 hover:text-cyan-400 flex items-center justify-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>RETURN TO PARTICIPANT LOBBY</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

