import React, { useState } from 'react';
import { PlayerResources, TaskDefinition, TASKS_CATALOG } from '../game/rules.ts';
import { sounds } from '../audio/soundEffects.ts';
import {
  Zap,
  Waves,
  Building2,
  TreePine,
  CheckCircle2,
  Navigation,
  Volume2,
  VolumeX,
  Pause,
  Code,
  Recycle,
  Sparkles,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface GameHUDProps {
  resources: PlayerResources;
  nearbyTask: TaskDefinition | null;
  activeExecutingTask: TaskDefinition | null;
  taskProgress: number;
  onExecuteTask: (task: TaskDefinition) => void;
  onNavigateToTask: (task: TaskDefinition) => void;
  onPause: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
  onOpenGodotHub: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  resources,
  nearbyTask,
  activeExecutingTask,
  taskProgress,
  onExecuteTask,
  onNavigateToTask,
  onPause,
  onToggleMute,
  isMuted,
  onOpenGodotHub,
}) => {
  const [tasksDockOpen, setTasksDockOpen] = useState(false);

  return (
    <div className="fixed inset-0 pointer-events-none z-30 flex flex-col justify-between p-3 sm:p-5 select-none font-sans">
      {/* Top Bar: Corner Clusters */}
      <div className="w-full flex items-start justify-between">
        {/* Top-Left Cluster: Eco Level, Score & Energy */}
        <div className="pointer-events-auto flex flex-col gap-2">
          {/* Main Hero Score Pill */}
          <div className="flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-slate-900/85 border border-emerald-500/40 shadow-lg text-white">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center shadow-inner">
              L{resources.level}
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">Island Eco Score</div>
              <div className="text-xl font-black tabular-nums text-white leading-none">
                {resources.ecoScore}
              </div>
            </div>
            <div className="h-7 w-[1px] bg-slate-700/80 mx-1" />
            <div>
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-amber-300 font-bold">
                <Zap className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>Clean Energy</span>
              </div>
              <div className="text-sm font-bold tabular-nums text-amber-200 leading-none">
                {Math.round(resources.cleanEnergyKwh)} <span className="text-[10px] text-amber-300/80">kWh</span>
              </div>
            </div>
          </div>

          {/* SDG Vitality Meters Cluster */}
          <div className="flex flex-wrap items-center gap-1.5 max-w-md">
            {/* Ocean Health */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-sky-500/30 text-sky-200 text-xs shadow-sm">
              <Waves className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-semibold text-[11px]">Ocean:</span>
              <span className="font-bold tabular-nums text-sky-100">{resources.marineHealthPct}%</span>
            </div>

            {/* City Resilience */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-purple-500/30 text-purple-200 text-xs shadow-sm">
              <Building2 className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-semibold text-[11px]">Resilience:</span>
              <span className="font-bold tabular-nums text-purple-100">{resources.cityResiliencePct}%</span>
            </div>

            {/* Carbon Offset */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-emerald-500/30 text-emerald-200 text-xs shadow-sm">
              <TreePine className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold text-[11px]">CO₂ Offset:</span>
              <span className="font-bold tabular-nums text-emerald-100">{resources.carbonOffsetKg} kg</span>
            </div>

            {/* Waste Recycled */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-teal-500/30 text-teal-200 text-xs shadow-sm">
              <Recycle className="w-3.5 h-3.5 text-teal-400" />
              <span className="font-semibold text-[11px]">Recycled:</span>
              <span className="font-bold tabular-nums text-teal-100">{resources.wasteRecycledKg} kg</span>
            </div>
          </div>
        </div>

        {/* Top-Right Cluster: Utility buttons */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Godot Code Hub */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenGodotHub();
            }}
            title="Inspect Godot Scripts (GDScript)"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500 text-slate-200 hover:text-white text-xs font-semibold transition cursor-pointer shadow-lg"
          >
            <Code className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Godot 4 Code</span>
          </button>

          {/* Mute button */}
          <button
            onClick={() => {
              sounds.playClick();
              onToggleMute();
            }}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="w-9 h-9 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white flex items-center justify-center transition cursor-pointer shadow-lg"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Pause button */}
          <button
            onClick={() => {
              sounds.playClick();
              onPause();
            }}
            aria-label="Pause Game"
            className="w-9 h-9 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white flex items-center justify-center transition cursor-pointer shadow-lg"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center Interactive Action Indicator (When near a station or executing) */}
      <div className="mx-auto flex flex-col items-center">
        {activeExecutingTask ? (
          <div className="pointer-events-auto flex flex-col items-center p-3 rounded-2xl bg-slate-900/95 border border-amber-400/60 shadow-2xl text-white max-w-sm text-center">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300 mb-1">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Completing: {activeExecutingTask.title}</span>
            </div>
            {/* Progress Bar */}
            <div className="w-56 h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700 mt-1">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-75"
                style={{ width: `${taskProgress}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Working sustainably with Kaz the Duck...</div>
          </div>
        ) : nearbyTask ? (
          <div className="pointer-events-auto animate-bounce-slight flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-emerald-400/80 shadow-2xl text-white">
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wide">
                {nearbyTask.categoryName} · {nearbyTask.sdgNumber}
              </div>
              <div className="text-sm font-bold text-white">{nearbyTask.title}</div>
            </div>
            <button
              onClick={() => onExecuteTask(nearbyTask)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer shadow"
            >
              <span>{nearbyTask.actionPrompt}</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-700 text-white text-[10px] font-mono">[Space]</span>
            </button>
          </div>
        ) : null}
      </div>

      {/* Bottom Unified Control Dock: SDG Tasks & Navigation */}
      <div className="pointer-events-auto w-full max-w-2xl mx-auto flex flex-col items-center">
        {/* Toggle Drawer Button */}
        <button
          onClick={() => {
            sounds.playClick();
            setTasksDockOpen(!tasksDockOpen);
          }}
          className="flex items-center gap-1.5 px-4 py-1 rounded-t-xl bg-slate-900/90 border-t border-x border-slate-700/80 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
        >
          <span>SDG Tasks & Goals ({resources.completedTaskIds.length}/{TASKS_CATALOG.length})</span>
          {tasksDockOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>

        {/* Collapsible Dock Card */}
        <div className="w-full bg-slate-900/95 border border-slate-700/80 rounded-2xl rounded-t-none p-3 shadow-2xl text-white">
          {tasksDockOpen ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {TASKS_CATALOG.map((task) => {
                const isCompleted = resources.completedTaskIds.includes(task.id);
                return (
                  <div
                    key={task.id}
                    className={`flex items-start justify-between p-2 rounded-xl border text-xs transition ${
                      isCompleted
                        ? 'bg-emerald-950/40 border-emerald-600/40 text-emerald-200'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-200 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex-1 pr-2">
                      <div className="flex items-center gap-1 font-bold">
                        {isCompleted ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full border border-slate-500 shrink-0 inline-block" />
                        )}
                        <span className="truncate">{task.title}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{task.categoryName} · +{task.rewardEcoScore} Eco</div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          sounds.playClick();
                          onNavigateToTask(task);
                        }}
                        title="Walk to station"
                        className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-[10px] font-semibold flex items-center gap-1 transition cursor-pointer"
                      >
                        <Navigation className="w-3 h-3 text-sky-400" />
                        <span>Go</span>
                      </button>
                      {!isCompleted && (
                        <button
                          onClick={() => onExecuteTask(task)}
                          title="Complete Task"
                          className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-[10px] font-bold text-white transition cursor-pointer"
                        >
                          Do
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Compact Dock Summary */
            <div className="flex items-center justify-between text-xs px-2 py-0.5">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="font-semibold text-emerald-400">Goals:</span>
                <span>{resources.completedTaskIds.length} of 7 SDGs achieved</span>
              </div>
              <div className="text-slate-400 text-[11px]">
                Click ground to move · Press Space to interact
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
