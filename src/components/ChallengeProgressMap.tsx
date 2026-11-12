'use client';

import { Check, Lock, Crosshair, Sparkles, ChevronRight } from 'lucide-react';
import { sound } from '@/lib/audio';

export interface MapNode {
  id: number;
  title: string;
  category: string;
  difficulty: string;
  points: number;
  status: 'completed' | 'current' | 'locked';
}

interface ChallengeProgressMapProps {
  nodes: MapNode[];
  activeChallengeId: number;
  onSelectNode: (challengeId: number) => void;
  layout?: 'vertical' | 'horizontal';
}

export default function ChallengeProgressMap({
  nodes,
  activeChallengeId,
  onSelectNode,
  layout = 'vertical',
}: ChallengeProgressMapProps) {
  const completedCount = nodes.filter(n => n.status === 'completed').length;
  const progressPercent = Math.round((completedCount / 10) * 100);

  const handleNodeClick = (node: MapNode) => {
    if (node.status === 'locked') {
      sound.playError();
      return;
    }
    sound.playBleep();
    onSelectNode(node.id);
  };

  if (layout === 'vertical') {
    return (
      <div className="w-full bg-slate-950/80 border border-cyan-500/30 rounded-xl p-4 backdrop-blur-md glow-cyan relative overflow-hidden font-mono">
        {/* Subtle grid background */}
        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(#00f0ff_1px,transparent_1px)] [background-size:14px_14px]" />

        {/* Sidebar Header & Progress */}
        <div className="relative z-10 pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
              CHALLENGE PIPELINE
            </h2>
            <span className="text-[11px] text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
              {completedCount}/10 SOLVED
            </span>
          </div>

          <div className="mt-2.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>MAINFRAME BREACH</span>
              <span className="text-emerald-400 font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Vertical Nodes List */}
        <div className="space-y-2 relative z-10 max-h-[calc(100vh-240px)] overflow-y-auto pr-1">
          {nodes.map((node) => {
            const isCurrent = node.status === 'current';
            const isCompleted = node.status === 'completed';
            const isLocked = node.status === 'locked';
            const isSelected = node.id === activeChallengeId;

            return (
              <button
                key={node.id}
                onClick={() => handleNodeClick(node)}
                disabled={isLocked}
                title={
                  isLocked
                    ? `Node #${node.id} is encrypted. Solve Node #${node.id - 1} first.`
                    : `Node #${node.id}: ${node.title} (${node.points} pts)`
                }
                className={`w-full p-2.5 rounded-lg border text-left transition-all relative flex items-center justify-between gap-2 ${isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300 hover:border-emerald-400 cursor-pointer'
                    : isCurrent
                      ? 'bg-cyan-950/40 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400 glow-cyan cursor-pointer'
                      : 'bg-slate-900/30 border-slate-800/80 text-slate-600 cursor-not-allowed opacity-50'
                  } ${isSelected ? 'ring-2 ring-emerald-400 bg-slate-900/80 shadow-lg' : ''}`}
              >
                {/* Left content: Badge, Title & Category */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${isCompleted
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : isCurrent
                          ? 'bg-cyan-500/20 text-cyan-200 animate-pulse'
                          : 'bg-slate-800 text-slate-500'
                      }`}>
                      NODE #{node.id}
                    </span>

                    {node.category === 'CTF Flag' && (
                      <span className="text-[9px] bg-purple-950/60 text-purple-300 border border-purple-500/30 px-1 rounded flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" /> CTF
                      </span>
                    )}

                    <span className="text-[9px] text-slate-500 truncate">
                      {node.category}
                    </span>
                  </div>

                  <div className={`text-xs font-bold truncate ${isCompleted ? 'text-slate-200' : isCurrent ? 'text-cyan-200' : 'text-slate-500'
                    }`}>
                    {isLocked ? 'CLASSIFIED SECTOR' : node.title}
                  </div>
                </div>

                {/* Right content: Points & Status Icon */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold ${isCompleted ? 'text-emerald-400' : isCurrent ? 'text-cyan-400' : 'text-slate-600'
                    }`}>
                    {node.points}p
                  </span>

                  <div className="w-5 h-5 rounded flex items-center justify-center">
                    {isCompleted && <Check className="w-4 h-4 text-emerald-400" />}
                    {isCurrent && <Crosshair className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />}
                    {isLocked && <Lock className="w-3.5 h-3.5 text-slate-600" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Fallback Horizontal Grid Layout
  return (
    <div className="w-full bg-slate-950/70 border border-cyan-500/30 rounded-xl p-4 sm:p-6 backdrop-blur-md glow-cyan relative overflow-hidden font-mono">
      <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(#00f0ff_1px,transparent_1px)] [background-size:16px_16px]"></div>

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
              MISSION PROGRESSION MAP
            </h2>
            <span className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded">
              {completedCount} / 10 SOLVED
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Sequential cryptographic unlock pipeline. Solve current node to breach next sector.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-400">MAINFRAME BREACH</span>
            <div className="text-base font-black text-emerald-400">{progressPercent}%</div>
          </div>
          <div className="w-24 bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 10 Nodes Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 relative z-10">
        {nodes.map((node) => {
          const isCurrent = node.status === 'current';
          const isCompleted = node.status === 'completed';
          const isLocked = node.status === 'locked';
          const isSelected = node.id === activeChallengeId;

          return (
            <button
              key={node.id}
              onClick={() => handleNodeClick(node)}
              disabled={isLocked}
              title={
                isLocked
                  ? `Node #${node.id} is encrypted. Solve Node #${node.id - 1} first.`
                  : `Node #${node.id}: ${node.title} (${node.points} pts)`
              }
              className={`p-3 rounded-lg border text-left transition-all relative group flex flex-col justify-between min-h-[110px] ${isCompleted
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400 hover:border-emerald-300 glow-green cursor-pointer'
                  : isCurrent
                    ? 'bg-cyan-950/30 border-cyan-400 text-cyan-300 ring-2 ring-cyan-500/40 glow-cyan cursor-pointer'
                    : 'bg-slate-900/30 border-slate-800 text-slate-600 cursor-not-allowed opacity-60'
                } ${isSelected ? 'scale-[1.02] ring-2 ring-emerald-400' : ''}`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isCompleted
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : isCurrent
                      ? 'bg-cyan-500/20 text-cyan-200 animate-pulse'
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                  NODE #{node.id}
                </span>

                <div className="w-5 h-5 rounded-full flex items-center justify-center">
                  {isCompleted && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  {isCurrent && <Crosshair className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />}
                  {isLocked && <Lock className="w-3 h-3 text-slate-600" />}
                </div>
              </div>

              <div className="my-1.5">
                <div className={`text-xs font-bold line-clamp-1 ${isCompleted ? 'text-slate-200' : isCurrent ? 'text-cyan-200' : 'text-slate-500'
                  }`}>
                  {isLocked ? 'CLASSIFIED' : node.title}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {isLocked ? 'ENCRYPTED' : node.category}
                </div>
              </div>

              <div className="flex items-center justify-between w-full pt-1 border-t border-slate-800/80 text-[10px]">
                <span className={isCompleted ? 'text-emerald-400' : isCurrent ? 'text-cyan-400' : 'text-slate-600'}>
                  {node.points} PTS
                </span>
                {node.category === 'CTF Flag' && (
                  <span className="text-[9px] bg-purple-950/60 text-purple-300 border border-purple-500/30 px-1 rounded flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" /> CTF
                  </span>
                )}
                {isCurrent && (
                  <span className="text-[9px] text-cyan-300 font-bold tracking-wider animate-pulse">
                    TARGET
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
