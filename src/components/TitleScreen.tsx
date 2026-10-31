import React from 'react';
import { sounds } from '../audio/soundEffects.ts';
import { Play, Code, BookOpen, Volume2, VolumeX } from 'lucide-react';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenGodotHub: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenGodotHub,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div
      data-testid="title-screen"
      className="fixed inset-0 z-40 flex flex-col justify-between items-center pointer-events-auto p-6 md:p-10 select-none bg-gradient-to-b from-slate-950/50 via-slate-950/25 to-slate-950/65"
    >
      {/* Top Utility Bar */}
      <div className="w-full max-w-5xl flex items-center justify-between">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-900/60 border border-emerald-500/40 text-emerald-200 text-xs font-semibold tracking-wide shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Sustainable Geese · UN Sustainable Development Goals</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sounds.playClick();
              onOpenGodotHub();
            }}
            aria-label="Inspect Godot GDScripts"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700 hover:border-emerald-400 text-slate-200 hover:text-white text-xs font-medium transition cursor-pointer shadow"
          >
            <Code className="w-4 h-4 text-emerald-400" />
            <span>Godot 4 Scripts</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onToggleMute();
            }}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="w-9 h-9 rounded-lg bg-slate-900/80 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer shadow"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Center Hero Title Lockup with Bespoke Inline SVG Emblem */}
      <div className="flex flex-col items-center text-center max-w-xl my-auto">
        {/* Bespoke Inline SVG Logo */}
        <div className="mb-4 drop-shadow-xl animate-bounce-slight">
          <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outer Eco Crest Ring */}
            <circle cx="50" cy="50" r="44" fill="#2d6a4f" stroke="#74c69d" strokeWidth="4" />
            {/* Sun Rays & Ocean Waves */}
            <path d="M20 62C28 58 36 66 50 62C64 58 72 66 80 62V78C80 78 68 84 50 84C32 84 20 78 20 78V62Z" fill="#1b4965" />
            <path d="M22 66C30 63 38 69 50 66C62 63 70 69 78 66" stroke="#62b6cb" strokeWidth="2.5" strokeLinecap="round" />
            {/* Wind Turbine Blades */}
            <path d="M50 20V50" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M50 30L34 20" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            <path d="M50 30L66 20" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            {/* Cute Duck Head Silhouette */}
            <circle cx="50" cy="48" r="14" fill="#ffd124" stroke="#e09f3e" strokeWidth="1.5" />
            {/* Cute Duck Bill */}
            <path d="M58 48C63 48 66 51 64 54C61 56 56 55 56 52" fill="#ff7a00" />
            {/* Duck Eye */}
            <circle cx="52" cy="45" r="2.2" fill="#1e293b" />
            {/* Green Sprout Hat */}
            <path d="M46 34C44 28 50 26 53 30C56 26 62 28 60 34" fill="#52b788" />
          </svg>
        </div>

        {/* Game Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
          Sustainable <span className="text-amber-400">Geese</span>
        </h1>
        <p className="mt-2 text-sm sm:text-base font-semibold text-emerald-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)] max-w-md">
          Cozy 2.5D Orthographic Climate & SDG Farm Sim
        </p>

        <p className="mt-1 text-xs text-slate-200/90 max-w-md leading-relaxed drop-shadow">
          Take on the 7 Sustainable Development Goals: zero waste, food security, ocean cleaning, climate education, green cities, and clean renewable energy!
        </p>

        {/* Primary Action Button */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <button
            data-start="true"
            onClick={() => {
              sounds.playClick();
              onStartGame();
            }}
            className="group relative flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-base shadow-[0_6px_20px_rgba(245,158,11,0.4)] active:translate-y-0.5 transition cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current transition group-hover:scale-110" />
            <span>Start Adventure</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onOpenGodotHub();
            }}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-100 text-sm font-semibold shadow-lg transition cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Godot Project Architecture</span>
          </button>
        </div>
      </div>

      {/* Bottom Control Hint Bar */}
      <div className="w-full text-center text-xs font-medium text-slate-200 drop-shadow tracking-wide pb-2">
        <span className="px-3 py-1 rounded-full bg-slate-900/60 border border-slate-700/50">
          WASD / Arrow Keys Move · Space / Click Action · Esc Pause
        </span>
      </div>
    </div>
  );
};
