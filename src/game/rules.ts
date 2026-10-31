/**
 * Pure game rules, resource calculations, and state machines for ClimateKaz.
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
};

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
    location: { x: -6, z: 4 },
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
    location: { x: 5, z: 6 },
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
    location: { x: 7, z: -4 },
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
    location: { x: -7, z: -6 },
    zoneName: 'Kaz Lagoon & Marine Sanctuary',
  } as any,
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
    location: { x: 0, z: 8 },
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
    location: { x: -4, z: -2 },
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
    location: { x: 6, z: 0 },
    zoneName: 'Breeze Wind & Solar Park',
  },
];


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
 * Computes updated resources upon task completion.
 */
export function completeTask(
  current: PlayerResources,
  task: TaskDefinition,
  efficiencyBonus = 1.0
): PlayerResources {
  const bonusMultiplier = Math.max(1.0, efficiencyBonus);
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

  // Apply reward metric
  switch (task.rewardMetric.type) {
    case 'carbonOffsetKg':
      next.carbonOffsetKg += Math.round(task.rewardMetric.amount * bonusMultiplier);
      break;
    case 'marineHealthPct':
      next.marineHealthPct = Math.min(100, current.marineHealthPct + Math.round(task.rewardMetric.amount * bonusMultiplier));
      break;
    case 'cityResiliencePct':
      next.cityResiliencePct = Math.min(100, current.cityResiliencePct + Math.round(task.rewardMetric.amount * bonusMultiplier));
      break;
    case 'foodSecurityBaskets':
      next.foodSecurityBaskets += Math.round(task.rewardMetric.amount * bonusMultiplier);
      break;
    case 'wasteRecycledKg':
      next.wasteRecycledKg += Math.round(task.rewardMetric.amount * bonusMultiplier);
      break;
    case 'cleanEnergyKwh':
      next.cleanEnergyKwh = Math.min(120, next.cleanEnergyKwh + Math.round(task.rewardMetric.amount * bonusMultiplier));
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
export function calculateDistance2D(p1: { x: number; z: number }, p2: { x: number; z: number }): number {
  const dx = p1.x - p2.x;
  const dz = p1.z - p2.z;
  return Math.sqrt(dx * dx + dz * dz);
}
