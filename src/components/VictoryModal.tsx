import React from 'react';
import { sounds } from '../audio/soundEffects.ts';
import { Trophy, RotateCcw, Code, ArrowRight } from 'lucide-react';
import { PlayerResources } from '../game/rules.ts';

interface VictoryModalProps {
  isOpen: boolean;
  onPlayAgain: () => void;
  onOpenGodotHub: () => void;
  resources: PlayerResources;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  onPlayAgain,
  onOpenGodotHub,
  resources,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Island Sustainability Victory"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-none"
    >
      <div className="w-full max-w-lg bg-[#1a2332] border border-amber-400/50 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center text-white">
        {/* Trophy Header */}
        <div className="w-16 h-16 rounded-3xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 mb-4 shadow-inner">
          <Trophy className="w-8 h-8 text-amber-400 animate-bounce-slight" />
        </div>

        <h2 className="text-3xl font-black tracking-tight text-white">
          Island Sustainability Achieved!
        </h2>
        <p className="text-sm text-emerald-300 font-semibold mt-1">
          Kaz Island is now a carbon-negative eco paradise.
        </p>

        {/* Impact Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full my-6 p-4 rounded-2xl bg-slate-900/90 border border-slate-700/60">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Total Eco Score</div>
            <div className="text-xl font-black text-amber-400 tabular-nums">{resources.ecoScore}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">CO₂ Offset</div>
            <div className="text-xl font-black text-emerald-400 tabular-nums">{resources.carbonOffsetKg} kg</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Ocean Health</div>
            <div className="text-xl font-black text-sky-400 tabular-nums">{resources.marineHealthPct}%</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Resilience</div>
            <div className="text-xl font-black text-purple-400 tabular-nums">{resources.cityResiliencePct}%</div>
          </div>
        </div>

        <p className="text-xs text-slate-300 max-w-sm mb-6 leading-relaxed">
          Through conscious consumption, permaculture farming, clean wind energy, and marine protection, Kaz the Duck and the community established true climate resilience!
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <button
            data-start="true"
            onClick={() => {
              sounds.playClick();
              onPlayAgain();
            }}
            className="flex-1 flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm transition cursor-pointer shadow-lg"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Keep Farming & Exploring</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onOpenGodotHub();
            }}
            className="flex-1 flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-sm font-semibold transition cursor-pointer"
          >
            <Code className="w-4 h-4 text-emerald-400" />
            <span>Export Godot Scripts</span>
          </button>
        </div>
      </div>
    </div>
  );
};
