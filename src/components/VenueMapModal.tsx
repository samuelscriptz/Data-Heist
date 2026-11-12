'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  ShieldAlert, 
  Key, 
  MapPin, 
  Printer, 
  Layers, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
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
  const [selectedFloor, setSelectedFloor] = useState<number>(1);

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

  const defaultFloors = [
    {
      floorNumber: 1,
      title: 'Floor 1 — Ground Level Blueprint',
      subtitle: 'Main Entrance, Reception & Primary Junction',
      imageUrl: '/floor 1.jpeg',
      clueZone: 'Floor 1 (Zone Alpha): Inspect the reception desk and primary electrical/network junction for Clue #1.',
    },
    {
      floorNumber: 2,
      title: 'Floor 2 — Mid Level Blueprint',
      subtitle: 'Computer Laboratories & Central Corridor',
      imageUrl: '/floor 2.jpeg',
      clueZone: 'Floor 2 (Zone Beta): Search the central corridor laboratories and workstation lockers for Clue #2.',
    },
    {
      floorNumber: 3,
      title: 'Floor 3 — Top Level Blueprint',
      subtitle: 'Advanced Programming Lab & Cyber Enclave',
      imageUrl: '/floor 3.jpeg',
      clueZone: 'Floor 3 (Zone Omega): Breach the final server rack alcove to locate Dropbox #3B and extract the Data Core.',
    },
  ];

  const floors = mapData.floors && mapData.floors.length > 0 ? mapData.floors : defaultFloors;
  const currentFloor = floors.find((f) => f.floorNumber === selectedFloor) || floors[0];

  const handlePrint = () => {
    sound.playClick();
    window.print();
  };

  const handlePrevFloor = () => {
    sound.playClick();
    setSelectedFloor((prev) => (prev > 1 ? prev - 1 : floors.length));
  };

  const handleNextFloor = () => {
    sound.playClick();
    setSelectedFloor((prev) => (prev < floors.length ? prev + 1 : 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="w-full max-w-5xl bg-slate-950 border-2 border-emerald-400 rounded-2xl overflow-hidden shadow-2xl glow-green my-6 relative flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="venue-map-title"
      >
        {/* Modal Header */}
        <div className="bg-slate-900 px-4 sm:px-6 py-3.5 border-b border-emerald-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-emerald-950/60 border border-emerald-400 flex items-center justify-center text-emerald-400 glow-green">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="venue-map-title" className="text-sm sm:text-base font-mono font-bold text-emerald-300 tracking-wider">
                  CLASSIFIED 3-FLOOR VENUE BLUEPRINTS
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/40">
                  ALL 10 NODES OVERRIDDEN
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400">
                OPERATIVE SQUAD: <span className="text-slate-200 font-bold">{mapData.teamName}</span>
                {mapData.finishRank ? ` // CLEARANCE RANK #${mapData.finishRank}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-mono text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Print Blueprints"
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

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto font-mono text-xs">
          {/* Target Clearance Banner */}
          <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-slate-400 block mb-0.5 text-[11px]">TARGET FACILITY:</span>
              <div className="text-emerald-300 font-bold text-sm flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{mapData.venueName || 'Advanced Programming Lab'}</span>
              </div>
              <span className="text-[11px] text-slate-400">{mapData.venueRoom || '3 Floors Infiltration'}</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5 text-[11px]">SECRET EXTRACTION KEYCODE:</span>
              <div className="text-cyan-300 font-bold text-sm flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded border border-cyan-500/30">
                <Key className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="tracking-wider">{mapData.secretExtractionCode}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5 text-[11px]">PHYSICAL TARGET GOAL:</span>
              <div className="text-amber-300 font-bold text-xs sm:text-sm flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Locate Dropbox #3B (Top Enclave)</span>
              </div>
              <span className="text-[11px] text-slate-400">Claim the Physical Data Core Trophy</span>
            </div>
          </div>

          {/* Interactive Floor Switcher Tabs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                <Layers className="w-4 h-4" />
                <span>SELECT FACILITY LEVEL:</span>
              </div>

              {/* Navigation controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevFloor}
                  className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1 cursor-pointer"
                  title="Previous Floor"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev Level
                </button>
                <button
                  onClick={handleNextFloor}
                  className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1 cursor-pointer"
                  title="Next Floor"
                >
                  Next Level <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Floor Tabs */}
            <div className="grid grid-cols-3 gap-2">
              {floors.map((floor) => {
                const isActive = floor.floorNumber === selectedFloor;
                return (
                  <button
                    key={floor.floorNumber}
                    onClick={() => {
                      sound.playClick();
                      setSelectedFloor(floor.floorNumber);
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-950/60 border-emerald-400 text-emerald-300 glow-green font-bold shadow-lg'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs uppercase tracking-wider">LEVEL 0{floor.floorNumber}</div>
                    <div className="text-[10px] opacity-75 truncate">{floor.title.replace(`Floor ${floor.floorNumber} — `, '')}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Blueprint Viewer Card */}
          <div className="bg-black/90 border border-cyan-500/30 rounded-2xl overflow-hidden shadow-2xl relative space-y-3 p-3 sm:p-4">
            {/* Floor header info */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span className="text-emerald-400 font-black">[{currentFloor.floorNumber}/3]</span>
                  {currentFloor.title}
                </h3>
                <p className="text-[11px] text-slate-400">{currentFloor.subtitle}</p>
              </div>

              <a
                href={encodeURI(currentFloor.imageUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>OPEN FULL RESOLUTION</span>
              </a>
            </div>

            {/* Clue Directive Box for This Floor */}
            <div className="bg-slate-900/80 border border-emerald-500/30 rounded-xl p-3 flex items-start gap-2.5 text-emerald-300">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px] block">
                  PHYSICAL CLUE INFILTRATION DIRECTIVE:
                </span>
                <p className="text-slate-200 text-xs mt-0.5 leading-relaxed">
                  {currentFloor.clueZone}
                </p>
              </div>
            </div>

            {/* The Actual Floor Map Image */}
            <div className="w-full flex items-center justify-center bg-slate-950 rounded-xl p-2 border border-slate-800 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={encodeURI(currentFloor.imageUrl)}
                alt={currentFloor.title}
                className="w-full h-auto max-h-[55vh] object-contain rounded-lg transition-transform hover:scale-[1.01]"
              />
            </div>
          </div>

          {/* Master Extraction Protocol Instructions */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
            <h4 className="text-emerald-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              PHYSICAL HEIST EXTRACTION PROTOCOLS (3-FLOOR ROUTE):
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
