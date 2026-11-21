import React, { useCallback, useMemo, useRef, useState } from 'react';
import { GameCanvas, type GameControllerHandle } from './components/GameCanvas';
import { HudOverlay } from './components/HudOverlay';
import { StatusModal } from './components/StatusModal';
import { TitleOverlay } from './components/TitleOverlay';
import type { DifficultyId, HudSnapshot } from './game/types';

const BEST_SCORE_STORAGE_KEY = 'panen_buah_best_score_v1';

function readStoredBestScore(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(BEST_SCORE_STORAGE_KEY);
    const parsed = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function readAutostartParam(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('autostart') === '1';
  } catch {
    return false;
  }
}

export default function App() {
  const initialAutostart = useMemo(() => readAutostartParam(), []);
  const initialBestScore = useMemo(() => readStoredBestScore(), []);

  const controllerRef = useRef<GameControllerHandle | null>(null);
  const [muted, setMuted] = useState(false);
  const [hud, setHud] = useState<HudSnapshot>({
    phase: initialAutostart ? 'playing' : 'title',
    score: 0,
    bestScore: initialBestScore,
    hearts: 3,
    maxHearts: 3,
    crackedHeartIndex: -1,
    combo: 0,
    multiplier: 1,
    level: 1,
    caughtCount: 0,
    difficulty: 'normal',
    endSnapshot: null,
  });

  const handleBestScoreChange = useCallback((best: number) => {
    try {
      window.localStorage.setItem(BEST_SCORE_STORAGE_KEY, String(Math.round(best)));
    } catch {
      // Ignore storage errors in restricted iframes
    }
  }, []);

  const handleSelectDifficulty = useCallback((diff: DifficultyId) => {
    controllerRef.current?.setDifficulty(diff);
  }, []);

  const handleStart = useCallback(() => {
    controllerRef.current?.startGame();
  }, []);

  const handlePause = useCallback(() => {
    controllerRef.current?.pauseGame();
  }, []);

  const handleResume = useCallback(() => {
    controllerRef.current?.resumeGame();
  }, []);

  const handleRestart = useCallback(() => {
    controllerRef.current?.restartGame();
  }, []);

  const handleToTitle = useCallback(() => {
    controllerRef.current?.returnToTitle();
  }, []);

  const handleToggleMute = useCallback(() => {
    controllerRef.current?.toggleMute();
  }, []);

  const handleDash = useCallback(() => {
    controllerRef.current?.triggerDash();
  }, []);

  return (
    <main className="relative w-full h-full overflow-hidden">
      <GameCanvas
        ref={controllerRef}
        initialAutostart={initialAutostart}
        initialBestScore={initialBestScore}
        onHudChange={setHud}
        onBestScoreChange={handleBestScoreChange}
        onMuteChange={setMuted}
      />

      {hud.phase === 'title' && (
        <TitleOverlay
          difficulty={hud.difficulty}
          bestScore={hud.bestScore}
          onSelectDifficulty={handleSelectDifficulty}
          onStart={handleStart}
        />
      )}

      <HudOverlay
        hud={hud}
        muted={muted}
        onToggleMute={handleToggleMute}
        onPause={handlePause}
        onRestart={handleRestart}
        onDash={handleDash}
      />

      <StatusModal
        hud={hud}
        onResume={handleResume}
        onRestart={handleRestart}
        onToTitle={handleToTitle}
      />
    </main>
  );
}
