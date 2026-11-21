import React from 'react';

export function TitleEmblemSvg({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 460 148"
      className={className}
      role="img"
      aria-label="Panen Buah"
      fill="none"
    >
      {/* Hanging botanical leaves behind wooden plaque */}
      <g>
        <path
          d="M52 44 C18 22, 16 66, 56 76 C58 64, 58 52, 52 44 Z"
          fill="#2D6A4F"
          stroke="#24170E"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path
          d="M66 28 C44 2, 74 -2, 88 30 Z"
          fill="#52B788"
          stroke="#24170E"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path
          d="M408 44 C442 22, 444 66, 404 76 C402 64, 402 52, 408 44 Z"
          fill="#2D6A4F"
          stroke="#24170E"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path
          d="M394 28 C416 2, 386 -2, 372 30 Z"
          fill="#52B788"
          stroke="#24170E"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
      </g>

      {/* Crafted carved teak wood plaque shadow */}
      <rect
        x="48"
        y="30"
        width="364"
        height="100"
        rx="24"
        fill="#24170E"
      />
      {/* Main carved teak plaque */}
      <rect
        x="48"
        y="22"
        width="364"
        height="100"
        rx="24"
        fill="#5C3A21"
        stroke="#24170E"
        strokeWidth="4.5"
      />
      {/* Warm sunlit inner wood bevel */}
      <rect
        x="58"
        y="31"
        width="344"
        height="82"
        rx="16"
        fill="#7C4E2B"
        stroke="#A46B3B"
        strokeWidth="2.5"
      />
      {/* Corner brass rivets */}
      <circle cx="74" cy="47" r="4.5" fill="#FBBF24" stroke="#24170E" strokeWidth="2" />
      <circle cx="386" cy="47" r="4.5" fill="#FBBF24" stroke="#24170E" strokeWidth="2" />
      <circle cx="74" cy="97" r="4.5" fill="#FBBF24" stroke="#24170E" strokeWidth="2" />
      <circle cx="386" cy="97" r="4.5" fill="#FBBF24" stroke="#24170E" strokeWidth="2" />

      {/* Crest ripe mango sitting on top center of plaque */}
      <g transform="translate(230, 22)">
        <path
          d="M0 -18 C14 -17, 17 2, 8 13 C1 19, -10 15, -13 4 C-16 -7, -9 -18, 0 -18 Z"
          fill="#F59E0B"
          stroke="#24170E"
          strokeWidth="3.5"
        />
        <ellipse cx="-4.5" cy="-5" rx="3" ry="6" transform="rotate(-20 -4.5 -5)" fill="#FEF08A" />
        <path
          d="M3 -16 C12 -25, 22 -22, 18 -13 C13 -10, 6 -12, 3 -16 Z"
          fill="#4ADE80"
          stroke="#24170E"
          strokeWidth="2.8"
        />
      </g>

      {/* Bespoke serif display lettering */}
      <text
        x="230"
        y="86"
        textAnchor="middle"
        fontFamily="Fraunces, Georgia, serif"
        fontWeight="800"
        fontSize="48"
        letterSpacing="0.5"
        fill="#FFF8E7"
        stroke="#24170E"
        strokeWidth="8"
        paintOrder="stroke fill"
      >
        Panen Buah
      </text>
    </svg>
  );
}

export function HeartSocketIcon({
  state,
  className = 'w-7 h-7',
}: {
  state: 'full' | 'cracked' | 'empty';
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      {/* Dark outer silhouette */}
      <path
        d="M12 20.6 C11.6 20.3, 3.2 14.5, 3.2 8.7 C3.2 5.6, 5.6 3.5, 8.3 3.5 C10 3.5, 11.3 4.4, 12 5.7 C12.7 4.4, 14 3.5, 15.7 3.5 C18.4 3.5, 20.8 5.6, 20.8 8.7 C20.8 14.5, 12.4 20.3, 12 20.6 Z"
        fill={state === 'full' ? '#E11D48' : state === 'cracked' ? '#FB7185' : '#3A2618'}
        stroke="#24170E"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {state === 'full' && (
        <>
          {/* Interior bright highlight */}
          <path
            d="M6.4 8.5 C6.4 7, 7.4 6, 8.8 6"
            stroke="#FFE4E6"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      )}
      {state === 'cracked' && (
        <path
          d="M12.2 6.5 L10.2 10.6 L13.4 13.1 L11.4 17.8"
          stroke="#24170E"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {state === 'empty' && (
        <path
          d="M12 18.2 C10.4 17, 5.4 12.9, 5.4 8.8 C5.4 7.1, 6.6 5.7, 8.3 5.7 C9.7 5.7, 10.8 6.6, 12 8 C13.2 6.6, 14.3 5.7, 15.7 5.7 C17.4 5.7, 18.6 7.1, 18.6 8.8 C18.6 12.9, 13.6 17, 12 18.2 Z"
          fill="#26180F"
        />
      )}
    </svg>
  );
}

export function MangoScoreIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path
        d="M12 4.5 C17.5 4.8, 19.2 12.5, 15.2 17.8 C12.4 21.2, 7.6 19.6, 6.2 14.4 C4.8 9.2, 7.6 4.5, 12 4.5 Z"
        fill="#F59E0B"
        stroke="#24170E"
        strokeWidth="2"
      />
      <ellipse cx="9.6" cy="9.5" rx="1.6" ry="3.2" transform="rotate(-18 9.6 9.5)" fill="#FEF08A" />
      <path
        d="M13 5 C15.8 2, 19.5 2.5, 18.4 5.5 C16.6 6.8, 14.2 6.2, 13 5 Z"
        fill="#4ADE80"
        stroke="#24170E"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function SoundOnIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path
        d="M4 9.5 H8 L13.5 5 V19 L8 14.5 H4 Z"
        fill="#FFF8E7"
        stroke="#24170E"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M16.8 8.8 C18.2 10.2, 18.2 13.8, 16.8 15.2" stroke="#FFF8E7" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M19.5 6.4 C22 9, 22 15, 19.5 17.6" stroke="#FFF8E7" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function SoundOffIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path
        d="M4 9.5 H8 L13.5 5 V19 L8 14.5 H4 Z"
        fill="#CBD5E1"
        stroke="#24170E"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M16.5 9 L21.5 15 M21.5 9 L16.5 15" stroke="#FCA5A5" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function PauseIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <rect x="6" y="4.5" width="4.5" height="15" rx="1.5" fill="#FFF8E7" stroke="#24170E" strokeWidth="2" />
      <rect x="13.5" y="4.5" width="4.5" height="15" rx="1.5" fill="#FFF8E7" stroke="#24170E" strokeWidth="2" />
    </svg>
  );
}

export function RestartIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path
        d="M19.2 12 A7.2 7.2 0 1 1 16.5 6.4"
        stroke="#FFF8E7"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M16.8 3.2 L17.6 7.8 L13 7.6"
        stroke="#FFF8E7"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DashWindIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path d="M4 9 H16.5 C18.5 9, 19.5 7.6, 19.5 6.4 C19.5 5.2, 18.5 4.2, 17 4.2" stroke="#FFF8E7" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M3 13 H19 C20.6 13, 21.5 14.2, 21.5 15.4 C21.5 16.6, 20.5 17.6, 19 17.6" stroke="#FDE68A" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M7 17.2 H13.5" stroke="#FFF8E7" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
