import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_RESOURCES,
  TASKS_CATALOG,
  canStartTask,
  completeTask,
  calculateLevel,
  checkSustainabilityGoal,
  calculateDistance2D,
} from './rules.ts';

test('Initial state provides adequate seed resources and task definitions', () => {
  assert.equal(INITIAL_RESOURCES.ecoScore, 0);
  assert.equal(INITIAL_RESOURCES.level, 1);
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

test('completeTask updates EcoScore, deducts cost, and applies metric rewards', () => {
  const task = TASKS_CATALOG.find((t) => t.id === 'task_marine_plastic_cleanse')!;
  const updated = completeTask(INITIAL_RESOURCES, task, 1.0);

  assert.equal(updated.ecoScore, INITIAL_RESOURCES.ecoScore + task.rewardEcoScore);
  assert.equal(updated.cleanEnergyKwh, INITIAL_RESOURCES.cleanEnergyKwh - task.costEnergy);
  assert.ok(updated.marineHealthPct > INITIAL_RESOURCES.marineHealthPct);
  assert.ok(updated.completedTaskIds.includes(task.id));
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
    state = completeTask(state, t, 1.2);
  }
  // Boost marine & city metrics to simulate victory
  state.marineHealthPct = 95;
  state.cityResiliencePct = 90;
  state.ecoScore = 650;

  const victoryCheck = checkSustainabilityGoal(state);
  assert.equal(victoryCheck.isVictory, true);
  assert.equal(victoryCheck.progressPct, 100);
  assert.equal(victoryCheck.missingGoals.length, 0);
});

test('calculateDistance2D calculates planar Euclidean distance correctly', () => {
  const d = calculateDistance2D({ x: 0, z: 0 }, { x: 3, z: 4 });
  assert.equal(d, 5);
});
