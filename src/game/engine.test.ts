import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeLevel,
  countActiveHazards,
  createInitialWorld,
  extractHudSnapshot,
  getComboMultiplier,
  getLevelParams,
  spawnFallingEntity,
  startNewRun,
  stepWorld,
} from './engine';
import { BASKET_Y, WORLD_WIDTH, type InputState } from './types';

function idleInput(): InputState {
  return {
    leftHeld: false,
    rightHeld: false,
    dashJustPressed: false,
    pointerActive: false,
    pointerWorldX: WORLD_WIDTH * 0.5,
  };
}

test('game survives opening seconds with zero input and spawns no immediate hazards', () => {
  const world = createInitialWorld('normal', 0, true);
  assert.equal(world.phase, 'playing');
  assert.equal(world.hearts, 3);

  for (let i = 0; i < 90; i++) {
    stepWorld(world, 1 / 30, idleInput(), () => 0.5);
  }
  assert.equal(world.phase, 'playing');
  assert.equal(world.hearts, 3);
  assert.equal(countActiveHazards(world), 0);
});

test('catching fruits builds combo multiplier and increments score', () => {
  const world = createInitialWorld('normal', 0, true);
  assert.equal(getComboMultiplier(0), 1);
  assert.equal(getComboMultiplier(3), 2);
  assert.equal(getComboMultiplier(6), 3);
  assert.equal(getComboMultiplier(12), 4);
  assert.equal(getComboMultiplier(20), 5);

  // Drop 3 mangoes directly onto basket
  for (let i = 0; i < 3; i++) {
    const mango = spawnFallingEntity(world, 'mango', world.basket.x, () => 0.5);
    mango.y = BASKET_Y - 10;
    stepWorld(world, 0.016, idleInput(), () => 0.5);
  }

  assert.equal(world.caughtCount, 3);
  assert.equal(world.combo, 3);
  // 10 (x1) + 10 (x1) + 20 (x2 on 3rd combo) = 40
  assert.equal(world.score, 40);
  assert.equal(world.bestScore, 40);
});

test('golden starfruit awards bonus points and heals a missing heart', () => {
  const world = createInitialWorld('normal', 0, true);
  world.hearts = 2;

  const star = spawnFallingEntity(world, 'starfruit', world.basket.x, () => 0.5);
  star.y = BASKET_Y - 8;
  stepWorld(world, 0.016, idleInput(), () => 0.5);

  assert.equal(world.hearts, 3);
  assert.equal(world.score, 50);
  assert.ok(world.hitstopTimer > 0, 'golden catch applies brief hitstop');
});

test('hazard hit reduces hearts, triggers hitstop & invulnerability, and 0 hearts freezes gameover snapshot', () => {
  const world = createInitialWorld('normal', 100, true);
  world.score = 150;
  world.caughtCount = 9;
  world.hearts = 1;

  const coconut = spawnFallingEntity(world, 'coconut', world.basket.x, () => 0.5);
  coconut.telegraphTimer = 0;
  coconut.y = BASKET_Y - 6;

  stepWorld(world, 0.016, idleInput(), () => 0.5);

  assert.equal(world.hearts, 0);
  assert.ok(world.hitstopTimer > 0, 'hazard impact triggers sim hitstop');
  assert.ok(world.shakeTrauma > 0, 'hazard impact triggers camera shake');
  assert.equal(world.phase, 'playing', 'brief defeat beat runs before modal');

  // Advance past defeat beat (0.45s)
  for (let i = 0; i < 20; i++) {
    stepWorld(world, 0.04, idleInput(), () => 0.5);
  }

  assert.equal(world.phase, 'gameover');
  assert.ok(world.endSnapshot !== null);
  assert.equal(world.endSnapshot?.score, 150);
  assert.equal(world.endSnapshot?.bestScore, 150);
  assert.equal(world.endSnapshot?.isNewBest, true);
  assert.equal(world.endSnapshot?.caughtCount, 9);

  // Starting a new run cleanly resets state while preserving bestScore
  startNewRun(world, 'normal');
  const hud = extractHudSnapshot(world);
  assert.equal(hud.phase, 'playing');
  assert.equal(hud.score, 0);
  assert.equal(hud.hearts, 3);
  assert.equal(hud.bestScore, 150);
});

test('dash input triggers burst movement, cooldown, and input buffering', () => {
  const world = createInitialWorld('normal', 0, true);
  const startX = world.basket.x;

  stepWorld(
    world,
    0.04,
    {
      leftHeld: false,
      rightHeld: true,
      dashJustPressed: true,
      pointerActive: false,
      pointerWorldX: startX,
    },
    () => 0.5,
  );

  assert.ok(world.basket.x > startX + 40, 'dash accelerates basket horizontally');
  assert.ok(world.basket.dashCooldown > 0, 'dash enters cooldown');
});

test('difficulty ramp scales level, speed, cadence, and caps concurrent hazards', () => {
  assert.equal(computeLevel(0, 0), 1);
  assert.equal(computeLevel(42, 30), 3);

  const l1 = getLevelParams(1, 'normal', 6);
  const l5 = getLevelParams(5, 'normal', 90);
  assert.ok(l5.spawnInterval < l1.spawnInterval);
  assert.ok(l5.fallSpeedScale > l1.fallSpeedScale);
  assert.ok(l5.hazardChance > l1.hazardChance);
  assert.equal(l5.allowWasp, true);
  assert.equal(l5.allowSpiky, true);
  assert.ok(l5.maxConcurrentHazards <= 4);
});
