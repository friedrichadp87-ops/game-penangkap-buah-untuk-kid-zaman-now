import React from 'react';
import { DIFFICULTY_CONFIGS, type DifficultyId } from '../game/types';
import { TitleEmblemSvg } from './Icons';

interface TitleOverlayProps {
  difficulty: DifficultyId;
  bestScore: number;
  onSelectDifficulty: (diff: DifficultyId) => void;
  onStart: () => void;
}

const DIFFICULTIES: DifficultyId[] = ['santai', 'normal', 'cepat'];

export function TitleOverlay({
  difficulty,
  bestScore,
  onSelectDifficulty,
  onStart,
}: TitleOverlayProps) {
  return (
    <div className="fixed inset-0 z-20 flex flex-col items-center justify-between px-4 pt-8 pb-6 sm:pt-10 sm:pb-7 pointer-events-none">
      {/* Upper calm negative-space region: Emblem + Mode + Primary Start CTA */}
      <div className="flex flex-col items-center text-center max-w-lg w-full pointer-events-auto">
        <TitleEmblemSvg className="w-[310px] sm:w-[410px] h-auto drop-shadow-[0_10px_18px_rgba(36,23,14,0.28)]" />

        <p
          className="mt-2.5 text-sm sm:text-base font-bold text-[#24170E] tracking-tight"
          style={{ textShadow: '0 1px 8px rgba(255, 253, 245, 0.95), 0 0 2px rgba(255, 253, 245, 0.95)' }}
        >
          Tangkap buah matang, hindari kelapa, tawon &amp; duri.
        </p>

        {/* Segmented difficulty selector */}
        <div
          role="group"
          aria-label="Pilih tingkat kecepatan"
          className="mt-4 inline-flex items-center gap-1 p-1 rounded-xl bg-[#3A2618] border-2 border-[#24170E] shadow-[0_4px_0_#24170E]"
        >
          {DIFFICULTIES.map((id) => {
            const active = difficulty === id;
            return (
              <button
                key={id}
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onSelectDifficulty(id);
                }}
                aria-pressed={active}
                className={`px-4 py-2 min-h-[40px] rounded-lg text-sm font-bold whitespace-nowrap shrink-0 transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FDE047] cursor-pointer ${
                  active
                    ? 'bg-[#FBF6EA] text-[#24170E] shadow-sm'
                    : 'text-[#F5E6CA] hover:text-white'
                }`}
              >
                {DIFFICULTY_CONFIGS[id].label}
              </button>
            );
          })}
        </div>

        {/* Single prominent Start CTA */}
        <button
          type="button"
          data-start="true"
          onClick={(e) => {
            e.currentTarget.blur();
            onStart();
          }}
          className="mt-5 px-9 py-3.5 min-h-[52px] rounded-2xl bg-[#15803D] hover:bg-[#166534] active:translate-y-0.5 text-[#FFFDF5] font-extrabold text-lg tracking-wide border-[3px] border-[#24170E] shadow-[0_6px_0_#24170E] transition-transform duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FDE047] cursor-pointer"
        >
          Mulai Main
        </button>

        {bestScore > 0 && (
          <div
            className="mt-3 text-sm font-extrabold text-[#24170E] tabular-nums"
            style={{ textShadow: '0 1px 6px rgba(255, 253, 245, 0.95)' }}
          >
            Rekor Terbaik · {bestScore.toLocaleString('id-ID')}
          </div>
        )}
      </div>

      {/* Bottom safe-margin single flat borderless control-hint line */}
      <p
        className="text-xs sm:text-sm font-bold text-[#FFFDF5] text-center tracking-wide"
        style={{ textShadow: '0 1px 4px rgba(20, 14, 8, 0.95), 0 0 10px rgba(20, 14, 8, 0.7)' }}
      >
        A / D · Panah · Mouse Gerak &nbsp;·&nbsp; Spasi Cepat &nbsp;·&nbsp; Esc Jeda
      </p>
    </div>
  );
}
