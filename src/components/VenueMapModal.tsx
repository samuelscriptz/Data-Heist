'use client';

import { useEffect } from 'react';
import { X, ShieldAlert, Key, MapPin, Printer } from 'lucide-react';
import { VenueMapData } from '@/lib/types';
import { sound } from '@/lib/audio';

interface VenueMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  mapData: VenueMapData;
}

export default function VenueMapModal({
  isOpen,
  onClose,
  mapData,
}: VenueMapModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        sound.playClick();
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    sound.playClick();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="w-full max-w-4xl bg-slate-950 border-2 border-emerald-400 rounded-2xl overflow-hidden shadow-2xl glow-green my-8 relative flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="venue-map-title"
      >
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-4 border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-emerald-950/60 border border-emerald-400 flex items-center justify-center text-emerald-400">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 id="venue-map-title" className="text-base font-mono font-bold text-emerald-300 tracking-wider">
                CLASSIFIED VENUE EXTRACTION BLUEPRINT
              </h2>
              <p className="text-xs font-mono text-slate-400">
                AUTHORIZED FOR: <span className="text-slate-200 font-bold">{mapData.teamName}</span> // RANK #{mapData.finishRank}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-mono text-xs flex items-center gap-1.5 cursor-pointer"
              title="Print Blueprint"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PRINT</span>
            </button>
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close blueprint modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Target Clearance Banner */}
          <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">TARGET VENUE:</span>
              <div className="text-emerald-300 font-bold text-sm flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400" />
                {mapData.venueName}
              </div>
              <span className="text-[11px] text-slate-400">{mapData.venueRoom}</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">EXTRACTION KEYCODE:</span>
              <div className="text-cyan-300 font-bold text-sm flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded border border-cyan-500/30">
                <Key className="w-4 h-4 text-cyan-400" />
                {mapData.secretExtractionCode}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">PHYSICAL COORDINATES:</span>
              <div className="text-slate-200 font-bold text-sm">
                {mapData.mapCoordinates}
              </div>
            </div>
          </div>

          {/* Render Vector Blueprint SVG */}
          <div className="bg-black border border-slate-800 rounded-xl p-2 overflow-hidden shadow-inner flex items-center justify-center">
            <div 
              className="w-full h-auto max-w-full"
              dangerouslySetInnerHTML={{ __html: mapData.mapSvg }}
            />
          </div>

          {/* Protocol Instructions */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-2">
            <h4 className="text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
              FINAL EXTRACTION PROTOCOLS:
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed">
              {mapData.instructions.map((inst, i) => (
                <li key={i}>{inst}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
