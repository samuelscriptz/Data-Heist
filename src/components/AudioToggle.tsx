'use client';

import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { sound } from '@/lib/audio';

export default function AudioToggle() {
  const [isMuted, setIsMuted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsMuted(sound.getMuted());
  }, []);

  const toggleSound = () => {
    const newState = sound.toggleMute();
    setIsMuted(newState);
    if (!newState) {
      sound.playBleep();
    }
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggleSound}
      title={isMuted ? 'Audio Muted (Click to enable synth FX)' : 'Audio Enabled (Click to mute)'}
      aria-label={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
      className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono border transition-all duration-200 cursor-pointer ${
        isMuted
          ? 'bg-red-950/20 text-red-400 border-red-500/30 hover:border-red-400'
          : 'bg-emerald-950/20 text-emerald-400 border-emerald-500/40 hover:border-emerald-300 glow-green'
      }`}
    >
      {isMuted ? (
        <>
          <VolumeX className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">SFX: MUTED</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5 animate-pulse" />
          <span className="hidden sm:inline">SFX: ACTIVE</span>
        </>
      )}
    </button>
  );
}
