/**
 * Sustainable Geese (ClimateKaz) - 2.5D Orthographic Climate Change & SDG Farm Simulator
 * Top-level application controller integrating Three.js 2.5D isometric world with 5x map,
 * Paved City Roads Network, Elder Goose NPC (Professor Barnaby), Permaculture Soil Garden Beds,
 * Right-hand Drawer Menu with popups, and Godot 4 GDScript Hub.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ClimateKazScene } from './game/threeScene.ts';
import {
  INITIAL_RESOURCES,
  PlayerResources,
  TaskDefinition,
  completeTask,
  canStartTask,
  checkSustainabilityGoal,
  applyEfficiencyConsultation,
  INITIAL_SOIL_PLOTS,
  SoilPlot,
  plantSoilPlot,
  harvestSoilPlot,
  advanceSoilGrowth,
} from './game/rules.ts';
import { TitleScreen } from './components/TitleScreen.tsx';
import { GameHUD } from './components/GameHUD.tsx';
import { PauseModal } from './components/PauseModal.tsx';
import { VictoryModal } from './components/VictoryModal.tsx';
import { GodotViewerModal } from './components/GodotViewerModal.tsx';
import { NPCDialogModal } from './components/NPCDialogModal.tsx';
import { sounds } from './audio/soundEffects.ts';

export type GameState = 'title' | 'playing' | 'paused' | 'gameover';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ClimateKazScene | null>(null);

  const [gameState, setGameState] = useState<GameState>('title');
  const [resources, setResources] = useState<PlayerResources>(INITIAL_RESOURCES);
  const [nearbyTask, setNearbyTask] = useState<TaskDefinition | null>(null);
  const [isNearNPC, setIsNearNPC] = useState<boolean>(false);
  const [isNPCDialogOpen, setIsNPCDialogOpen] = useState<boolean>(false);
  const [activeExecutingTask, setActiveExecutingTask] = useState<TaskDefinition | null>(null);
  const [taskProgress, setTaskProgress] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(sounds.getMuted());
  const [isGodotHubOpen, setIsGodotHubOpen] = useState<boolean>(false);

  // Permaculture Soil Beds State
  const [soilPlots, setSoilPlots] = useState<SoilPlot[]>(INITIAL_SOIL_PLOTS);
  const [nearbySoilPlot, setNearbySoilPlot] = useState<SoilPlot | null>(null);

  // Sync state machine to document.body.dataset.state for testability
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Handle ?autostart=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      setGameState('playing');
      sounds.startAmbientBgm();
    }
  }, []);

  // Soil growth ticker (advances growing crops in garden beds)
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setSoilPlots((prev) => {
        const hasGrowing = prev.some((p) => p.state === 'growing');
        if (!hasGrowing) return prev;
        const next = advanceSoilGrowth(prev, 1.0);
        if (sceneRef.current) {
          sceneRef.current.updateSoilPlots(next);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState]);

  // Task execution timer ref
  const executingTimerRef = useRef<{
    taskId: string;
    startTime: number;
    duration: number;
    rafId: number;
  } | null>(null);

  // Plant a crop in a soil bed
  const handlePlantCrop = useCallback((plot: SoilPlot) => {
    setSoilPlots((prevPlots) => {
      setResources((prevRes) => {
        const result = plantSoilPlot(prevPlots, plot.id, prevRes);
        if (result.success) {
          sounds.playTaskComplete();
          if (sceneRef.current) {
            sceneRef.current.updateSoilPlots(result.plots);
            sceneRef.current.spawnBurstParticles(
              { x: plot.position.x, y: 0.5, z: plot.position.z } as any,
              16,
              0x4caf50
            );
          }
          return result.resources;
        }
        return prevRes;
      });
      const result = plantSoilPlot(prevPlots, plot.id, resources);
      return result.success ? result.plots : prevPlots;
    });
  }, [resources]);

  // Harvest a crop from a soil bed
  const handleHarvestCrop = useCallback((plot: SoilPlot) => {
    setSoilPlots((prevPlots) => {
      setResources((prevRes) => {
        const result = harvestSoilPlot(prevPlots, plot.id, prevRes);
        if (result.success) {
          sounds.playLevelUp();
          if (sceneRef.current) {
            sceneRef.current.updateSoilPlots(result.plots);
            sceneRef.current.spawnBurstParticles(
              { x: plot.position.x, y: 0.5, z: plot.position.z } as any,
              24,
              0xffb703
            );
          }
          return result.resources;
        }
        return prevRes;
      });
      const result = harvestSoilPlot(prevPlots, plot.id, resources);
      return result.success ? result.plots : prevPlots;
    });
  }, [resources]);

  const handleNavigateToSoilPlot = useCallback((plot: SoilPlot) => {
    if (sceneRef.current) {
      sceneRef.current.navigateToSoilPlot(plot);
    }
  }, []);

  // Stable callbacks for Three.js scene
  const handleStationProximity = useCallback((task: TaskDefinition | null) => {
    setNearbyTask(task);
  }, []);

  const handleStationClick = useCallback((task: TaskDefinition) => {
    setNearbyTask(task);
  }, []);

  const handlePlayerPosition = useCallback((_pos: { x: number; z: number }) => {
    // Passive tracking
  }, []);

  const handleNPCProximity = useCallback((isNear: boolean) => {
    setIsNearNPC(isNear);
  }, []);

  const handleNPCClick = useCallback(() => {
    sounds.playClick();
    setIsNPCDialogOpen(true);
  }, []);

  const handleSoilPlotProximity = useCallback((plot: SoilPlot | null) => {
    setNearbySoilPlot(plot);
  }, []);

  const handleSoilPlotClick = useCallback((plot: SoilPlot) => {
    setNearbySoilPlot(plot);
    if (plot.state === 'empty') {
      handlePlantCrop(plot);
    } else if (plot.state === 'mature') {
      handleHarvestCrop(plot);
    }
  }, [handlePlantCrop, handleHarvestCrop]);

  // Initialize Three.js scene once
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new ClimateKazScene(mountRef.current, {
      onStationProximity: handleStationProximity,
      onStationClick: handleStationClick,
      onPlayerPositionUpdate: handlePlayerPosition,
      onNPCProximity: handleNPCProximity,
      onNPCClick: handleNPCClick,
      onSoilPlotProximity: handleSoilPlotProximity,
      onSoilPlotClick: handleSoilPlotClick,
    });
    sceneRef.current = scene;

    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, [
    handleStationProximity,
    handleStationClick,
    handlePlayerPosition,
    handleNPCProximity,
    handleNPCClick,
    handleSoilPlotProximity,
    handleSoilPlotClick,
  ]);

  // Execute an SDG Task
  const executeTask = useCallback(
    (task: TaskDefinition) => {
      if (activeExecutingTask) return; // Already executing
      if (!canStartTask(resources, task)) {
        sounds.playClick();
        return;
      }

      setActiveExecutingTask(task);
      setTaskProgress(0);

      // Play thematic start sound
      if (task.topic === 'marine_health') {
        sounds.playWaterSplash();
      } else if (task.topic === 'zero_waste') {
        sounds.playPlasticCrunch();
      } else if (task.topic === 'renewable_energy') {
        sounds.playWindWhoosh();
      } else {
        sounds.playClick();
      }

      const durationMs = task.durationSeconds * 1000;
      const startTime = performance.now();

      const step = (now: number) => {
        const elapsed = now - startTime;
        const pct = Math.min(100, (elapsed / durationMs) * 100);
        setTaskProgress(pct);

        if (pct < 100) {
          executingTimerRef.current = {
            taskId: task.id,
            startTime,
            duration: durationMs,
            rafId: requestAnimationFrame(step),
          };
        } else {
          // Task Finished!
          setActiveExecutingTask(null);
          setTaskProgress(0);
          executingTimerRef.current = null;

          // Sound celebration
          sounds.playTaskComplete();

          setResources((prev) => {
            // Apply task completion with active efficiency multiplier
            const next = completeTask(prev, task, prev.efficiencyBonus);

            // Level up sound check
            if (next.level > prev.level) {
              sounds.playLevelUp();
            }

            // Visual updates
            if (sceneRef.current) {
              sceneRef.current.triggerTaskVisualUpdate(task, next);
            }

            // Check sustainability victory
            const victory = checkSustainabilityGoal(next);
            if (victory.isVictory) {
              setTimeout(() => {
                setGameState('gameover');
                sounds.playLevelUp();
              }, 600);
            }

            return next;
          });
        }
      };

      executingTimerRef.current = {
        taskId: task.id,
        startTime,
        duration: durationMs,
        rafId: requestAnimationFrame(step),
      };
    },
    [activeExecutingTask, resources]
  );

  // Apply Efficiency Boost from Professor Barnaby
  const handleApplyEfficiencyBoost = useCallback((topicId: string) => {
    setResources((prev) => applyEfficiencyConsultation(prev, topicId));
  }, []);

  // Navigate Kaz the Duck to a station or NPC
  const navigateToTask = useCallback((task: TaskDefinition) => {
    if (sceneRef.current) {
      sceneRef.current.navigateToStation(task);
    }
  }, []);

  const navigateToNPC = useCallback(() => {
    if (sceneRef.current) {
      sceneRef.current.navigateToNPC();
    }
  }, []);

  // Global Keybindings (Esc: Pause/Close, M: Mute, G: Godot Hub, E/Space: Interact)
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (isNPCDialogOpen) {
          sounds.playClick();
          setIsNPCDialogOpen(false);
          return;
        }
        if (gameState === 'playing') {
          sounds.playClick();
          setGameState('paused');
        } else if (gameState === 'paused') {
          sounds.playClick();
          setGameState('playing');
        }
      } else if (e.code === 'KeyM') {
        const muted = sounds.toggleMute();
        setIsMuted(muted);
      } else if (e.code === 'KeyG') {
        sounds.playClick();
        setIsGodotHubOpen((prev) => !prev);
      } else if (e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') {
        if (gameState === 'title') {
          sounds.playClick();
          setGameState('playing');
          sounds.startAmbientBgm();
        } else if (gameState === 'playing' && !isNPCDialogOpen) {
          if (isNearNPC) {
            sounds.playClick();
            setIsNPCDialogOpen(true);
          } else if (nearbySoilPlot) {
            if (nearbySoilPlot.state === 'empty') {
              handlePlantCrop(nearbySoilPlot);
            } else if (nearbySoilPlot.state === 'mature') {
              handleHarvestCrop(nearbySoilPlot);
            }
          } else if (nearbyTask && !activeExecutingTask) {
            executeTask(nearbyTask);
          }
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [
    gameState,
    isNPCDialogOpen,
    isNearNPC,
    nearbyTask,
    nearbySoilPlot,
    activeExecutingTask,
    executeTask,
    handlePlantCrop,
    handleHarvestCrop,
  ]);

  const handleStartGame = () => {
    setGameState('playing');
    sounds.startAmbientBgm();
  };

  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const handleRestartRun = () => {
    setResources(INITIAL_RESOURCES);
    setSoilPlots(INITIAL_SOIL_PLOTS);
    setActiveExecutingTask(null);
    setTaskProgress(0);
    setIsNPCDialogOpen(false);
    setGameState('playing');
    if (sceneRef.current) {
      sceneRef.current.updateSoilPlots(INITIAL_SOIL_PLOTS);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#16202c]">
      {/* Three.js Isolated Canvas Mount */}
      <div
        ref={mountRef}
        data-testid="game-canvas-container"
        className="absolute inset-0 z-0 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <TitleScreen
          onStartGame={handleStartGame}
          onOpenGodotHub={() => setIsGodotHubOpen(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Active Playing HUD with Right Drawer Menu */}
      {gameState === 'playing' && (
        <GameHUD
          resources={resources}
          nearbyTask={nearbyTask}
          activeExecutingTask={activeExecutingTask}
          taskProgress={taskProgress}
          isNearNPC={isNearNPC}
          soilPlots={soilPlots}
          nearbySoilPlot={nearbySoilPlot}
          onExecuteTask={executeTask}
          onNavigateToTask={navigateToTask}
          onOpenNPCDialog={() => setIsNPCDialogOpen(true)}
          onNavigateToNPC={navigateToNPC}
          onPlantCrop={handlePlantCrop}
          onHarvestCrop={handleHarvestCrop}
          onNavigateToSoilPlot={handleNavigateToSoilPlot}
          onPause={() => setGameState('paused')}
          onToggleMute={handleToggleMute}
          isMuted={isMuted}
          onOpenGodotHub={() => setIsGodotHubOpen(true)}
        />
      )}

      {/* Elder Goose NPC Dialogue Modal (Professor Barnaby) */}
      <NPCDialogModal
        isOpen={isNPCDialogOpen}
        onClose={() => setIsNPCDialogOpen(false)}
        resources={resources}
        onApplyEfficiencyBoost={handleApplyEfficiencyBoost}
      />

      {/* Paused Modal */}
      <PauseModal
        isOpen={gameState === 'paused'}
        onResume={() => setGameState('playing')}
        onRestart={handleRestartRun}
        onExitTitle={() => setGameState('title')}
        onOpenGodotHub={() => setIsGodotHubOpen(true)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        resources={resources}
      />

      {/* Victory / SDG Goal Achieved Modal */}
      <VictoryModal
        isOpen={gameState === 'gameover'}
        onPlayAgain={() => {
          setGameState('playing');
        }}
        onOpenGodotHub={() => setIsGodotHubOpen(true)}
        resources={resources}
      />

      {/* Godot 4 GDScript Code & Project Architecture Modal */}
      <GodotViewerModal
        isOpen={isGodotHubOpen}
        onClose={() => setIsGodotHubOpen(false)}
      />
    </div>
  );
}
