export type GamePhase = 'title' | 'playing' | 'paused' | 'gameover';

export type DifficultyId = 'santai' | 'normal' | 'cepat';

export type EntityKind =
  | 'mango'
  | 'guava'
  | 'starfruit'
  | 'coconut'
  | 'wasp'
  | 'spiky';

export interface DifficultyConfig {
  id: DifficultyId;
  label: string;
  speedMultiplier: number;
  spawnIntervalMultiplier: number;
  maxConcurrentHazardsBase: number;
  startingHearts: number;
}

export const DIFFICULTY_CONFIGS: Record<DifficultyId, DifficultyConfig> = {
  santai: {
    id: 'santai',
    label: 'Santai',
    speedMultiplier: 0.84,
    spawnIntervalMultiplier: 1.18,
    maxConcurrentHazardsBase: 1,
    startingHearts: 3,
  },
  normal: {
    id: 'normal',
    label: 'Normal',
    speedMultiplier: 1.0,
    spawnIntervalMultiplier: 1.0,
    maxConcurrentHazardsBase: 2,
    startingHearts: 3,
  },
  cepat: {
    id: 'cepat',
    label: 'Cepat',
    speedMultiplier: 1.2,
    spawnIntervalMultiplier: 0.85,
    maxConcurrentHazardsBase: 2,
    startingHearts: 3,
  },
};

export interface BasketState {
  x: number; // Normalized world X in [0, WORLD_WIDTH]
  y: number; // Grounded Y in world units
  vx: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  tilt: number;
  dashTimer: number; // Remaining active dash duration
  dashCooldown: number; // Cooldown remaining before next dash
  dashBufferTimer: number; // Input buffer for slightly early dash press
  dashDir: number; // -1 or 1
  invulnTimer: number;
  hitFlashTimer: number;
  catchGlowTimer: number;
  stridePhase: number; // Distance-synced walk/bob phase
}

export interface FallingEntity {
  id: number;
  kind: EntityKind;
  isHazard: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseX: number;
  radius: number;
  rotation: number;
  rotSpeed: number;
  age: number;
  telegraphTimer: number; // > 0 means warning phase before full fall/charge
  telegraphDuration: number;
  swayAmp: number;
  swayFreq: number;
  phaseOffset: number;
  // KO / Dissolve animation after caught or missed
  state: 'active' | 'caught' | 'ko';
  stateTimer: number;
}

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  gravity: number;
  shape: 'circle' | 'leaf' | 'star' | 'ring';
  rotation: number;
  rotSpeed: number;
}

export interface FloatingText {
  active: boolean;
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  scale: number;
  life: number;
  maxLife: number;
}

export interface AmbientLeaf {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  swayPhase: number;
  color: string;
}

export interface InputState {
  leftHeld: boolean;
  rightHeld: boolean;
  dashJustPressed: boolean;
  pointerActive: boolean;
  pointerWorldX: number;
}

export type AudioEventType =
  | 'catch'
  | 'golden'
  | 'dash'
  | 'hurt'
  | 'telegraph'
  | 'levelup'
  | 'gameover';

export interface AudioEvent {
  type: AudioEventType;
  combo?: number;
}

export interface RunSnapshot {
  score: number;
  bestScore: number;
  isNewBest: boolean;
  caughtCount: number;
  maxCombo: number;
  level: number;
  durationSec: number;
  difficulty: DifficultyId;
}

export interface HudSnapshot {
  phase: GamePhase;
  score: number;
  bestScore: number;
  hearts: number;
  maxHearts: number;
  crackedHeartIndex: number; // Index flashing cracked on damage (-1 if none)
  combo: number;
  multiplier: number;
  level: number;
  caughtCount: number;
  difficulty: DifficultyId;
  endSnapshot: RunSnapshot | null;
}

export interface WorldState {
  phase: GamePhase;
  difficulty: DifficultyId;
  elapsed: number;
  titleTime: number;
  score: number;
  bestScore: number;
  hearts: number;
  maxHearts: number;
  lastDamagedHeartIndex: number;
  damageFlashTimer: number;
  combo: number;
  maxCombo: number;
  caughtCount: number;
  level: number;
  nextEntityId: number;
  spawnTimer: number;
  hazardCooldown: number;
  hitstopTimer: number;
  shakeTrauma: number;
  defeatDelayTimer: number; // 0.45s beat before showing Game Over modal
  basket: BasketState;
  entities: FallingEntity[];
  particles: Particle[];
  particleCursor: number;
  floatingTexts: FloatingText[];
  textCursor: number;
  ambientLeaves: AmbientLeaf[];
  endSnapshot: RunSnapshot | null;
  pendingAudio: AudioEvent[];
}

// Virtual logical arena dimensions (scaled smoothly to any aspect ratio)
export const WORLD_WIDTH = 1280;
export const WORLD_HEIGHT = 720;
export const BASKET_Y = 612;
export const GROUND_Y = 656;
export const PARTICLE_POOL_SIZE = 140;
export const TEXT_POOL_SIZE = 24;
