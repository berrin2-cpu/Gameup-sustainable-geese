import React from 'react';
import { sounds } from '../audio/soundEffects.ts';
import { Play, RotateCcw, Home, Code, Volume2, VolumeX } from 'lucide-react';
import { PlayerResources } from '../game/rules.ts';

interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onExitTitle: () => void;
  onOpenGodotHub: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  resources: PlayerResources;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  onResume,
  onRestart,
  onExitTitle,
  onOpenGodotHub,
  isMuted,
  onToggleMute,
  resources,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pause Menu"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-none"
    >
      <div className="w-full max-w-md bg-[#1a202c] border border-emerald-500/40 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center text-white">
        {/* Crest */}
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 mb-3 font-black text-xl">
          ⏸️
        </div>

        <h2 className="text-2xl font-black tracking-tight text-white">Game Paused</h2>
        <p className="text-xs text-slate-400 mt-1">Take a breath. Kaz Island will wait for you!</p>

        {/* Current Run Metrics */}
        <div className="grid grid-cols-3 gap-2 w-full my-5 p-3 rounded-2xl bg-slate-900/80 border border-slate-700/60">
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Eco Score</div>
            <div className="text-lg font-black text-emerald-400 tabular-nums">{resources.ecoScore}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">SDG Tasks</div>
            <div className="text-lg font-black text-amber-400 tabular-nums">
              {resources.completedTaskIds.length}/7
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Island Level</div>
            <div className="text-lg font-black text-sky-400 tabular-nums">Level {resources.level}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5 w-full">
          <button
            onClick={() => {
              sounds.playClick();
              onResume();
            }}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition cursor-pointer shadow-md"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Resume Simulation [Esc]</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onOpenGodotHub();
            }}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer border border-slate-700"
          >
            <Code className="w-4 h-4 text-emerald-400" />
            <span>Godot 4 Project Scripts</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onToggleMute();
            }}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-xs font-medium transition cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isMuted ? 'Unmute Sound' : 'Mute Sound [M]'}</span>
          </button>

          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => {
                sounds.playClick();
                onRestart();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-400 hover:text-white text-xs font-medium transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart Run</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                onExitTitle();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-400 hover:text-white text-xs font-medium transition cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Title Menu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
