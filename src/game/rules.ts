/**
 * Pure game rules, resource calculations, and state machines for Sustainable Geese (ClimateKaz).
 * Decoupled from React and Three.js rendering for deterministic unit testing.
 */

export type SDGTopic =
  | 'zero_waste'
  | 'climate_education'
  | 'food_security'
  | 'marine_health'
  | 'resilient_cities'
  | 'conscious_consumption'
  | 'renewable_energy';

export interface TaskDefinition {
  id: string;
  topic: SDGTopic;
  title: string;
  categoryName: string;
  sdgNumber: string;
  description: string;
  actionPrompt: string;
  icon: string;
  costEnergy: number;
  rewardEcoScore: number;
  rewardMetric: {
    type: 'carbonOffsetKg' | 'marineHealthPct' | 'cityResiliencePct' | 'foodSecurityBaskets' | 'wasteRecycledKg' | 'cleanEnergyKwh';
    amount: number;
  };
  durationSeconds: number; // easy completion duration
  location: { x: number; z: number };
  zoneName: string;
}

export interface PlayerResources {
  ecoScore: number;
  cleanEnergyKwh: number;
  carbonOffsetKg: number;
  marineHealthPct: number;
  cityResiliencePct: number;
  foodSecurityBaskets: number;
  wasteRecycledKg: number;
  completedTaskIds: string[];
  activeTaskCount: number;
  level: number;
  efficiencyBonus: number; // 1.0 base, 1.25 with Elder Goose consultation
  hasConsultedElder: boolean;
  consultedTopics: string[];
}

export const INITIAL_RESOURCES: PlayerResources = {
  ecoScore: 0,
  cleanEnergyKwh: 35,
  carbonOffsetKg: 0,
  marineHealthPct: 35,
  cityResiliencePct: 40,
  foodSecurityBaskets: 5,
  wasteRecycledKg: 0,
  completedTaskIds: [],
  activeTaskCount: 0,
  level: 1,
  efficiencyBonus: 1.0,
  hasConsultedElder: false,
  consultedTopics: [],
};

/**
 * 5x Enlarged Map Locations:
 * Island radius expanded from ~15 to ~70.
 * Tasks are stationed across dedicated city road districts and ecological reserves.
 */
export const TASKS_CATALOG: TaskDefinition[] = [
  {
    id: 'task_zw_plastic_sorting',
    topic: 'zero_waste',
    title: 'Sort Recyclables & Compost',
    categoryName: 'Zero Waste',
    sdgNumber: 'SDG 12: Responsible Consumption',
    description: 'Separate biodegradable greens from hard plastics and scrap glass at the Eco-Compost station.',
    actionPrompt: 'Sort Waste',
    icon: 'recycle',
    costEnergy: 5,
    rewardEcoScore: 60,
    rewardMetric: { type: 'wasteRecycledKg', amount: 25 },
    durationSeconds: 2.5,
    location: { x: -30, z: 20 },
    zoneName: 'Compost & Upcycling Hub',
  },
  {
    id: 'task_edu_climate_workshop',
    topic: 'climate_education',
    title: 'Host Island Climate Academy',
    categoryName: 'Climate Education',
    sdgNumber: 'SDG 13: Climate Action',
    description: 'Teach ducklings and visitors the fundamental science of greenhouse gases, albedo effect, and clean solutions.',
    actionPrompt: 'Teach Class',
    icon: 'graduation-cap',
    costEnergy: 8,
    rewardEcoScore: 80,
    rewardMetric: { type: 'carbonOffsetKg', amount: 40 },
    durationSeconds: 3.0,
    location: { x: 25, z: 30 },
    zoneName: 'Eco-Academy Gazebo',
  },
  {
    id: 'task_food_permaculture_harvest',
    topic: 'food_security',
    title: 'Organic Permaculture & Drip Feed',
    categoryName: 'Food Security',
    sdgNumber: 'SDG 2: Zero Hunger',
    description: 'Irrigate drought-resistant heirloom crops and harvest nutritious organic veggies for the island pantry.',
    actionPrompt: 'Harvest & Water',
    icon: 'sprout',
    costEnergy: 6,
    rewardEcoScore: 70,
    rewardMetric: { type: 'foodSecurityBaskets', amount: 15 },
    durationSeconds: 2.8,
    location: { x: 35, z: -20 },
    zoneName: 'Sun-Dappled Farmstead',
  },
  {
    id: 'task_marine_plastic_cleanse',
    topic: 'marine_health',
    title: 'Clear Marine Plastic & Restore Coral',
    categoryName: 'Ocean & Marine Health',
    sdgNumber: 'SDG 14: Life Below Water',
    description: 'Paddle into Kaz Bay to scoop discarded microplastics and seed heat-tolerant staghorn coral nurseries.',
    actionPrompt: 'Scoop & Restore',
    icon: 'waves',
    costEnergy: 10,
    rewardEcoScore: 90,
    rewardMetric: { type: 'marineHealthPct', amount: 18 },
    durationSeconds: 3.2,
    location: { x: -35, z: -30 },
    zoneName: 'Kaz Lagoon & Marine Sanctuary',
  },
  {
    id: 'task_city_green_rooftop',
    topic: 'resilient_cities',
    title: 'Build Green Roof & Bioswales',
    categoryName: 'Climate-Resilient Cities',
    sdgNumber: 'SDG 11: Sustainable Cities',
    description: 'Install living sedum roofs and permeable storm swales to catch flood runoff and eliminate urban heat islands.',
    actionPrompt: 'Upgrade Roof',
    icon: 'building-2',
    costEnergy: 12,
    rewardEcoScore: 100,
    rewardMetric: { type: 'cityResiliencePct', amount: 20 },
    durationSeconds: 3.5,
    location: { x: -28, z: 38 },
    zoneName: 'Civic Eco-District',
  },
  {
    id: 'task_carbon_conscious_bazaar',
    topic: 'conscious_consumption',
    title: 'Package-Free Pantry & Audit',
    categoryName: 'Conscious Consumption',
    sdgNumber: 'SDG 12: Circular Living',
    description: 'Audit supply miles, provide reusable burlap bags, and refill pantry jars to cut carbon footprints in half.',
    actionPrompt: 'Audit Footprint',
    icon: 'shopping-bag',
    costEnergy: 7,
    rewardEcoScore: 75,
    rewardMetric: { type: 'carbonOffsetKg', amount: 50 },
    durationSeconds: 2.6,
    location: { x: -20, z: -10 },
    zoneName: 'Conscious Bazaar',
  },
  {
    id: 'task_renew_wind_solar_grid',
    topic: 'renewable_energy',
    title: 'Tune Wind Turbines & Solar Array',
    categoryName: 'Renewable Energy',
    sdgNumber: 'SDG 7: Clean & Affordable Energy',
    description: 'Lubricate turbine yaw gears and align high-efficiency bifacial solar tracking to supply 100% green power.',
    actionPrompt: 'Calibrate Grid',
    icon: 'zap',
    costEnergy: 4,
    rewardEcoScore: 85,
    rewardMetric: { type: 'cleanEnergyKwh', amount: 45 },
    durationSeconds: 3.0,
    location: { x: 34, z: -36 },
    zoneName: 'Breeze Wind & Solar Park',
  },
];

/**
 * NPC Goose Location: Stationed at Central Plaza Garden Corner (Off the road)
 */
export const NPC_GOOSE_POSITION = { x: 7, z: -7 };

/**
 * Soil Plot Model: Permaculture Garden Beds where Kaz the Duck can plant organic crops
 */
export interface SoilPlot {
  id: string;
  name: string;
  cropName: string;
  cropIcon: string;
  position: { x: number; z: number };
  state: 'empty' | 'growing' | 'mature';
  growthProgress: number; // 0 to 100%
  growthRate: number; // % per second
  rewardEco: number;
  rewardFood: number;
  rewardCarbon: number;
}

export const INITIAL_SOIL_PLOTS: SoilPlot[] = [
  {
    id: 'plot_1',
    name: 'Garden Bed #1',
    cropName: 'Heirloom Carrots',
    cropIcon: '🥕',
    position: { x: 27, z: -14 },
    state: 'empty',
    growthProgress: 0,
    growthRate: 14,
    rewardEco: 25,
    rewardFood: 6,
    rewardCarbon: 10,
  },
  {
    id: 'plot_2',
    name: 'Garden Bed #2',
    cropName: 'Organic Sweetcorn',
    cropIcon: '🌽',
    position: { x: 30, z: -14 },
    state: 'growing',
    growthProgress: 55,
    growthRate: 10,
    rewardEco: 30,
    rewardFood: 8,
    rewardCarbon: 12,
  },
  {
    id: 'plot_3',
    name: 'Garden Bed #3',
    cropName: 'Pollinator Sunflowers',
    cropIcon: '🌻',
    position: { x: 33, z: -14 },
    state: 'mature',
    growthProgress: 100,
    growthRate: 12,
    rewardEco: 35,
    rewardFood: 4,
    rewardCarbon: 20,
  },
  {
    id: 'plot_4',
    name: 'Garden Bed #4',
    cropName: 'Nitrogen-Fixing Clover',
    cropIcon: '☘️',
    position: { x: 27, z: -17 },
    state: 'empty',
    growthProgress: 0,
    growthRate: 15,
    rewardEco: 20,
    rewardFood: 5,
    rewardCarbon: 15,
  },
  {
    id: 'plot_5',
    name: 'Garden Bed #5',
    cropName: 'Heritage Bush Tomatoes',
    cropIcon: '🍅',
    position: { x: 30, z: -17 },
    state: 'empty',
    growthProgress: 0,
    growthRate: 11,
    rewardEco: 28,
    rewardFood: 7,
    rewardCarbon: 12,
  },
  {
    id: 'plot_6',
    name: 'Garden Bed #6',
    cropName: 'Golden Permaculture Squash',
    cropIcon: '🎃',
    position: { x: 33, z: -17 },
    state: 'growing',
    growthProgress: 70,
    growthRate: 9,
    rewardEco: 32,
    rewardFood: 9,
    rewardCarbon: 14,
  },
];

/**
 * Plants seeds in an empty soil bed.
 */
export function plantSoilPlot(
  plots: SoilPlot[],
  plotId: string,
  resources: PlayerResources
): { plots: SoilPlot[]; resources: PlayerResources; success: boolean } {
  const target = plots.find((p) => p.id === plotId);
  if (!target || target.state !== 'empty') {
    return { plots, resources, success: false };
  }

  const bonus = resources.efficiencyBonus || 1.0;
  const updatedPlots = plots.map((p) => {
    if (p.id === plotId) {
      return {
        ...p,
        state: 'growing' as const,
        growthProgress: 5,
      };
    }
    return p;
  });

  const nextResources: PlayerResources = {
    ...resources,
    ecoScore: resources.ecoScore + Math.round(10 * bonus),
    carbonOffsetKg: resources.carbonOffsetKg + Math.round(4 * bonus),
    level: calculateLevel(resources.ecoScore + Math.round(10 * bonus)),
  };

  return { plots: updatedPlots, resources: nextResources, success: true };
}

/**
 * Harvests mature crops from a soil bed, yielding food and eco score.
 */
export function harvestSoilPlot(
  plots: SoilPlot[],
  plotId: string,
  resources: PlayerResources
): { plots: SoilPlot[]; resources: PlayerResources; success: boolean } {
  const target = plots.find((p) => p.id === plotId);
  if (!target || target.state !== 'mature') {
    return { plots, resources, success: false };
  }

  const bonus = resources.efficiencyBonus || 1.0;
  const earnedEco = Math.round(target.rewardEco * bonus);
  const earnedFood = Math.round(target.rewardFood * bonus);
  const earnedCarbon = Math.round(target.rewardCarbon * bonus);

  const updatedPlots = plots.map((p) => {
    if (p.id === plotId) {
      return {
        ...p,
        state: 'empty' as const,
        growthProgress: 0,
      };
    }
    return p;
  });

  const nextResources: PlayerResources = {
    ...resources,
    ecoScore: resources.ecoScore + earnedEco,
    foodSecurityBaskets: resources.foodSecurityBaskets + earnedFood,
    carbonOffsetKg: resources.carbonOffsetKg + earnedCarbon,
    level: calculateLevel(resources.ecoScore + earnedEco),
  };

  return { plots: updatedPlots, resources: nextResources, success: true };
}

/**
 * Advances crop growth over elapsed seconds.
 */
export function advanceSoilGrowth(plots: SoilPlot[], deltaSeconds: number): SoilPlot[] {
  return plots.map((p) => {
    if (p.state !== 'growing') return p;
    const nextProgress = Math.min(100, p.growthProgress + p.growthRate * deltaSeconds);
    if (nextProgress >= 100) {
      return {
        ...p,
        growthProgress: 100,
        state: 'mature',
      };
    }
    return {
      ...p,
      growthProgress: nextProgress,
    };
  });
}

export interface ElderConversation {
  id: string;
  topicTitle: string;
  sdgTopic?: SDGTopic;
  elderDialogue: string;
  efficiencyTip: string;
  recommendedOrder: number;
}

export const ELDER_GOOSE_CONVERSATIONS: ElderConversation[] = [
  {
    id: 'strategy_golden_order',
    topicTitle: 'The Golden Task Loop',
    elderDialogue:
      'Honk greetings, young flyer! To manage our island without exhausting your wings, start at Breeze Wind & Solar Park. Calibrating the turbines first supplies you with abundant kWh energy to power all subsequent city and marine operations!',
    efficiencyTip:
      'Always start by tuning Renewables (+45 kWh). This eliminates energy shortages for the expensive City (+12) and Marine (+10) projects.',
    recommendedOrder: 1,
  },
  {
    id: 'strategy_zero_waste_compost',
    topicTitle: 'Compost-to-Permaculture Cascade',
    sdgTopic: 'zero_waste',
    elderDialogue:
      'Did you know that sorting organic scraps before visiting the Farmstead yields richer soil amendments? Zero waste is not just cleaning; it is nutrient recycling that speeds up food crop growth by 30%!',
    efficiencyTip:
      'Sort recyclables at the Zero Waste station right before harvesting permaculture crops to create a circular nutrient cycle.',
    recommendedOrder: 2,
  },
  {
    id: 'strategy_urban_bioswales',
    topicTitle: 'Bioswales & Flood Protection',
    sdgTopic: 'resilient_cities',
    elderDialogue:
      'When storm surges hit our paved avenues, raw runoff will overwhelm Kaz Lagoon if the green roofs and bioswales are dry. Constructing urban green roofs captures rainwater at the source!',
    efficiencyTip:
      'Upgrading civic green roofs stabilizes city resilience above 75%, which prevents toxic overflow into the marine sanctuary.',
    recommendedOrder: 3,
  },
  {
    id: 'strategy_marine_currents',
    topicTitle: 'Lagoon Surface Cleanup Timing',
    sdgTopic: 'marine_health',
    elderDialogue:
      'Marine plastics break into harmful microplastics under intense afternoon ultraviolet sun. Paddle into the bay early to recover full bottles before they shatter into untraceable particles!',
    efficiencyTip:
      'Clear marine plastics promptly. Reaching 80%+ marine health unlocks coral bloom resilience and completes the ocean victory metric.',
    recommendedOrder: 4,
  },
  {
    id: 'strategy_education_multiplier',
    topicTitle: 'Climate Academy Ripple Effect',
    sdgTopic: 'climate_education',
    elderDialogue:
      'Teaching at the Academy does not just impart knowledge—it creates goose ambassadors! Every duckling educated spreads Conscious Bazaar purchasing habits throughout their neighborhood flocks.',
    efficiencyTip:
      'Hosting the Academy workshop triggers a civic awareness ripple that boosts conscious consumption rewards across the island.',
    recommendedOrder: 5,
  },
  {
    id: 'strategy_conscious_pantry',
    topicTitle: 'Short Supply Miles & Bulk Pantries',
    sdgTopic: 'conscious_consumption',
    elderDialogue:
      'At the Conscious Bazaar, packaging accounts for up to 40% of transport emissions. Encouraging bulk burlap sacks and glass refill jars cuts carbon footprint at zero energy loss!',
    efficiencyTip:
      'Combine conscious consumption audits with local permaculture harvests to eliminate food transport carbon emissions entirely.',
    recommendedOrder: 6,
  },
  {
    id: 'strategy_wind_solar_baseload',
    topicTitle: 'Grid Storage Balancing',
    sdgTopic: 'renewable_energy',
    elderDialogue:
      'The island battery caps at 120 kWh. Do not tune turbines when the battery is already above 80 kWh, or surplus green energy is wasted! Balance consumption and generation.',
    efficiencyTip:
      'Spend your clean energy on City and Marine tasks first, then recharge with Wind & Solar to avoid wasting battery storage headroom.',
    recommendedOrder: 7,
  },
];

/**
 * Consult with Professor Barnaby to gain efficiency wisdom and a +25% bonus multiplier.
 */
export function applyEfficiencyConsultation(
  resources: PlayerResources,
  topicId: string
): PlayerResources {
  const isFirstConsult = !resources.hasConsultedElder;
  const alreadyViewed = resources.consultedTopics.includes(topicId);
  const updatedTopics = alreadyViewed
    ? resources.consultedTopics
    : [...resources.consultedTopics, topicId];

  return {
    ...resources,
    hasConsultedElder: true,
    efficiencyBonus: Math.max(1.25, resources.efficiencyBonus),
    consultedTopics: updatedTopics,
    // First consultation or new advice awards a small inspiration eco bonus
    ecoScore: resources.ecoScore + (isFirstConsult ? 35 : (alreadyViewed ? 0 : 15)),
  };
}

/**
 * Validates whether player has enough energy to initiate a task.
 */
export function canStartTask(resources: PlayerResources, task: TaskDefinition): boolean {
  return resources.cleanEnergyKwh >= task.costEnergy;
}

/**
 * Calculates level based on cumulative Eco Score.
 */
export function calculateLevel(ecoScore: number): number {
  if (ecoScore < 100) return 1;
  if (ecoScore < 250) return 2;
  if (ecoScore < 450) return 3;
  if (ecoScore < 700) return 4;
  return Math.min(10, 5 + Math.floor((ecoScore - 700) / 300));
}

/**
 * Computes updated resources upon task completion, applying active efficiency bonus.
 */
export function completeTask(
  current: PlayerResources,
  task: TaskDefinition,
  customBonus?: number
): PlayerResources {
  const bonusMultiplier = Math.max(1.0, customBonus ?? current.efficiencyBonus ?? 1.0);
  const earnedEco = Math.round(task.rewardEcoScore * bonusMultiplier);
  const newEcoScore = current.ecoScore + earnedEco;

  const next: PlayerResources = {
    ...current,
    ecoScore: newEcoScore,
    cleanEnergyKwh: Math.max(0, current.cleanEnergyKwh - task.costEnergy),
    completedTaskIds: current.completedTaskIds.includes(task.id)
      ? current.completedTaskIds
      : [...current.completedTaskIds, task.id],
    activeTaskCount: Math.max(0, current.activeTaskCount - 1),
    level: calculateLevel(newEcoScore),
  };

  // Apply reward metric with bonus multiplier
  switch (task.rewardMetric.type) {
    case 'carbonOffsetKg':
      next.carbonOffsetKg += Math.round(task.rewardMetric.amount * bonusMultiplier);
      break;
    case 'marineHealthPct':
      next.marineHealthPct = Math.min(
        100,
        current.marineHealthPct + Math.round(task.rewardMetric.amount * bonusMultiplier)
      );
      break;
    case 'cityResiliencePct':
      next.cityResiliencePct = Math.min(
        100,
        current.cityResiliencePct + Math.round(task.rewardMetric.amount * bonusMultiplier)
      );
      break;
    case 'foodSecurityBaskets':
      next.foodSecurityBaskets += Math.round(task.rewardMetric.amount * bonusMultiplier);
      break;
    case 'wasteRecycledKg':
      next.wasteRecycledKg += Math.round(task.rewardMetric.amount * bonusMultiplier);
      break;
    case 'cleanEnergyKwh':
      next.cleanEnergyKwh = Math.min(
        120,
        next.cleanEnergyKwh + Math.round(task.rewardMetric.amount * bonusMultiplier)
      );
      break;
  }

  return next;
}

/**
 * Checks overall island sustainability milestone victory condition.
 * All 7 core tasks completed or Eco Score >= 500 with balanced metrics.
 */
export function checkSustainabilityGoal(resources: PlayerResources): {
  isVictory: boolean;
  progressPct: number;
  missingGoals: string[];
} {
  const missing: string[] = [];
  const uniqueCompleted = new Set(resources.completedTaskIds);

  if (uniqueCompleted.size < TASKS_CATALOG.length) {
    missing.push(`${TASKS_CATALOG.length - uniqueCompleted.size} SDG goals remaining`);
  }
  if (resources.marineHealthPct < 80) {
    missing.push('Ocean health below 80%');
  }
  if (resources.cityResiliencePct < 75) {
    missing.push('City resilience below 75%');
  }
  if (resources.ecoScore < 500) {
    missing.push('Eco Score below 500');
  }

  const completionFraction = uniqueCompleted.size / TASKS_CATALOG.length;
  const metricsAvg = (resources.marineHealthPct + resources.cityResiliencePct) / 200;
  const isVictory = missing.length === 0;
  const rawProgress = Math.round((completionFraction * 0.6 + metricsAvg * 0.4) * 100);
  const progressPct = isVictory ? 100 : Math.min(99, rawProgress);

  return {
    isVictory,
    progressPct,
    missingGoals: missing,
  };
}

/**
 * Distance check in 2.5D world plane (XZ plane)
 */
export function calculateDistance2D(
  p1: { x: number; z: number },
  p2: { x: number; z: number }
): number {
  const dx = p1.x - p2.x;
  const dz = p1.z - p2.z;
  return Math.sqrt(dx * dx + dz * dz);
}
