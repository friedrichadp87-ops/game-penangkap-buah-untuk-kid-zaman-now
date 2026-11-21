import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { GameAudio } from '../game/audio';
import {
  createInitialWorld,
  extractHudSnapshot,
  startNewRun,
  stepWorld,
} from '../game/engine';
import {
  BACKDROP_IMAGE_URL,
  computeRenderTransform,
  renderWorld,
} from '../game/renderer';
import {
  WORLD_WIDTH,
  type DifficultyId,
  type HudSnapshot,
  type InputState,
  type WorldState,
} from '../game/types';

export interface GameControllerHandle {
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  restartGame: () => void;
  returnToTitle: () => void;
  setDifficulty: (diff: DifficultyId) => void;
  toggleMute: () => boolean;
  triggerDash: () => void;
}

interface GameCanvasProps {
  initialAutostart: boolean;
  initialBestScore: number;
  onHudChange: (snapshot: HudSnapshot) => void;
  onBestScoreChange: (best: number) => void;
  onMuteChange: (muted: boolean) => void;
}

function hudChanged(a: HudSnapshot | null, b: HudSnapshot): boolean {
  if (!a) return true;
  return (
    a.phase !== b.phase ||
    a.score !== b.score ||
    a.bestScore !== b.bestScore ||
    a.hearts !== b.hearts ||
    a.crackedHeartIndex !== b.crackedHeartIndex ||
    a.combo !== b.combo ||
    a.multiplier !== b.multiplier ||
    a.level !== b.level ||
    a.caughtCount !== b.caughtCount ||
    a.difficulty !== b.difficulty ||
    a.endSnapshot !== b.endSnapshot
  );
}

export const GameCanvas = forwardRef<GameControllerHandle, GameCanvasProps>(
  function GameCanvas(
    { initialAutostart, initialBestScore, onHudChange, onBestScoreChange, onMuteChange },
    ref,
  ) {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const onHudChangeRef = useRef(onHudChange);
    const onBestScoreChangeRef = useRef(onBestScoreChange);
    const onMuteChangeRef = useRef(onMuteChange);
    onHudChangeRef.current = onHudChange;
    onBestScoreChangeRef.current = onBestScoreChange;
    onMuteChangeRef.current = onMuteChange;

    const worldRef = useRef<WorldState>(
      createInitialWorld('normal', initialBestScore, initialAutostart),
    );
    const audioRef = useRef<GameAudio>(new GameAudio());
    const lastHudRef = useRef<HudSnapshot | null>(null);
    const lastSavedBestRef = useRef<number>(initialBestScore);

    const keysHeldRef = useRef<Set<string>>(new Set());
    const dashEdgeRef = useRef<boolean>(false);
    const pointerActiveRef = useRef<boolean>(false);
    const pointerWorldXRef = useRef<number>(WORLD_WIDTH * 0.5);

    const syncHud = () => {
      const world = worldRef.current;
      const snap = extractHudSnapshot(world);
      if (snap.bestScore > lastSavedBestRef.current) {
        lastSavedBestRef.current = snap.bestScore;
        onBestScoreChangeRef.current(snap.bestScore);
      }
      if (hudChanged(lastHudRef.current, snap)) {
        lastHudRef.current = snap;
        document.body.dataset.state = snap.phase;
        onHudChangeRef.current(snap);
      }
    };

    const clearInputs = () => {
      keysHeldRef.current.clear();
      dashEdgeRef.current = false;
    };

    const startOrRestart = () => {
      audioRef.current.unlock();
      clearInputs();
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      startNewRun(worldRef.current, worldRef.current.difficulty);
      syncHud();
    };

    useImperativeHandle(ref, () => ({
      startGame: () => startOrRestart(),
      pauseGame: () => {
        if (worldRef.current.phase === 'playing') {
          clearInputs();
          worldRef.current.phase = 'paused';
          syncHud();
        }
      },
      resumeGame: () => {
        if (worldRef.current.phase === 'paused') {
          audioRef.current.unlock();
          clearInputs();
          worldRef.current.phase = 'playing';
          syncHud();
        }
      },
      restartGame: () => startOrRestart(),
      returnToTitle: () => {
        clearInputs();
        worldRef.current.phase = 'title';
        worldRef.current.entities.length = 0;
        worldRef.current.endSnapshot = null;
        syncHud();
      },
      setDifficulty: (diff: DifficultyId) => {
        worldRef.current.difficulty = diff;
        syncHud();
      },
      toggleMute: () => {
        const next = audioRef.current.toggleMute();
        onMuteChangeRef.current(next);
        return next;
      },
      triggerDash: () => {
        audioRef.current.unlock();
        if (worldRef.current.phase === 'playing') {
          dashEdgeRef.current = true;
        }
      },
    }));

    useEffect(() => {
      const mount = mountRef.current;
      const canvas = canvasRef.current;
      if (!mount || !canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let cssWidth = mount.clientWidth || window.innerWidth;
      let cssHeight = mount.clientHeight || window.innerHeight;
      let dpr = Math.min(window.devicePixelRatio || 1, 2);

      const resizeCanvas = () => {
        cssWidth = Math.max(1, mount.clientWidth || window.innerWidth);
        cssHeight = Math.max(1, mount.clientHeight || window.innerHeight);
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(cssWidth * dpr);
        canvas.height = Math.round(cssHeight * dpr);
        canvas.style.width = `${cssWidth}px`;
        canvas.style.height = `${cssHeight}px`;
      };
      resizeCanvas();

      const observer = new ResizeObserver(() => resizeCanvas());
      observer.observe(mount);

      const screenToWorldX = (clientX: number): number => {
        const rect = canvas.getBoundingClientRect();
        const localX = clientX - rect.left;
        const tf = computeRenderTransform(rect.width || cssWidth, rect.height || cssHeight);
        const worldX = (localX - tf.offsetX) / tf.scale;
        return Math.max(0, Math.min(WORLD_WIDTH, worldX));
      };

      const onKeyDown = (e: KeyboardEvent) => {
        const code = e.code;
        const phase = worldRef.current.phase;

        if (code === 'ArrowLeft' || code === 'ArrowRight' || code === 'Space') {
          e.preventDefault();
        }

        if (code === 'KeyM' && !e.repeat) {
          const next = audioRef.current.toggleMute();
          onMuteChangeRef.current(next);
          return;
        }

        if (code === 'KeyR' && !e.repeat && (phase === 'playing' || phase === 'paused' || phase === 'gameover')) {
          startOrRestart();
          return;
        }

        if ((code === 'Escape' || code === 'KeyP') && !e.repeat) {
          if (phase === 'playing') {
            clearInputs();
            worldRef.current.phase = 'paused';
            syncHud();
          } else if (phase === 'paused') {
            audioRef.current.unlock();
            clearInputs();
            worldRef.current.phase = 'playing';
            syncHud();
          }
          return;
        }

        if ((code === 'Enter' || code === 'Space') && !e.repeat) {
          if (phase === 'title' || phase === 'gameover') {
            startOrRestart();
            return;
          }
        }

        if ((code === 'Space' || code === 'ShiftLeft' || code === 'ShiftRight') && !e.repeat) {
          if (phase === 'playing') {
            audioRef.current.unlock();
            dashEdgeRef.current = true;
          }
        }

        if (code === 'ArrowLeft' || code === 'KeyA' || code === 'ArrowRight' || code === 'KeyD') {
          pointerActiveRef.current = false;
          keysHeldRef.current.add(code);
        }
      };

      const onKeyUp = (e: KeyboardEvent) => {
        keysHeldRef.current.delete(e.code);
      };

      const onPointerMove = (e: PointerEvent) => {
        pointerActiveRef.current = true;
        pointerWorldXRef.current = screenToWorldX(e.clientX);
      };

      const onPointerDown = (e: PointerEvent) => {
        audioRef.current.unlock();
        pointerActiveRef.current = true;
        pointerWorldXRef.current = screenToWorldX(e.clientX);
      };

      const onBlur = () => {
        clearInputs();
      };

      const onVisibilityChange = () => {
        if (document.hidden) {
          clearInputs();
        }
      };

      window.addEventListener('keydown', onKeyDown, { passive: false });
      window.addEventListener('keyup', onKeyUp);
      window.addEventListener('blur', onBlur);
      document.addEventListener('visibilitychange', onVisibilityChange);
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerdown', onPointerDown);

      syncHud();

      let rafId = 0;
      let lastTime = performance.now();
      let pausedRendered = false;

      const loop = (now: number) => {
        const rawDt = (now - lastTime) / 1000;
        lastTime = now;

        const world = worldRef.current;

        if (world.phase === 'paused') {
          if (!pausedRendered) {
            pausedRendered = true;
            ctx.save();
            ctx.scale(dpr, dpr);
            renderWorld(ctx, world, cssWidth, cssHeight);
            ctx.restore();
          }
          rafId = requestAnimationFrame(loop);
          return;
        }
        pausedRendered = false;

        const keys = keysHeldRef.current;
        const input: InputState = {
          leftHeld: keys.has('ArrowLeft') || keys.has('KeyA'),
          rightHeld: keys.has('ArrowRight') || keys.has('KeyD'),
          dashJustPressed: dashEdgeRef.current,
          pointerActive: pointerActiveRef.current,
          pointerWorldX: pointerWorldXRef.current,
        };
        dashEdgeRef.current = false;

        stepWorld(world, rawDt, input);

        if (world.pendingAudio.length > 0) {
          audioRef.current.playEvents(world.pendingAudio);
          world.pendingAudio.length = 0;
        }

        syncHud();

        ctx.save();
        ctx.scale(dpr, dpr);
        renderWorld(ctx, world, cssWidth, cssHeight);
        ctx.restore();

        rafId = requestAnimationFrame(loop);
      };

      rafId = requestAnimationFrame(loop);

      return () => {
        cancelAnimationFrame(rafId);
        observer.disconnect();
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        window.removeEventListener('blur', onBlur);
        document.removeEventListener('visibilitychange', onVisibilityChange);
        canvas.removeEventListener('pointermove', onPointerMove);
        canvas.removeEventListener('pointerdown', onPointerDown);
      };
    }, []);

    return (
      <div
        ref={mountRef}
        className="fixed inset-0 z-0 overflow-hidden bg-gradient-to-b from-[#B9E2DE] via-[#EBF4DA] to-[#3B7A4A]"
      >
        <img
          src={BACKDROP_IMAGE_URL}
          alt="Pemandangan lembah kebun buah Nusantara"
          referrerPolicy="no-referrer"
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-[#142C1C]/35"
        />
        <canvas
          ref={canvasRef}
          data-testid="game-canvas"
          aria-label="Arena permainan Panen Buah"
          className="relative z-10 block w-full h-full cursor-pointer"
        />
      </div>
    );
  },
);
