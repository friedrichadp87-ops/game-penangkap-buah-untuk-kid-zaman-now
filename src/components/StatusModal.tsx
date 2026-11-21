import React from 'react';
import type { HudSnapshot } from '../game/types';

interface StatusModalProps {
  hud: HudSnapshot;
  onResume: () => void;
  onRestart: () => void;
  onToTitle: () => void;
}

export function StatusModal({ hud, onResume, onRestart, onToTitle }: StatusModalProps) {
  if (hud.phase !== 'paused' && hud.phase !== 'gameover') {
    return null;
  }

  const isPaused = hud.phase === 'paused';
  const snap = hud.endSnapshot;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="status-modal-title"
      className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#182B1E]/65"
    >
      <div className="w-full max-w-md rounded-3xl bg-[#FBF6EA] border-[4px] border-[#24170E] shadow-[0_10px_0_#24170E] p-6 sm:p-7 text-center">
        {isPaused ? (
          <>
            <h2
              id="status-modal-title"
              className="font-display text-3xl font-extrabold text-[#24170E]"
            >
              Permainan Dijeda
            </h2>
            <p className="mt-1.5 text-sm font-medium text-[#5C4433]">
              Skor sementara {hud.score} · Level {hud.level}
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onResume();
                }}
                className="w-full py-3.5 px-6 min-h-[48px] rounded-xl bg-[#15803D] hover:bg-[#166534] active:translate-y-0.5 text-[#FFFDF5] font-extrabold text-base border-[3px] border-[#24170E] shadow-[0_5px_0_#24170E] transition-transform duration-150 whitespace-nowrap cursor-pointer"
              >
                Lanjut Main
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onRestart();
                  }}
                  className="py-3 px-4 min-h-[46px] rounded-xl bg-[#F2E5CE] hover:bg-[#E8D5B5] active:translate-y-0.5 text-[#24170E] font-bold text-sm border-[2.5px] border-[#24170E] shadow-[0_4px_0_#24170E] transition-transform duration-150 whitespace-nowrap cursor-pointer"
                >
                  Ulangi
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onToTitle();
                  }}
                  className="py-3 px-4 min-h-[46px] rounded-xl bg-[#F2E5CE] hover:bg-[#E8D5B5] active:translate-y-0.5 text-[#24170E] font-bold text-sm border-[2.5px] border-[#24170E] shadow-[0_4px_0_#24170E] transition-transform duration-150 whitespace-nowrap cursor-pointer"
                >
                  Menu Utama
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2
              id="status-modal-title"
              className="font-display text-3xl font-extrabold text-[#24170E]"
            >
              Panen Selesai
            </h2>

            {snap?.isNewBest ? (
              <p className="mt-1.5 text-sm font-extrabold text-[#B45309]">
                Rekor Baru Tercapai!
              </p>
            ) : (
              <p className="mt-1.5 text-sm font-medium text-[#5C4433]">
                Keranjang penuh kenangan manis dari kebun.
              </p>
            )}

            {/* 3 focused tabular-nums metric tiles */}
            <div className="mt-5 grid grid-cols-3 gap-2.5">
              <div className="rounded-xl bg-[#F2E5CE] border-2 border-[#3A2618]/30 py-3 px-2">
                <div className="text-[11px] font-bold text-[#6B4E37]">SKOR</div>
                <div
                  data-testid="gameover-score"
                  className="mt-0.5 text-2xl font-extrabold text-[#24170E] tabular-nums"
                >
                  {snap?.score ?? hud.score}
                </div>
              </div>
              <div className="rounded-xl bg-[#F2E5CE] border-2 border-[#3A2618]/30 py-3 px-2">
                <div className="text-[11px] font-bold text-[#6B4E37]">REKOR</div>
                <div className="mt-0.5 text-2xl font-extrabold text-[#B45309] tabular-nums">
                  {snap?.bestScore ?? hud.bestScore}
                </div>
              </div>
              <div className="rounded-xl bg-[#F2E5CE] border-2 border-[#3A2618]/30 py-3 px-2">
                <div className="text-[11px] font-bold text-[#6B4E37]">BUAH</div>
                <div className="mt-0.5 text-2xl font-extrabold text-[#15803D] tabular-nums">
                  {snap?.caughtCount ?? hud.caughtCount}
                </div>
              </div>
            </div>

            <div className="mt-3 text-xs font-semibold text-[#5C4433] tabular-nums">
              Level {snap?.level ?? hud.level} · Kombo Tertinggi {snap?.maxCombo ?? 0}
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                data-start="true"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onRestart();
                }}
                className="w-full py-3.5 px-6 min-h-[50px] rounded-xl bg-[#15803D] hover:bg-[#166534] active:translate-y-0.5 text-[#FFFDF5] font-extrabold text-base border-[3px] border-[#24170E] shadow-[0_5px_0_#24170E] transition-transform duration-150 whitespace-nowrap cursor-pointer"
              >
                Main Lagi
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onToTitle();
                }}
                className="w-full py-3 px-5 min-h-[44px] rounded-xl bg-[#F2E5CE] hover:bg-[#E8D5B5] active:translate-y-0.5 text-[#24170E] font-bold text-sm border-[2.5px] border-[#24170E] shadow-[0_4px_0_#24170E] transition-transform duration-150 whitespace-nowrap cursor-pointer"
              >
                Menu Utama
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
