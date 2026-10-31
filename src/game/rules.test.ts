import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_RESOURCES,
  TASKS_CATALOG,
  NPC_GOOSE_POSITION,
  ELDER_GOOSE_CONVERSATIONS,
  applyEfficiencyConsultation,
  canStartTask,
  completeTask,
  calculateLevel,
  checkSustainabilityGoal,
  calculateDistance2D,
  INITIAL_SOIL_PLOTS,
  plantSoilPlot,
  harvestSoilPlot,
  advanceSoilGrowth,
} from './rules.ts';

test('Initial state provides adequate seed resources, efficiency defaults, and task catalog', () => {
  assert.equal(INITIAL_RESOURCES.ecoScore, 0);
  assert.equal(INITIAL_RESOURCES.level, 1);
  assert.equal(INITIAL_RESOURCES.efficiencyBonus, 1.0);
  assert.equal(INITIAL_RESOURCES.hasConsultedElder, false);
  assert.equal(INITIAL_RESOURCES.consultedTopics.length, 0);
  assert.equal(TASKS_CATALOG.length, 7, 'Must have exactly the 7 requested SDG task topics');

  const topics = TASKS_CATALOG.map((t) => t.topic);
  assert.ok(topics.includes('zero_waste'), 'Includes zero waste');
  assert.ok(topics.includes('climate_education'), 'Includes climate education');
  assert.ok(topics.includes('food_security'), 'Includes food security');
  assert.ok(topics.includes('marine_health'), 'Includes marine health');
  assert.ok(topics.includes('resilient_cities'), 'Includes resilient cities');
  assert.ok(topics.includes('conscious_consumption'), 'Includes conscious consumption');
  assert.ok(topics.includes('renewable_energy'), 'Includes renewable energy');
});

test('Map coordinates are scaled 5x across dedicated zones off the road network', () => {
  const zeroWaste = TASKS_CATALOG.find((t) => t.topic === 'zero_waste')!;
  const marine = TASKS_CATALOG.find((t) => t.topic === 'marine_health')!;
  const city = TASKS_CATALOG.find((t) => t.topic === 'resilient_cities')!;
  const wind = TASKS_CATALOG.find((t) => t.topic === 'renewable_energy')!;

  assert.deepEqual(zeroWaste.location, { x: -30, z: 20 });
  assert.deepEqual(marine.location, { x: -35, z: -30 });
  // Relocated off the road network:
  assert.deepEqual(city.location, { x: -28, z: 38 }, 'Resilient cities relocated off NS road');
  assert.deepEqual(wind.location, { x: 34, z: -36 }, 'Wind turbine relocated off EW road');

  // NPC Goose is stationed on the plaza garden corner terrace off the road
  assert.deepEqual(NPC_GOOSE_POSITION, { x: 7, z: -7 });
});

test('Soil beds allow goose to plant crops, grow over time, and harvest rewards', () => {
  assert.equal(INITIAL_SOIL_PLOTS.length, 6, 'Must provide 6 permaculture soil beds');

  const emptyPlot = INITIAL_SOIL_PLOTS.find((p: any) => p.state === 'empty')!;
  assert.ok(emptyPlot, 'Has at least one empty plot to plant');

  // 1. Plant seed
  const plantResult = plantSoilPlot(INITIAL_SOIL_PLOTS, emptyPlot.id, INITIAL_RESOURCES);
  assert.equal(plantResult.success, true);
  const updatedPlot = plantResult.plots.find((p: any) => p.id === emptyPlot.id)!;
  assert.equal(updatedPlot.state, 'growing');
  assert.ok(plantResult.resources.ecoScore > INITIAL_RESOURCES.ecoScore);

  // 2. Advance growth
  const grown = advanceSoilGrowth(plantResult.plots, 12);
  const maturedPlot = grown.find((p: any) => p.id === emptyPlot.id)!;
  assert.equal(maturedPlot.state, 'mature');
  assert.equal(maturedPlot.growthProgress, 100);

  // 3. Harvest
  const harvestResult = harvestSoilPlot(grown, emptyPlot.id, plantResult.resources);
  assert.equal(harvestResult.success, true);
  const harvestedPlot = harvestResult.plots.find((p: any) => p.id === emptyPlot.id)!;
  assert.equal(harvestedPlot.state, 'empty');
  assert.ok(harvestResult.resources.foodSecurityBaskets > plantResult.resources.foodSecurityBaskets);
});

test('Elder Goose conversation catalog contains actionable efficiency advice', () => {
  assert.ok(ELDER_GOOSE_CONVERSATIONS.length >= 7, 'Must have advice for SDG tasks');
  const goldenLoop = ELDER_GOOSE_CONVERSATIONS.find((c) => c.id === 'strategy_golden_order');
  assert.ok(goldenLoop, 'Has golden task loop advice');
  assert.ok(goldenLoop.efficiencyTip.length > 10);
  assert.ok(goldenLoop.elderDialogue.includes('Honk'));
});

test('applyEfficiencyConsultation awards bonus multiplier and inspiration points', () => {
  const initial = { ...INITIAL_RESOURCES };
  const consulted = applyEfficiencyConsultation(initial, 'strategy_golden_order');

  assert.equal(consulted.hasConsultedElder, true);
  assert.equal(consulted.efficiencyBonus, 1.25);
  assert.ok(consulted.consultedTopics.includes('strategy_golden_order'));
  assert.equal(consulted.ecoScore, 35); // Initial consultation inspiration

  // Second consultation adds another topic
  const consulted2 = applyEfficiencyConsultation(consulted, 'strategy_zero_waste_compost');
  assert.equal(consulted2.consultedTopics.length, 2);
  assert.equal(consulted2.ecoScore, 50); // +15 for new topic
});

test('canStartTask verifies energy requirements correctly', () => {
  const lowEnergyState = { ...INITIAL_RESOURCES, cleanEnergyKwh: 3 };
  const expensiveTask = TASKS_CATALOG.find((t) => t.costEnergy > 3)!;
  const cheapTask = TASKS_CATALOG.find((t) => t.costEnergy <= 3) || {
    ...TASKS_CATALOG[0],
    costEnergy: 2,
  };

  assert.equal(canStartTask(lowEnergyState, expensiveTask), false);
  assert.equal(canStartTask(lowEnergyState, cheapTask), true);
});

test('completeTask updates EcoScore, deducts cost, and applies metric rewards with efficiency multiplier', () => {
  const task = TASKS_CATALOG.find((t) => t.id === 'task_marine_plastic_cleanse')!;
  
  // Base completion (1.0x)
  const baseUpdated = completeTask(INITIAL_RESOURCES, task, 1.0);
  assert.equal(baseUpdated.ecoScore, INITIAL_RESOURCES.ecoScore + task.rewardEcoScore);
  assert.equal(baseUpdated.cleanEnergyKwh, INITIAL_RESOURCES.cleanEnergyKwh - task.costEnergy);
  assert.ok(baseUpdated.marineHealthPct > INITIAL_RESOURCES.marineHealthPct);
  assert.ok(baseUpdated.completedTaskIds.includes(task.id));

  // Boosted completion (1.25x efficiency from Elder Goose)
  const boostedResources = { ...INITIAL_RESOURCES, efficiencyBonus: 1.25 };
  const boostedUpdated = completeTask(boostedResources, task);
  const expectedBoostedEco = Math.round(task.rewardEcoScore * 1.25);
  assert.equal(boostedUpdated.ecoScore, expectedBoostedEco);
  assert.ok(boostedUpdated.ecoScore > baseUpdated.ecoScore);
});

test('calculateLevel scales with cumulative eco score', () => {
  assert.equal(calculateLevel(0), 1);
  assert.equal(calculateLevel(150), 2);
  assert.equal(calculateLevel(350), 3);
  assert.equal(calculateLevel(750), 5);
});

test('checkSustainabilityGoal evaluates victory state and progress percentage', () => {
  const initialCheck = checkSustainabilityGoal(INITIAL_RESOURCES);
  assert.equal(initialCheck.isVictory, false);
  assert.ok(initialCheck.missingGoals.length > 0);

  // Simulate full completion of all 7 tasks
  let state = { ...INITIAL_RESOURCES };
  for (const t of TASKS_CATALOG) {
    state = completeTask(state, t, 1.25);
  }
  // Boost marine & city metrics to simulate victory
  state.marineHealthPct = 95;
  state.cityResiliencePct = 90;
  state.ecoScore = 750;

  const victoryCheck = checkSustainabilityGoal(state);
  assert.equal(victoryCheck.isVictory, true);
  assert.equal(victoryCheck.progressPct, 100);
  assert.equal(victoryCheck.missingGoals.length, 0);
});

test('calculateDistance2D calculates planar Euclidean distance correctly', () => {
  const d = calculateDistance2D({ x: 0, z: 0 }, { x: 3, z: 4 });
  assert.equal(d, 5);
});
