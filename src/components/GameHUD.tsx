import React, { useState } from 'react';
import { PlayerResources, TaskDefinition, TASKS_CATALOG, SoilPlot } from '../game/rules.ts';
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
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Sprout,
  Apple,
} from 'lucide-react';

interface GameHUDProps {
  resources: PlayerResources;
  nearbyTask: TaskDefinition | null;
  activeExecutingTask: TaskDefinition | null;
  taskProgress: number;
  isNearNPC: boolean;
  soilPlots: SoilPlot[];
  nearbySoilPlot: SoilPlot | null;
  onExecuteTask: (task: TaskDefinition) => void;
  onNavigateToTask: (task: TaskDefinition) => void;
  onOpenNPCDialog: () => void;
  onNavigateToNPC: () => void;
  onPlantCrop: (plot: SoilPlot) => void;
  onHarvestCrop: (plot: SoilPlot) => void;
  onNavigateToSoilPlot: (plot: SoilPlot) => void;
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
  isNearNPC,
  soilPlots,
  nearbySoilPlot,
  onExecuteTask,
  onNavigateToTask,
  onOpenNPCDialog,
  onNavigateToNPC,
  onPlantCrop,
  onHarvestCrop,
  onNavigateToSoilPlot,
  onPause,
  onToggleMute,
  isMuted,
  onOpenGodotHub,
}) => {
  // Right-side drawer menu state (starts open on first load for easy discovery)
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [drawerTab, setDrawerTab] = useState<'tasks' | 'soil'>('tasks');

  const completedCount = resources.completedTaskIds.length;
  const maturePlotsCount = soilPlots.filter((p) => p.state === 'mature').length;
  const emptyPlotsCount = soilPlots.filter((p) => p.state === 'empty').length;

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

            {/* Efficiency Multiplier Badge */}
            {resources.efficiencyBonus > 1.0 && (
              <>
                <div className="h-7 w-[1px] bg-slate-700/80 mx-1" />
                <button
                  onClick={() => {
                    sounds.playClick();
                    onOpenNPCDialog();
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-xl bg-amber-400 text-amber-950 text-[11px] font-black border border-amber-300 shadow-xs hover:bg-amber-300 transition cursor-pointer"
                  title="View active efficiency advice from Professor Barnaby"
                >
                  <span>⚡</span>
                  <span>{resources.efficiencyBonus}x Boost</span>
                </button>
              </>
            )}
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
              <span className="font-semibold text-[11px]">City:</span>
              <span className="font-bold tabular-nums text-purple-100">{resources.cityResiliencePct}%</span>
            </div>

            {/* Food Security */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-amber-500/30 text-amber-200 text-xs shadow-sm">
              <Apple className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-[11px]">Food:</span>
              <span className="font-bold tabular-nums text-amber-100">{resources.foodSecurityBaskets} bsk</span>
            </div>

            {/* Carbon Offset */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-emerald-500/30 text-emerald-200 text-xs shadow-sm">
              <TreePine className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold text-[11px]">CO₂:</span>
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
          {/* Talk with Professor Barnaby shortcut */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenNPCDialog();
            }}
            title="Talk with Professor Barnaby (Efficiency Guide)"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xs transition cursor-pointer shadow-lg border border-amber-300"
          >
            <span>🪿</span>
            <span className="hidden sm:inline">Ask Professor</span>
          </button>

          {/* Godot Code Hub */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenGodotHub();
            }}
            title="Inspect Godot Scripts (GDScript & Scenes)"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500 text-slate-200 hover:text-white text-xs font-semibold transition cursor-pointer shadow-lg"
          >
            <Code className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Godot 4 Hub</span>
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

      {/* RIGHT-SIDE TAB AND DRAWER MENU CONTAINER */}
      <div className="fixed right-0 top-20 bottom-4 pointer-events-auto flex items-start z-40">
        {/* Sticky Tab Button on the Right Edge */}
        <button
          onClick={() => {
            sounds.playClick();
            setDrawerOpen(!drawerOpen);
          }}
          aria-label={drawerOpen ? 'Close Drawer Menu' : 'Open Drawer Menu'}
          className="flex flex-col items-center gap-1 py-3 px-2 rounded-l-2xl bg-slate-900/95 border-y border-l border-emerald-500/50 shadow-2xl text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
        >
          {drawerOpen ? (
            <ChevronRight className="w-4 h-4 text-emerald-400" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-emerald-400" />
          )}

          <span className="writing-vertical text-[11px] font-black tracking-wider text-emerald-300 uppercase py-1">
            Tasks & Soil
          </span>

          {/* Status notification pill */}
          <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
            {completedCount}
          </span>
          {maturePlotsCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center" title={`${maturePlotsCount} crops ready to harvest`}>
              🌾
            </span>
          )}
        </button>

        {/* Slide-out Right Drawer Panel */}
        {drawerOpen && (
          <div className="w-80 sm:w-96 h-full bg-slate-900/95 border-y border-l border-slate-700/80 rounded-l-2xl p-3 shadow-2xl text-white flex flex-col justify-between overflow-hidden backdrop-blur-md">
            {/* Header & Tabs */}
            <div className="flex flex-col gap-2 shrink-0">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">📋</span>
                  <span className="font-black text-sm text-white">Operations Drawer</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {completedCount}/7 SDGs · {maturePlotsCount} Harvests
                </div>
              </div>

              {/* Sub-Tabs: Tasks vs Permaculture Soil Beds */}
              <div className="grid grid-cols-2 gap-1 p-0.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <button
                  onClick={() => {
                    sounds.playClick();
                    setDrawerTab('tasks');
                  }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    drawerTab === 'tasks'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <span>SDG Tasks</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900/40 font-mono">
                    {completedCount}/7
                  </span>
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    setDrawerTab('soil');
                  }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    drawerTab === 'soil'
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Sprout className="w-3.5 h-3.5" />
                  <span>Plant Soil</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900/40 font-mono">
                    {emptyPlotsCount > 0 ? `${emptyPlotsCount} ready` : '6 plots'}
                  </span>
                </button>
              </div>
            </div>

            {/* Top Dedicated Action Card (Popups docked right here in drawer) */}
            <div className="my-2 shrink-0">
              {activeExecutingTask ? (
                <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-400/80 shadow text-amber-100 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1 text-amber-300">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      <span>Completing Task...</span>
                    </span>
                    <span className="tabular-nums font-mono text-amber-200">{Math.round(taskProgress)}%</span>
                  </div>
                  <div className="text-xs font-semibold text-white truncate">{activeExecutingTask.title}</div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-amber-500/30">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-75"
                      style={{ width: `${taskProgress}%` }}
                    />
                  </div>
                </div>
              ) : nearbySoilPlot ? (
                <div className="p-2.5 rounded-xl bg-emerald-950/70 border-2 border-emerald-400 shadow text-emerald-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-emerald-300">
                      Permaculture Bed: {nearbySoilPlot.name}
                    </div>
                    <div className="text-xs font-bold text-white flex items-center gap-1">
                      <span>{nearbySoilPlot.cropIcon}</span>
                      <span>{nearbySoilPlot.cropName}</span>
                    </div>
                  </div>
                  {nearbySoilPlot.state === 'empty' ? (
                    <button
                      onClick={() => onPlantCrop(nearbySoilPlot)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition cursor-pointer shadow"
                    >
                      <span>Plant [Space]</span>
                    </button>
                  ) : nearbySoilPlot.state === 'mature' ? (
                    <button
                      onClick={() => onHarvestCrop(nearbySoilPlot)}
                      className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition cursor-pointer shadow"
                    >
                      <span>Harvest [Space]</span>
                    </button>
                  ) : (
                    <div className="text-[10px] font-mono text-amber-300 px-2 py-1 rounded bg-slate-800">
                      Growing {Math.round(nearbySoilPlot.growthProgress)}%
                    </div>
                  )}
                </div>
              ) : isNearNPC ? (
                <div className="p-2.5 rounded-xl bg-amber-950/70 border-2 border-amber-400 shadow text-amber-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-amber-300 flex items-center gap-1">
                      <span>🪿 Professor Barnaby</span>
                      <span className="font-normal text-amber-200">· Guide</span>
                    </div>
                    <div className="text-xs font-bold text-white">Efficiency Strategies</div>
                  </div>
                  <button
                    onClick={() => {
                      sounds.playClick();
                      onOpenNPCDialog();
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition cursor-pointer shadow"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Talk [E]</span>
                  </button>
                </div>
              ) : nearbyTask ? (
                <div className="p-2.5 rounded-xl bg-emerald-950/70 border-2 border-emerald-400 shadow text-emerald-100 flex items-center justify-between">
                  <div className="truncate mr-2">
                    <div className="text-[10px] uppercase font-bold text-emerald-300 truncate">
                      {nearbyTask.categoryName} · {nearbyTask.sdgNumber}
                    </div>
                    <div className="text-xs font-bold text-white truncate">{nearbyTask.title}</div>
                  </div>
                  <button
                    onClick={() => onExecuteTask(nearbyTask)}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition cursor-pointer shadow"
                  >
                    <span>{nearbyTask.actionPrompt} [Space]</span>
                  </button>
                </div>
              ) : (
                <div className="px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-400 text-xs text-center">
                  Click ground, beds, or stations to direct Kaz the Duck
                </div>
              )}
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2">
              {drawerTab === 'tasks' ? (
                <>
                  {/* Professor Barnaby Fast Travel Card */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs">
                    <div className="flex items-center gap-2 font-bold">
                      <span className="text-lg">🪿</span>
                      <div>
                        <div className="font-black text-amber-100">Central Plaza · Professor</div>
                        <div className="text-[10px] text-amber-300/80">Elder Goose · +25% Efficiency</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          sounds.playClick();
                          onNavigateToNPC();
                        }}
                        className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-amber-950 text-[10px] font-bold flex items-center gap-1 transition"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>Go</span>
                      </button>
                      <button
                        onClick={() => {
                          sounds.playClick();
                          onOpenNPCDialog();
                        }}
                        className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold transition"
                      >
                        Talk
                      </button>
                    </div>
                  </div>

                  {/* 7 SDG Tasks Catalog */}
                  <div className="flex flex-col gap-1.5">
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
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {task.zoneName} · +{task.rewardEcoScore} Eco
                            </div>
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
                </>
              ) : (
                /* Permaculture Soil Beds List */
                <div className="flex flex-col gap-1.5">
                  <div className="text-[11px] text-slate-300 px-1 leading-snug">
                    Plant heirloom organic seeds to restore island soil health and yield food baskets:
                  </div>

                  {soilPlots.map((plot) => (
                    <div
                      key={plot.id}
                      className={`flex items-start justify-between p-2 rounded-xl border text-xs transition ${
                        plot.state === 'mature'
                          ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                          : plot.state === 'growing'
                          ? 'bg-slate-800/60 border-slate-700 text-slate-200'
                          : 'bg-slate-800/40 border-dashed border-slate-600 text-slate-300'
                      }`}
                    >
                      <div className="flex-1 pr-2">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="text-base">{plot.cropIcon}</span>
                          <div>
                            <div className="text-white text-xs leading-none">{plot.cropName}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{plot.name}</div>
                          </div>
                        </div>

                        {/* Progress or Reward info */}
                        {plot.state === 'growing' ? (
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-400"
                                style={{ width: `${plot.growthProgress}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-amber-300">
                              {Math.round(plot.growthProgress)}%
                            </span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-emerald-400 mt-1">
                            +{plot.rewardEco} Eco · +{plot.rewardFood} Food · +{plot.rewardCarbon} CO₂
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            sounds.playClick();
                            onNavigateToSoilPlot(plot);
                          }}
                          title="Walk to this garden bed"
                          className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-[10px] font-semibold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Navigation className="w-3 h-3 text-emerald-400" />
                          <span>Go</span>
                        </button>

                        {plot.state === 'empty' ? (
                          <button
                            onClick={() => onPlantCrop(plot)}
                            title="Plant seeds in this bed"
                            className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-[10px] font-bold text-white transition cursor-pointer"
                          >
                            Plant
                          </button>
                        ) : plot.state === 'mature' ? (
                          <button
                            onClick={() => onHarvestCrop(plot)}
                            title="Harvest organic produce"
                            className="px-2 py-1 rounded bg-amber-400 hover:bg-amber-300 text-[10px] font-bold text-slate-950 transition cursor-pointer"
                          >
                            Harvest
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Drawer Footer Info */}
            <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between shrink-0">
              <span>Cozy SDG Island Farm</span>
              <span>Press [Space] to act</span>
            </div>
          </div>
        )}

        {/* When drawer is closed, show floating prompt pill on right margin if action is nearby */}
        {!drawerOpen && (activeExecutingTask || nearbySoilPlot || isNearNPC || nearbyTask) && (
          <div className="ml-2 pointer-events-auto">
            {activeExecutingTask ? (
              <div className="p-2.5 rounded-xl bg-slate-900/95 border-2 border-amber-400 shadow-2xl text-amber-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
                <span className="text-xs font-bold tabular-nums">{Math.round(taskProgress)}%</span>
              </div>
            ) : nearbySoilPlot ? (
              <button
                onClick={() => {
                  if (nearbySoilPlot.state === 'empty') onPlantCrop(nearbySoilPlot);
                  else if (nearbySoilPlot.state === 'mature') onHarvestCrop(nearbySoilPlot);
                }}
                className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-2xl transition flex items-center gap-1 cursor-pointer"
              >
                <span>{nearbySoilPlot.cropIcon}</span>
                <span>{nearbySoilPlot.state === 'empty' ? 'Plant' : 'Harvest'} [Space]</span>
              </button>
            ) : isNearNPC ? (
              <button
                onClick={() => {
                  sounds.playClick();
                  onOpenNPCDialog();
                }}
                className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-2xl transition flex items-center gap-1 cursor-pointer"
              >
                <span>🪿</span>
                <span>Talk [E]</span>
              </button>
            ) : nearbyTask ? (
              <button
                onClick={() => onExecuteTask(nearbyTask)}
                className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-2xl transition flex items-center gap-1 cursor-pointer"
              >
                <span>{nearbyTask.actionPrompt} [Space]</span>
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
