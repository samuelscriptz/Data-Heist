'use client';

import { useState } from 'react';
import { 
  Terminal, 
  Send, 
  Copy, 
  Check, 
  HelpCircle, 
  AlertCircle, 
  CheckCircle2, 
  Lock, 
  Flame, 
  Sparkles,
  Loader2,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ParticipantChallenge } from '@/lib/types';
import { sound } from '@/lib/audio';

interface ChallengeTerminalProps {
  challenge: ParticipantChallenge | null;
  onAnswerSolved: (newChallengeIndex: number, isFinished: boolean) => void;
  isCompletedEvent: boolean;
}

export default function ChallengeTerminal({
  challenge,
  onAnswerSolved,
  isCompletedEvent,
}: ChallengeTerminalProps) {
  const [answerInput, setAnswerInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [copied, setCopied] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [revealedHint, setRevealedHint] = useState<string | null>(challenge?.hintRevealed || null);
  const [isUnlockingHint, setIsUnlockingHint] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  if (!challenge) {
    return (
      <div className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-8 text-center font-mono">
        <Lock className="w-8 h-8 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base text-slate-300 font-bold">SELECT A NODE TO COMMENCE DECODING</h3>
        <p className="text-xs text-slate-500 mt-1">
          Pick an active or solved challenge node from the progression map above.
        </p>
      </div>
    );
  }

  const handleCopyArtifact = () => {
    sound.playClick();
    navigator.clipboard.writeText(challenge.artifactContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUnlockHint = async () => {
    if (revealedHint || isUnlockingHint) return;
    sound.playClick();

    const currentCost = challenge.hintCost ?? Math.floor(challenge.points / 2);
    const confirmed = window.confirm(
      `UNLOCK TACTICAL HINT?\n\nA ${currentCost}-point security penalty (50% of node value) will be deducted from your team score. Proceed?`
    );
    if (!confirmed) return;

    setIsUnlockingHint(true);
    try {
      const res = await fetch('/api/challenges/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: challenge.id }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRevealedHint(data.hint);
        sound.playUnlock();
        setStatusMessage({ text: data.message, type: 'info' });
      } else {
        sound.playError();
        setStatusMessage({ text: data.error || 'Failed to unlock hint.', type: 'error' });
      }
    } catch {
      sound.playError();
      setStatusMessage({ text: 'Network communication failure.', type: 'error' });
    } finally {
      setIsUnlockingHint(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || cooldownSeconds > 0 || !answerInput.trim() || challenge.isSolved) return;

    sound.playClick();
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/challenges/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challenge.id,
          answer: answerInput.trim(),
        }),
      });

      const data = await res.json();

      if (res.status === 429) {
        sound.playError();
        setStatusMessage({ text: data.error, type: 'error' });
        setCooldownSeconds(3);
        const timer = setInterval(() => {
          setCooldownSeconds(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        return;
      }

      if (!res.ok) {
        sound.playError();
        setStatusMessage({ text: data.error || 'Submission rejected.', type: 'error' });
        return;
      }

      if (data.correct) {
        // CORRECT ANSWER!
        sound.playSuccess();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00ff9d', '#00f0ff', '#ffb700'],
        });

        setStatusMessage({ text: data.message, type: 'success' });
        setAnswerInput('');

        // Notify parent dashboard
        setTimeout(() => {
          onAnswerSolved(data.newChallengeIndex, !!data.isFinished);
        }, 1200);
      } else {
        // INCORRECT ANSWER
        sound.playError();
        setStatusMessage({ text: data.message, type: 'error' });
      }
    } catch {
      sound.playError();
      setStatusMessage({ text: 'Critical network glitch. Failed to dispatch payload.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-slate-950/90 border border-cyan-500/30 rounded-xl overflow-hidden backdrop-blur-md glow-cyan">
      {/* Terminal Title Bar */}
      <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>
          <span className="text-xs font-mono text-slate-400 pl-2 border-l border-slate-700 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            target_node_{challenge.id}.sh // {challenge.category}
          </span>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {challenge.difficulty}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
            <Flame className="w-3 h-3 text-emerald-400" />
            +{challenge.points} PTS
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Mission Briefing */}
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <h1 className="text-lg sm:text-xl font-mono font-bold text-slate-100 flex items-center gap-2">
              <span className="text-cyan-400 text-glow-cyan">#{challenge.id}.</span>
              {challenge.title}
            </h1>
            {challenge.isSolved && (
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-500/40 px-2 py-0.5 rounded flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> CONQUERED
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-300 font-mono leading-relaxed mt-2">
            {challenge.description}
          </p>
        </div>

        {/* Clue box */}
        <div className="bg-slate-900/60 border border-cyan-500/20 rounded-lg p-3 text-xs font-mono text-slate-300 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-cyan-400 font-bold uppercase tracking-wider text-[11px] block mb-0.5">
              INTEL BRIEFING:
            </span>
            {challenge.clue}
          </div>
        </div>

        {/* Artifact / Code / Hex Payload Box */}
        <div className="relative group">
          <div className="flex items-center justify-between bg-slate-900 px-3 py-1.5 border-t border-l border-r border-slate-800 rounded-t-lg text-[11px] font-mono text-slate-400">
            <span className="uppercase text-cyan-300 font-bold">
              INTERCEPTED PAYLOAD [{challenge.artifactType.toUpperCase()}]
            </span>
            <button
              onClick={handleCopyArtifact}
              className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
              title="Copy payload to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">COPIED</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>COPY</span>
                </>
              )}
            </button>
          </div>

          <pre className="bg-black/90 p-4 border border-slate-800 rounded-b-lg font-mono text-xs text-emerald-400 overflow-x-auto selection:bg-emerald-500 selection:text-black">
            <code>{challenge.artifactContent}</code>
          </pre>
        </div>

        {/* Hint Accordion */}
        {challenge.hasHint && !challenge.isSolved && (
          <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/40">
            <div className="px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>TACTICAL HINT</span>
              </div>

              {revealedHint ? (
                <button
                  onClick={() => setHintOpen(!hintOpen)}
                  className="text-xs font-mono text-amber-400 hover:underline cursor-pointer"
                >
                  {hintOpen ? 'HIDE HINT' : 'VIEW HINT'}
                </button>
              ) : (
                <button
                  onClick={handleUnlockHint}
                  disabled={isUnlockingHint}
                  className="text-xs font-mono text-amber-400 bg-amber-950/40 border border-amber-500/30 hover:border-amber-400 px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1"
                >
                  {isUnlockingHint ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <span>UNLOCK HINT (-{challenge.hintCost ?? Math.floor(challenge.points / 2)} PTS)</span>
                  )}
                </button>
              )}
            </div>

            {revealedHint && hintOpen && (
              <div className="px-4 py-3 bg-amber-950/20 border-t border-amber-500/30 text-xs font-mono text-amber-200">
                <p>{revealedHint}</p>
              </div>
            )}
          </div>
        )}

        {/* Answer Input or Solved State */}
        {challenge.isSolved ? (
          <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-lg p-4 text-center font-mono">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1.5" />
            <h4 className="text-sm font-bold text-emerald-300 uppercase">
              NODE #{challenge.id} COMPLETED
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Override code accepted. Progress saved to authoritative symposium server.
            </p>
          </div>
        ) : isCompletedEvent ? (
          <div className="bg-cyan-950/30 border border-cyan-500/40 rounded-lg p-4 text-center font-mono">
            <h4 className="text-sm font-bold text-cyan-300">ALL 10 CHALLENGES SOLVED</h4>
            <p className="text-xs text-slate-400 mt-1">
              Proceed to the Chamber below for Organizer review and Venue Map distribution.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label 
                htmlFor="terminal-answer-input"
                className="block text-xs font-mono text-slate-400 mb-1"
              >
                SUBMIT DECRYPTED PAYLOAD / CTF FLAG:
              </label>
              
              <div className="relative flex items-center bg-black/90 border border-cyan-500/40 rounded-lg focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/30 transition-all glow-cyan">
                <div className="pl-3.5 pr-2 py-3 text-xs font-mono text-emerald-400 select-none flex items-center gap-1 shrink-0">
                  <span className="hidden sm:inline text-slate-500">team@apl:~$</span>
                  <span className="text-cyan-400">auth</span>
                </div>

                <input
                  id="terminal-answer-input"
                  type="text"
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  placeholder="ENTER DECRYPTED PAYLOAD (UPPERCASE)..."
                  disabled={isSubmitting || cooldownSeconds > 0}
                  autoComplete="off"
                  spellCheck="false"
                  className="w-full bg-transparent py-3 px-2 text-xs sm:text-sm font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none"
                />

                <button
                  type="submit"
                  disabled={isSubmitting || cooldownSeconds > 0 || !answerInput.trim()}
                  className={`mr-2 px-4 py-2 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    answerInput.trim() && !isSubmitting && cooldownSeconds === 0
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 glow-green'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>EVALUATING</span>
                    </>
                  ) : cooldownSeconds > 0 ? (
                    <>
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>{cooldownSeconds}s</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>DISPATCH</span>
                    </>
                  )}
                </button>
              </div>

              {challenge.answerFormatHint && (
                <p className="text-[11px] font-mono text-slate-500 mt-1 pl-1">
                  💡 Hint: {challenge.answerFormatHint}
                </p>
              )}
            </div>

            {/* Submission Status Message */}
            {statusMessage && (
              <div
                className={`p-3 rounded-lg text-xs font-mono flex items-start gap-2 animate-in fade-in slide-in-from-top-1 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 glow-green'
                    : statusMessage.type === 'error'
                    ? 'bg-red-950/40 border border-red-500/50 text-red-300 glow-red'
                    : 'bg-cyan-950/40 border border-cyan-500/50 text-cyan-300'
                }`}
              >
                {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
                {statusMessage.type === 'info' && <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />}
                <span>{statusMessage.text}</span>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
