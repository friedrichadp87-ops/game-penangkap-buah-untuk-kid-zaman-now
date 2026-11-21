import {
  BASKET_Y,
  DIFFICULTY_CONFIGS,
  GROUND_Y,
  PARTICLE_POOL_SIZE,
  TEXT_POOL_SIZE,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  type AmbientLeaf,
  type BasketState,
  type DifficultyId,
  type EntityKind,
  type FallingEntity,
  type FloatingText,
  type HudSnapshot,
  type InputState,
  type Particle,
  type RunSnapshot,
  type WorldState,
} from './types';

const BASKET_WIDTH = 132;
const BASKET_HEIGHT = 64;
const BASKET_SPEED = 740;
const DASH_SPEED = 1480;
const DASH_DURATION = 0.16;
const DASH_COOLDOWN = 0.95;
const DASH_BUFFER = 0.12;
const INVULN_DURATION = 1.25;
const DEFEAT_BEAT_DURATION = 0.45;
const OPENING_SAFE_SECONDS = 3.6;

export interface LevelParams {
  level: number;
  spawnInterval: number;
  fallSpeedScale: number;
  hazardChance: number;
  maxConcurrentHazards: number;
  allowWasp: boolean;
  allowSpiky: boolean;
}

export function getComboMultiplier(combo: number): number {
  if (combo >= 20) return 5;
  if (combo >= 12) return 4;
  if (combo >= 6) return 3;
  if (combo >= 3) return 2;
  return 1;
}

export function computeLevel(elapsed: number, caughtCount: number): number {
  const timeLevel = Math.floor(elapsed / 20) + 1;
  const catchLevel = Math.floor(caughtCount / 14) + 1;
  return Math.max(1, Math.min(12, Math.max(timeLevel, catchLevel)));
}

export function getLevelParams(
  level: number,
  difficulty: DifficultyId,
  elapsed: number,
): LevelParams {
  const cfg = DIFFICULTY_CONFIGS[difficulty];
  const l = Math.max(1, level);
  // Smooth multi-knob ramp: cadence, speed, hazard chance, and archetype mix
  const baseInterval = Math.max(0.42, 1.05 - (l - 1) * 0.068);
  const spawnInterval = Math.max(0.36, baseInterval * cfg.spawnIntervalMultiplier);
  const fallSpeedScale = (1 + (l - 1) * 0.095) * cfg.speedMultiplier;

  // Keep opening seconds friendly and fair
  const isSafeOpening = elapsed < OPENING_SAFE_SECONDS;
  const hazardChance = isSafeOpening
    ? 0
    : Math.min(0.42, 0.16 + (l - 1) * 0.032);

  // Hazard token pool: limit concurrent active hazards so playfield stays readable & dodgeable
  const maxConcurrentHazards = isSafeOpening
    ? 0
    : Math.min(4, cfg.maxConcurrentHazardsBase + Math.floor((l - 1) / 3));

  return {
    level: l,
    spawnInterval,
    fallSpeedScale,
    hazardChance,
    maxConcurrentHazards,
    allowWasp: l >= 2 || elapsed >= 12,
    allowSpiky: l >= 3 || elapsed >= 24,
  };
}

function createEmptyParticles(): Particle[] {
  const pool: Particle[] = new Array(PARTICLE_POOL_SIZE);
  for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
    pool[i] = {
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 4,
      color: '#ffffff',
      alpha: 1,
      life: 0,
      maxLife: 0.4,
      gravity: 400,
      shape: 'circle',
      rotation: 0,
      rotSpeed: 0,
    };
  }
  return pool;
}

function createEmptyFloatingTexts(): FloatingText[] {
  const pool: FloatingText[] = new Array(TEXT_POOL_SIZE);
  for (let i = 0; i < TEXT_POOL_SIZE; i++) {
    pool[i] = {
      active: false,
      x: 0,
      y: 0,
      vy: -60,
      text: '',
      color: '#ffffff',
      scale: 1,
      life: 0,
      maxLife: 0.75,
    };
  }
  return pool;
}

function createAmbientLeaves(): AmbientLeaf[] {
  const colors = ['#74C69D', '#95D5B2', '#52B788', '#D8F3DC', '#E9C46A'];
  const leaves: AmbientLeaf[] = [];
  for (let i = 0; i < 16; i++) {
    leaves.push({
      x: (i * 97) % WORLD_WIDTH,
      y: (i * 53) % (WORLD_HEIGHT - 120),
      vx: 18 + (i % 5) * 6,
      vy: 14 + (i % 4) * 5,
      size: 6 + (i % 4) * 2.5,
      rotation: (i * 0.7) % (Math.PI * 2),
      rotSpeed: 0.8 + (i % 3) * 0.45,
      swayPhase: i * 1.1,
      color: colors[i % colors.length],
    });
  }
  return leaves;
}

export function createInitialBasket(): BasketState {
  return {
    x: WORLD_WIDTH * 0.5,
    y: BASKET_Y,
    vx: 0,
    width: BASKET_WIDTH,
    height: BASKET_HEIGHT,
    scaleX: 1,
    scaleY: 1,
    tilt: 0,
    dashTimer: 0,
    dashCooldown: 0,
    dashBufferTimer: 0,
    dashDir: 1,
    invulnTimer: 0,
    hitFlashTimer: 0,
    catchGlowTimer: 0,
    stridePhase: 0,
  };
}

export function createInitialWorld(
  difficulty: DifficultyId = 'normal',
  bestScore = 0,
  autostart = false,
): WorldState {
  const cfg = DIFFICULTY_CONFIGS[difficulty];
  return {
    phase: autostart ? 'playing' : 'title',
    difficulty,
    elapsed: 0,
    titleTime: 0,
    score: 0,
    bestScore,
    hearts: cfg.startingHearts,
    maxHearts: cfg.startingHearts,
    lastDamagedHeartIndex: -1,
    damageFlashTimer: 0,
    combo: 0,
    maxCombo: 0,
    caughtCount: 0,
    level: 1,
    nextEntityId: 1,
    spawnTimer: 0.45,
    hazardCooldown: OPENING_SAFE_SECONDS,
    hitstopTimer: 0,
    shakeTrauma: 0,
    defeatDelayTimer: 0,
    basket: createInitialBasket(),
    entities: [],
    particles: createEmptyParticles(),
    particleCursor: 0,
    floatingTexts: createEmptyFloatingTexts(),
    textCursor: 0,
    ambientLeaves: createAmbientLeaves(),
    endSnapshot: null,
    pendingAudio: [],
  };
}

export function startNewRun(
  world: WorldState,
  difficulty: DifficultyId = world.difficulty,
): void {
  const cfg = DIFFICULTY_CONFIGS[difficulty];
  world.phase = 'playing';
  world.difficulty = difficulty;
  world.elapsed = 0;
  world.score = 0;
  world.hearts = cfg.startingHearts;
  world.maxHearts = cfg.startingHearts;
  world.lastDamagedHeartIndex = -1;
  world.damageFlashTimer = 0;
  world.combo = 0;
  world.maxCombo = 0;
  world.caughtCount = 0;
  world.level = 1;
  world.spawnTimer = 0.4;
  world.hazardCooldown = OPENING_SAFE_SECONDS;
  world.hitstopTimer = 0;
  world.shakeTrauma = 0;
  world.defeatDelayTimer = 0;
  world.endSnapshot = null;
  world.entities.length = 0;
  world.pendingAudio.length = 0;
  world.basket = createInitialBasket();

  for (let i = 0; i < world.particles.length; i++) {
    world.particles[i].active = false;
  }
  for (let i = 0; i < world.floatingTexts.length; i++) {
    world.floatingTexts[i].active = false;
  }
}

export function spawnParticle(
  world: WorldState,
  x: number,
  y: number,
  vx: number,
  vy: number,
  size: number,
  color: string,
  maxLife: number,
  gravity: number,
  shape: Particle['shape'] = 'circle',
): void {
  const p = world.particles[world.particleCursor];
  world.particleCursor = (world.particleCursor + 1) % world.particles.length;
  p.active = true;
  p.x = x;
  p.y = y;
  p.vx = vx;
  p.vy = vy;
  p.size = size;
  p.color = color;
  p.alpha = 1;
  p.life = 0;
  p.maxLife = maxLife;
  p.gravity = gravity;
  p.shape = shape;
  p.rotation = Math.random() * Math.PI * 2;
  p.rotSpeed = (Math.random() - 0.5) * 8;
}

export function spawnBurst(
  world: WorldState,
  x: number,
  y: number,
  count: number,
  colors: string[],
  speedMin: number,
  speedMax: number,
  shape: Particle['shape'] = 'circle',
  rng: () => number = Math.random,
): void {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (rng() - 0.5) * 0.45;
    const speed = speedMin + rng() * (speedMax - speedMin);
    const color = colors[i % colors.length];
    spawnParticle(
      world,
      x,
      y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed - 90,
      4 + rng() * 5,
      color,
      0.32 + rng() * 0.28,
      540,
      shape,
    );
  }
}

export function spawnFloatingText(
  world: WorldState,
  x: number,
  y: number,
  text: string,
  color: string,
  scale = 1,
): void {
  const ft = world.floatingTexts[world.textCursor];
  world.textCursor = (world.textCursor + 1) % world.floatingTexts.length;
  ft.active = true;
  ft.x = Math.max(90, Math.min(WORLD_WIDTH - 90, x));
  ft.y = y;
  ft.vy = -88;
  ft.text = text;
  ft.color = color;
  ft.scale = scale;
  ft.life = 0;
  ft.maxLife = 0.8;
}

export function countActiveHazards(world: WorldState): number {
  let count = 0;
  for (let i = 0; i < world.entities.length; i++) {
    const e = world.entities[i];
    if (e.isHazard && e.state === 'active') count++;
  }
  return count;
}

export function spawnFallingEntity(
  world: WorldState,
  kindOverride?: EntityKind,
  xOverride?: number,
  rng: () => number = Math.random,
): FallingEntity {
  const params = getLevelParams(world.level, world.difficulty, world.elapsed);
  const activeHazards = countActiveHazards(world);

  let kind: EntityKind;
  if (kindOverride) {
    kind = kindOverride;
  } else {
    const canSpawnHazard =
      world.hazardCooldown <= 0 &&
      activeHazards < params.maxConcurrentHazards &&
      rng() < params.hazardChance;

    if (canSpawnHazard) {
      const hazardRoll = rng();
      if (params.allowSpiky && hazardRoll > 0.68) {
        kind = 'spiky';
      } else if (params.allowWasp && hazardRoll > 0.34) {
        kind = 'wasp';
      } else {
        kind = 'coconut';
      }
      world.hazardCooldown = Math.max(0.95, 2.2 - world.level * 0.12);
    } else {
      const fruitRoll = rng();
      // Slightly higher golden starfruit chance if player is missing a heart
      const starChance = world.hearts < world.maxHearts ? 0.14 : 0.09;
      if (fruitRoll < starChance) {
        kind = 'starfruit';
      } else if (fruitRoll < 0.56) {
        kind = 'mango';
      } else {
        kind = 'guava';
      }
    }
  }

  const margin = 104;
  let spawnX =
    xOverride !== undefined
      ? xOverride
      : margin + rng() * (WORLD_WIDTH - margin * 2);

  // Keep hazards from spawning right on top of each other
  if (kind === 'coconut' || kind === 'wasp' || kind === 'spiky') {
    for (let attempt = 0; attempt < 3; attempt++) {
      const tooClose = world.entities.some(
        (e) => e.state === 'active' && e.isHazard && Math.abs(e.x - spawnX) < 150,
      );
      if (!tooClose || xOverride !== undefined) break;
      spawnX = margin + rng() * (WORLD_WIDTH - margin * 2);
    }
  }

  const speed = params.fallSpeedScale;
  const id = world.nextEntityId++;

  if (kind === 'coconut') {
    // Heavy Coconut: visible 0.58s shake + vertical reticle telegraph, then fast drop
    world.pendingAudio.push({ type: 'telegraph' });
    const entity: FallingEntity = {
      id,
      kind,
      isHazard: true,
      x: spawnX,
      y: 66,
      vx: 0,
      vy: 470 * speed,
      baseX: spawnX,
      radius: 28,
      rotation: 0,
      rotSpeed: (rng() - 0.5) * 3.5,
      age: 0,
      telegraphTimer: 0.58,
      telegraphDuration: 0.58,
      swayAmp: 0,
      swayFreq: 0,
      phaseOffset: rng() * Math.PI * 2,
      state: 'active',
      stateTimer: 0,
    };
    world.entities.push(entity);
    return entity;
  }

  if (kind === 'wasp') {
    // Angry Wasp: 0.45s buzz warning telegraph, then weaves laterally as it descends
    world.pendingAudio.push({ type: 'telegraph' });
    const clampedX = Math.max(190, Math.min(WORLD_WIDTH - 190, spawnX));
    const entity: FallingEntity = {
      id,
      kind,
      isHazard: true,
      x: clampedX,
      y: 78,
      vx: 0,
      vy: 235 * speed,
      baseX: clampedX,
      radius: 25,
      rotation: 0,
      rotSpeed: 0,
      age: 0,
      telegraphTimer: 0.45,
      telegraphDuration: 0.45,
      swayAmp: 120 + rng() * 45,
      swayFreq: 3.1 + rng() * 0.8,
      phaseOffset: rng() * Math.PI * 2,
      state: 'active',
      stateTimer: 0,
    };
    world.entities.push(entity);
    return entity;
  }

  if (kind === 'spiky') {
    // Spiky Pod: 0.52s dashed diagonal trajectory telegraph, then tumbles diagonally
    world.pendingAudio.push({ type: 'telegraph' });
    const dir = spawnX < WORLD_WIDTH * 0.5 ? 1 : -1;
    const entity: FallingEntity = {
      id,
      kind,
      isHazard: true,
      x: spawnX,
      y: 72,
      vx: dir * (155 + rng() * 65) * speed,
      vy: 315 * speed,
      baseX: spawnX,
      radius: 27,
      rotation: 0,
      rotSpeed: dir * 6.5,
      age: 0,
      telegraphTimer: 0.52,
      telegraphDuration: 0.52,
      swayAmp: 0,
      swayFreq: 0,
      phaseOffset: 0,
      state: 'active',
      stateTimer: 0,
    };
    world.entities.push(entity);
    return entity;
  }

  if (kind === 'starfruit') {
    const entity: FallingEntity = {
      id,
      kind,
      isHazard: false,
      x: spawnX,
      y: -26,
      vx: 0,
      vy: 230 * speed,
      baseX: spawnX,
      radius: 28,
      rotation: 0,
      rotSpeed: 2.2,
      age: 0,
      telegraphTimer: 0,
      telegraphDuration: 0,
      swayAmp: 58,
      swayFreq: 2.4,
      phaseOffset: rng() * Math.PI * 2,
      state: 'active',
      stateTimer: 0,
    };
    world.entities.push(entity);
    return entity;
  }

  // Standard ripe fruits: mango & guava
  const isMango = kind === 'mango';
  const entity: FallingEntity = {
    id,
    kind,
    isHazard: false,
    x: spawnX,
    y: -28,
    vx: 0,
    vy: (isMango ? 240 : 272) * speed,
    baseX: spawnX,
    radius: isMango ? 27 : 24,
    rotation: (rng() - 0.5) * 0.4,
    rotSpeed: (rng() - 0.5) * 1.8,
    age: 0,
    telegraphTimer: 0,
    telegraphDuration: 0,
    swayAmp: isMango ? 18 : 26,
    swayFreq: 1.8,
    phaseOffset: rng() * Math.PI * 2,
    state: 'active',
    stateTimer: 0,
  };
  world.entities.push(entity);
  return entity;
}

export function freezeRunSnapshot(world: WorldState): RunSnapshot {
  const isNewBest = world.score > world.bestScore;
  if (isNewBest) {
    world.bestScore = world.score;
  }
  return {
    score: Math.round(world.score),
    bestScore: Math.round(world.bestScore),
    isNewBest,
    caughtCount: world.caughtCount,
    maxCombo: world.maxCombo,
    level: world.level,
    durationSec: Math.round(world.elapsed),
    difficulty: world.difficulty,
  };
}

function updateAmbientLeaves(world: WorldState, dt: number): void {
  for (let i = 0; i < world.ambientLeaves.length; i++) {
    const leaf = world.ambientLeaves[i];
    leaf.swayPhase += dt * 1.9;
    leaf.x += (leaf.vx + Math.sin(leaf.swayPhase) * 22) * dt;
    leaf.y += leaf.vy * dt;
    leaf.rotation += leaf.rotSpeed * dt;

    if (leaf.x > WORLD_WIDTH + 30) leaf.x = -24;
    if (leaf.y > GROUND_Y) {
      leaf.y = -20;
      leaf.x = (leaf.x + 210) % WORLD_WIDTH;
    }
  }
}

function updateParticlesAndTexts(world: WorldState, dt: number): void {
  for (let i = 0; i < world.particles.length; i++) {
    const p = world.particles[i];
    if (!p.active) continue;
    p.life += dt;
    if (p.life >= p.maxLife) {
      p.active = false;
      continue;
    }
    p.vy += p.gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rotation += p.rotSpeed * dt;
    p.alpha = 1 - p.life / p.maxLife;
  }

  for (let i = 0; i < world.floatingTexts.length; i++) {
    const ft = world.floatingTexts[i];
    if (!ft.active) continue;
    ft.life += dt;
    if (ft.life >= ft.maxLife) {
      ft.active = false;
      continue;
    }
    ft.y += ft.vy * dt;
    ft.vy *= Math.pow(0.18, dt);
  }
}

export function checkBasketCollision(basket: BasketState, entity: FallingEntity): boolean {
  const halfW = basket.width * 0.46;
  const halfH = basket.height * 0.44;
  // Slightly generous catch box for fruits, fair tighter hitbox for hazards
  const padding = entity.isHazard ? -4 : 10;
  const dx = Math.abs(entity.x - basket.x);
  const dy = Math.abs(entity.y - (basket.y - 6));
  return dx <= halfW + entity.radius + padding && dy <= halfH + entity.radius + padding;
}

export function stepWorld(
  world: WorldState,
  rawDt: number,
  input: InputState,
  rng: () => number = Math.random,
): void {
  const dt = Math.min(Math.max(rawDt, 0), 0.05);
  if (dt <= 0) return;

  // Ambient wind leaves animate on title and active play
  if (world.phase === 'title') {
    world.titleTime += dt;
    updateAmbientLeaves(world, dt);

    // Gentle pre-start interactive centerpiece sway on title screen
    const targetX = input.pointerActive
      ? Math.max(160, Math.min(WORLD_WIDTH - 160, input.pointerWorldX))
      : WORLD_WIDTH * 0.5 + Math.sin(world.titleTime * 0.85) * 140;
    const prevX = world.basket.x;
    world.basket.x += (targetX - world.basket.x) * Math.min(1, dt * 4.5);
    const dx = world.basket.x - prevX;
    world.basket.tilt = Math.max(-0.14, Math.min(0.14, dx * 0.015));
    world.basket.stridePhase += Math.abs(dx) * 0.04;
    return;
  }

  if (world.phase !== 'playing') {
    return;
  }

  // Real-time timers (shake, hit flash, damage ring) tick even during hitstop
  world.shakeTrauma = Math.max(0, world.shakeTrauma - dt * 2.1);
  if (world.damageFlashTimer > 0) {
    world.damageFlashTimer = Math.max(0, world.damageFlashTimer - dt);
    if (world.damageFlashTimer === 0) {
      world.lastDamagedHeartIndex = -1;
    }
  }
  if (world.basket.hitFlashTimer > 0) {
    world.basket.hitFlashTimer = Math.max(0, world.basket.hitFlashTimer - dt);
  }
  if (world.basket.catchGlowTimer > 0) {
    world.basket.catchGlowTimer = Math.max(0, world.basket.catchGlowTimer - dt);
  }

  // Handle brief defeat beat before opening Game Over modal
  if (world.defeatDelayTimer > 0) {
    updateParticlesAndTexts(world, dt);
    updateAmbientLeaves(world, dt);
    world.defeatDelayTimer = Math.max(0, world.defeatDelayTimer - dt);
    if (world.defeatDelayTimer === 0) {
      world.endSnapshot = freezeRunSnapshot(world);
      world.phase = 'gameover';
      world.pendingAudio.push({ type: 'gameover' });
    }
    return;
  }

  // Sim-level hitstop: freeze simulation physics briefly on heavy impacts while particles/shake tick
  if (world.hitstopTimer > 0) {
    world.hitstopTimer = Math.max(0, world.hitstopTimer - dt);
    updateParticlesAndTexts(world, dt * 0.35);
    return;
  }

  world.elapsed += dt;
  updateAmbientLeaves(world, dt);
  updateParticlesAndTexts(world, dt);

  // Basket timers & squash-and-stretch exponential recovery
  const b = world.basket;
  b.invulnTimer = Math.max(0, b.invulnTimer - dt);
  b.dashCooldown = Math.max(0, b.dashCooldown - dt);
  b.dashBufferTimer = Math.max(0, b.dashBufferTimer - dt);

  const spring = Math.min(1, dt * 14);
  b.scaleX += (1 - b.scaleX) * spring;
  b.scaleY += (1 - b.scaleY) * spring;

  if (input.dashJustPressed) {
    b.dashBufferTimer = DASH_BUFFER;
  }

  // Determine desired movement direction
  let moveDir = 0;
  if (input.leftHeld && !input.rightHeld) moveDir = -1;
  else if (input.rightHeld && !input.leftHeld) moveDir = 1;

  // Trigger buffered Dash on first legal frame
  if (b.dashBufferTimer > 0 && b.dashCooldown <= 0 && b.dashTimer <= 0) {
    let dir = moveDir;
    if (dir === 0 && input.pointerActive) {
      const diff = input.pointerWorldX - b.x;
      if (Math.abs(diff) > 12) dir = Math.sign(diff);
    }
    if (dir === 0) dir = b.dashDir || 1;

    b.dashDir = dir;
    b.dashTimer = DASH_DURATION;
    b.dashCooldown = DASH_COOLDOWN;
    b.dashBufferTimer = 0;
    b.scaleX = 1.28;
    b.scaleY = 0.8;
    world.pendingAudio.push({ type: 'dash' });
    spawnBurst(world, b.x - dir * 32, b.y + 8, 6, ['#D8F3DC', '#95D5B2', '#FFF8E7'], 70, 210, 'leaf', rng);
  }

  const prevBasketX = b.x;
  const minX = b.width * 0.5 + 24;
  const maxX = WORLD_WIDTH - b.width * 0.5 - 24;

  if (b.dashTimer > 0) {
    b.dashTimer = Math.max(0, b.dashTimer - dt);
    b.vx = b.dashDir * DASH_SPEED;
    b.x += b.vx * dt;
  } else if (moveDir !== 0) {
    const targetVx = moveDir * BASKET_SPEED;
    b.vx += (targetVx - b.vx) * Math.min(1, dt * 18);
    b.x += b.vx * dt;
    b.dashDir = moveDir;
  } else if (input.pointerActive) {
    const targetX = Math.max(minX, Math.min(maxX, input.pointerWorldX));
    const diff = targetX - b.x;
    const maxStep = BASKET_SPEED * 1.45 * dt;
    const step = Math.abs(diff) > maxStep ? Math.sign(diff) * maxStep : diff * Math.min(1, dt * 22);
    b.x += step;
    b.vx = step / dt;
    if (Math.abs(diff) > 8) b.dashDir = Math.sign(diff);
  } else {
    b.vx *= Math.pow(0.001, dt);
    if (Math.abs(b.vx) < 4) b.vx = 0;
    b.x += b.vx * dt;
  }

  b.x = Math.max(minX, Math.min(maxX, b.x));
  const movedDist = Math.abs(b.x - prevBasketX);
  b.stridePhase += movedDist * 0.045;
  const targetTilt = Math.max(-0.18, Math.min(0.18, b.vx / 4800));
  b.tilt += (targetTilt - b.tilt) * Math.min(1, dt * 14);

  // Level progression check
  const nextLevel = computeLevel(world.elapsed, world.caughtCount);
  if (nextLevel > world.level) {
    world.level = nextLevel;
    world.pendingAudio.push({ type: 'levelup' });
    spawnFloatingText(world, WORLD_WIDTH * 0.5, 220, `LEVEL ${world.level}!`, '#F59E0B', 1.35);
    spawnBurst(world, b.x, b.y - 24, 14, ['#FBBF24', '#34D399', '#FFF8E7'], 120, 320, 'star', rng);
  }

  // Spawner
  const params = getLevelParams(world.level, world.difficulty, world.elapsed);
  world.hazardCooldown = Math.max(0, world.hazardCooldown - dt);
  world.spawnTimer -= dt;
  if (world.spawnTimer <= 0) {
    spawnFallingEntity(world, undefined, undefined, rng);
    world.spawnTimer = params.spawnInterval * (0.85 + rng() * 0.3);
  }

  // Update entities
  for (let i = world.entities.length - 1; i >= 0; i--) {
    const e = world.entities[i];
    e.age += dt;

    if (e.state !== 'active') {
      e.stateTimer += dt;
      if (e.state === 'ko') {
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        e.vy += 820 * dt;
        e.rotation += e.rotSpeed * dt;
      } else if (e.state === 'caught') {
        e.y -= 75 * dt;
      }
      if (e.stateTimer >= 0.32) {
        world.entities.splice(i, 1);
      }
      continue;
    }

    // Windup telegraph phase for hazards
    if (e.telegraphTimer > 0) {
      e.telegraphTimer = Math.max(0, e.telegraphTimer - dt);
      continue;
    }

    // Active movement per archetype
    if (e.kind === 'wasp') {
      e.y += e.vy * dt;
      e.x = e.baseX + Math.sin(e.age * e.swayFreq + e.phaseOffset) * e.swayAmp;
      e.x = Math.max(60, Math.min(WORLD_WIDTH - 60, e.x));
    } else if (e.kind === 'spiky') {
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.rotation += e.rotSpeed * dt;
      if (e.x < 56 || e.x > WORLD_WIDTH - 56) {
        e.vx = -e.vx;
        e.x = Math.max(56, Math.min(WORLD_WIDTH - 56, e.x));
      }
    } else if (e.kind === 'coconut') {
      e.vy += 260 * dt; // Gravity acceleration on heavy plummet
      e.y += e.vy * dt;
      e.rotation += e.rotSpeed * dt;
    } else {
      // Fruits gently sway in the tropical breeze
      e.y += e.vy * dt;
      e.x = e.baseX + Math.sin(e.age * e.swayFreq + e.phaseOffset) * e.swayAmp;
      e.x = Math.max(64, Math.min(WORLD_WIDTH - 64, e.x));
      e.rotation += e.rotSpeed * dt;
    }

    // Basket collision
    if (checkBasketCollision(b, e)) {
      if (e.isHazard) {
        if (b.invulnTimer <= 0) {
          // Player takes damage!
          world.hearts = Math.max(0, world.hearts - 1);
          world.lastDamagedHeartIndex = world.hearts;
          world.damageFlashTimer = 0.65;
          world.combo = 0;
          b.invulnTimer = INVULN_DURATION;
          b.hitFlashTimer = 0.14;
          b.scaleX = 1.24;
          b.scaleY = 0.72;
          world.hitstopTimer = 0.055;
          world.shakeTrauma = 0.72;
          world.pendingAudio.push({ type: 'hurt' });

          // KO knockback arc on the hazard instead of instant vanish
          e.state = 'ko';
          e.stateTimer = 0;
          e.vx = (e.x < b.x ? -1 : 1) * 260;
          e.vy = -290;
          e.rotSpeed = 10;

          spawnBurst(world, e.x, e.y, 18, ['#EF4444', '#F97316', '#3A2618', '#FEF3C7'], 110, 340, 'circle', rng);
          spawnFloatingText(world, b.x, b.y - 54, '-1 NYAWA', '#DC2626', 1.15);

          if (world.hearts <= 0) {
            world.defeatDelayTimer = DEFEAT_BEAT_DURATION;
          }
        } else {
          // Deflect harmlessly during i-frames
          e.state = 'ko';
          e.stateTimer = 0;
          e.vx = (e.x < b.x ? -1 : 1) * 220;
          e.vy = -240;
        }
      } else {
        // Caught a ripe fruit!
        world.caughtCount += 1;
        world.combo += 1;
        if (world.combo > world.maxCombo) world.maxCombo = world.combo;
        const mult = getComboMultiplier(world.combo);

        const isStar = e.kind === 'starfruit';
        const basePoints = isStar ? 50 : e.kind === 'guava' ? 15 : 10;
        const gained = basePoints * mult;
        world.score += gained;
        if (world.score > world.bestScore) {
          world.bestScore = world.score;
        }

        b.scaleX = 1.22;
        b.scaleY = 0.78;
        b.catchGlowTimer = isStar ? 0.35 : 0.14;

        e.state = 'caught';
        e.stateTimer = 0;

        if (isStar) {
          world.hitstopTimer = 0.035;
          world.shakeTrauma = Math.max(world.shakeTrauma, 0.25);
          world.pendingAudio.push({ type: 'golden', combo: world.combo });
          spawnBurst(world, e.x, e.y, 18, ['#FACC15', '#FEF08A', '#F59E0B', '#FFFFFF'], 90, 290, 'star', rng);

          if (world.hearts < world.maxHearts) {
            world.hearts += 1;
            spawnFloatingText(world, e.x, e.y - 42, `+${gained} · +1 NYAWA`, '#D97706', 1.2);
          } else {
            spawnFloatingText(world, e.x, e.y - 42, `+${gained} EMAS!`, '#D97706', 1.2);
          }
        } else {
          world.pendingAudio.push({ type: 'catch', combo: world.combo });
          const burstColors =
            e.kind === 'mango'
              ? ['#F59E0B', '#FBBF24', '#65A30D', '#FEF3C7']
              : ['#E11D48', '#FB7185', '#FDA4AF', '#65A30D'];
          spawnBurst(world, e.x, e.y, 8, burstColors, 70, 200, 'circle', rng);
          const label = mult > 1 ? `+${gained} (x${mult})` : `+${gained}`;
          spawnFloatingText(world, e.x, e.y - 34, label, '#15803D', mult > 2 ? 1.12 : 1.0);
        }
      }
      continue;
    }

    // Missed entity hits ground
    if (e.y > GROUND_Y + 14) {
      if (!e.isHazard) {
        // Missing a normal fruit gently resets combo (no frustrating instant death!)
        if (world.combo > 0) {
          world.combo = 0;
        }
        spawnBurst(world, e.x, GROUND_Y, 5, ['#95D5B2', '#D97706'], 40, 120, 'leaf', rng);
      } else {
        // Hazard splats into ground harmlessly
        spawnBurst(world, e.x, GROUND_Y, 6, ['#78716C', '#A8A29E'], 50, 140, 'circle', rng);
      }
      world.entities.splice(i, 1);
    }
  }
}

export function extractHudSnapshot(world: WorldState): HudSnapshot {
  return {
    phase: world.phase,
    score: Math.round(world.score),
    bestScore: Math.round(world.bestScore),
    hearts: world.hearts,
    maxHearts: world.maxHearts,
    crackedHeartIndex: world.damageFlashTimer > 0 ? world.lastDamagedHeartIndex : -1,
    combo: world.combo,
    multiplier: getComboMultiplier(world.combo),
    level: world.level,
    caughtCount: world.caughtCount,
    difficulty: world.difficulty,
    endSnapshot: world.endSnapshot,
  };
}
