import React from 'react';
import type { HudSnapshot } from '../game/types';
import {
  DashWindIcon,
  HeartSocketIcon,
  MangoScoreIcon,
  PauseIcon,
  RestartIcon,
  SoundOffIcon,
  SoundOnIcon,
} from './Icons';

interface HudOverlayProps {
  hud: HudSnapshot;
  muted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onRestart: () => void;
  onDash: () => void;
}

export function HudOverlay({
  hud,
  muted,
  onToggleMute,
  onPause,
  onRestart,
  onDash,
}: HudOverlayProps) {
  if (hud.phase === 'title') {
    return null;
  }

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 sm:p-4">
      {/* Top perimeter row: Left Vitality + Score cluster | Right Level/Best + Utility controls */}
      <div className="flex items-start justify-between gap-2 w-full">
        {/* Top-left wood-framed Vitality & Score cluster */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 px-3.5 py-2 rounded-2xl bg-[#3A2618]/95 border-[2.5px] border-[#24170E] shadow-[0_4px_0_#24170E]">
          {/* 3-State Heart Vitality Sockets */}
          <div
            className="flex items-center gap-1"
            role="status"
            aria-label={`Nyawa: ${hud.hearts} dari ${hud.maxHearts}`}
          >
            {Array.from({ length: hud.maxHearts }).map((_, idx) => {
              let state: 'full' | 'cracked' | 'empty' = 'empty';
              if (idx < hud.hearts) state = 'full';
              else if (idx === hud.crackedHeartIndex) state = 'cracked';
              return <HeartSocketIcon key={idx} state={state} className="w-6 h-6 sm:w-7 sm:h-7" />;
            })}
          </div>

          <div className="w-[2px] h-7 bg-[#6B462B]" aria-hidden="true" />

          {/* Hero Score Readout */}
          <div className="flex items-center gap-2">
            <MangoScoreIcon className="w-6 h-6 shrink-0" />
            <div className="flex flex-col leading-none">
              <span className="text-[10px] font-bold tracking-wider text-[#E6CFAF]">SKOR</span>
              <span
                data-testid="hud-score"
                className="text-xl sm:text-2xl font-extrabold text-[#FFFDF5] tabular-nums"
              >
                {hud.score}
              </span>
            </div>
          </div>

          {/* Active Combo Multiplier (only when active >= x2) */}
          {hud.multiplier > 1 && (
            <>
              <div className="w-[2px] h-7 bg-[#6B462B]" aria-hidden="true" />
              <div className="flex flex-col leading-none">
                <span className="text-[10px] font-bold tracking-wider text-[#FDE68A]">KOMBO</span>
                <span className="text-lg sm:text-xl font-extrabold text-[#FACC15] tabular-nums">
                  x{hud.multiplier}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Top-right Level/Best + compact square utility controls */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-4 px-3.5 py-2 rounded-2xl bg-[#3A2618]/95 border-[2.5px] border-[#24170E] shadow-[0_4px_0_#24170E]">
            <div className="flex flex-col leading-none">
              <span className="text-[10px] font-bold tracking-wider text-[#E6CFAF]">LEVEL</span>
              <span className="text-lg font-extrabold text-[#FFFDF5] tabular-nums">{hud.level}</span>
            </div>
            <div className="w-[2px] h-6 bg-[#6B462B]" aria-hidden="true" />
            <div className="flex flex-col leading-none">
              <span className="text-[10px] font-bold tracking-wider text-[#E6CFAF]">REKOR</span>
              <span className="text-lg font-extrabold text-[#FDE68A] tabular-nums">{hud.bestScore}</span>
            </div>
          </div>

          {/* Interactive Utility Icon Buttons */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              tabIndex={-1}
              aria-label={muted ? 'Nyalakan suara (M)' : 'Bisukan suara (M)'}
              title={muted ? 'Nyalakan Suara [M]' : 'Bisukan Suara [M]'}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
              className="w-11 h-11 rounded-xl bg-[#5C3A21] hover:bg-[#6E472A] active:translate-y-0.5 border-[2.5px] border-[#24170E] shadow-[0_4px_0_#24170E] flex items-center justify-center transition-transform duration-150 cursor-pointer"
            >
              {muted ? <SoundOffIcon /> : <SoundOnIcon />}
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label="Jeda permainan (P)"
              title="Jeda [P]"
              onClick={(e) => {
                e.currentTarget.blur();
                onPause();
              }}
              className="w-11 h-11 rounded-xl bg-[#5C3A21] hover:bg-[#6E472A] active:translate-y-0.5 border-[2.5px] border-[#24170E] shadow-[0_4px_0_#24170E] flex items-center justify-center transition-transform duration-150 cursor-pointer"
            >
              <PauseIcon />
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label="Ulangi permainan (R)"
              title="Ulangi [R]"
              onClick={(e) => {
                e.currentTarget.blur();
                onRestart();
              }}
              className="w-11 h-11 rounded-xl bg-[#5C3A21] hover:bg-[#6E472A] active:translate-y-0.5 border-[2.5px] border-[#24170E] shadow-[0_4px_0_#24170E] flex items-center justify-center transition-transform duration-150 cursor-pointer"
            >
              <RestartIcon />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile / Touch bottom-right Dash affordance (hidden on desktop) */}
      {hud.phase === 'playing' && (
        <div className="flex items-end justify-between w-full sm:hidden">
          <div className="text-xs font-bold text-[#FFFDF5] hud-text-stroke-sm tabular-nums">
            Level {hud.level} · Rekor {hud.bestScore}
          </div>
          <button
            type="button"
            tabIndex={-1}
            aria-label="Gerak cepat"
            onClick={(e) => {
              e.currentTarget.blur();
              onDash();
            }}
            className="pointer-events-auto w-14 h-14 rounded-2xl bg-[#15803D] active:translate-y-0.5 border-[3px] border-[#24170E] shadow-[0_5px_0_#24170E] flex flex-col items-center justify-center text-[#FFFDF5] cursor-pointer"
          >
            <DashWindIcon className="w-6 h-6" />
            <span className="text-[10px] font-extrabold leading-none mt-0.5">CEPAT</span>
          </button>
        </div>
      )}
    </div>
  );
}
