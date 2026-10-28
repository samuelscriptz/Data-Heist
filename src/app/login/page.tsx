'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Terminal, 
  KeyRound, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Loader2, 
  UserCheck, 
  Users,
  Lock
} from 'lucide-react';
import MatrixRain from '@/components/MatrixRain';
import AudioToggle from '@/components/AudioToggle';
import { sound } from '@/lib/audio';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password || loading) return;

    sound.playClick();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
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
      router.push(data.redirectTo || '/dashboard');
      router.refresh();
    } catch {
      sound.playError();
      setErrorMessage('Communication error with authentication mainframe.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    sound.playClick();
    setUsername(u);
    setPassword(p);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#080b10] text-slate-100 scanlines flex flex-col justify-center items-center p-4 relative selection:bg-emerald-500 selection:text-black">
      <MatrixRain />

      {/* Top Bar with Audio Control */}
      <div className="absolute top-4 right-4 z-20">
        <AudioToggle />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 glow-green mb-2">
            <Terminal className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-mono font-black text-slate-100 tracking-wider">
            DATA HEIST <span className="text-emerald-400 text-glow-green">MAINFRAME</span>
          </h1>
          <p className="text-xs font-mono text-slate-400">
            ADVANCED PROGRAMMING LAB // RESTRICTED ACCESS GATEWAY
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-950/90 border border-cyan-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-md glow-cyan font-mono space-y-5">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username Input */}
            <div>
              <label 
                htmlFor="login-username"
                className="block text-xs text-slate-300 font-bold mb-1.5 flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                TEAM USERNAME / PROCTOR ID
              </label>
              <div className="relative">
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. cyber_hawks or admin"
                  required
                  autoComplete="username"
                  className="w-full bg-black/80 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label 
                htmlFor="login-password"
                className="block text-xs text-slate-300 font-bold mb-1.5 flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                SECURITY PASSPHRASE
              </label>
              <div className="relative flex items-center">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter assigned passphrase"
                  required
                  autoComplete="current-password"
                  className="w-full bg-black/80 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                  title={showPassword ? 'Hide passphrase' : 'Show passphrase'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/50 text-red-300 text-xs flex items-start gap-2 glow-red animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !username.trim() || !password}
              className={`w-full py-3 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                loading || !username.trim() || !password
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 glow-green'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AUTHENTICATING...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  BREACH TERMINAL ACCESS
                </>
              )}
            </button>
          </form>

          {/* Quick-Demo Credentials Accordion */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              QUICK TEST CREDENTIALS (CLICK TO AUTOFILL):
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickFill('cyber_hawks', 'hawk2026!')}
                className="p-2 rounded bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 text-left cursor-pointer transition-colors"
              >
                <div className="font-bold text-cyan-300 flex items-center gap-1">
                  <Users className="w-3 h-3 text-cyan-400" />
                  Team 1 (Hawks)
                </div>
                <div className="text-[10px] text-slate-500">cyber_hawks</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('matrix_breakers', 'matrix99!')}
                className="p-2 rounded bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 text-left cursor-pointer transition-colors"
              >
                <div className="font-bold text-cyan-300 flex items-center gap-1">
                  <Users className="w-3 h-3 text-cyan-400" />
                  Team 2 (Matrix)
                </div>
                <div className="text-[10px] text-slate-500">matrix_breakers</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('shadow_protocol', 'shadow123!')}
                className="p-2 rounded bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 text-left cursor-pointer transition-colors"
              >
                <div className="font-bold text-cyan-300 flex items-center gap-1">
                  <Users className="w-3 h-3 text-cyan-400" />
                  Team 3 (Shadow)
                </div>
                <div className="text-[10px] text-slate-500">shadow_protocol</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'admin2026!')}
                className="p-2 rounded bg-amber-950/30 hover:bg-amber-950/50 border border-amber-500/40 hover:border-amber-400 text-left cursor-pointer transition-colors glow-amber"
              >
                <div className="font-bold text-amber-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  Organizer Admin
                </div>
                <div className="text-[10px] text-amber-400/80">admin2026!</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <p className="text-center text-[11px] font-mono text-slate-500">
          Organizer-provisioned accounts only. IP and terminal traces are logged.
        </p>
      </div>
    </div>
  );
}
