'use client';

import React from 'react';

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-linear-to-br from-background via-background to-muted">
      {/* Animated Curvy Lines - Hidden on mobile */}
      <svg
        className="absolute inset-0 w-full h-full hidden sm:block"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop
              offset="0%"
              stopColor="hsl(var(--primary))"
              stopOpacity="0.3"
            />
            <stop
              offset="100%"
              stopColor="hsl(var(--primary))"
              stopOpacity="0.1"
            />
          </linearGradient>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Lines */}
        <path
          d="M -200 100 Q 200 200, 600 150 T 1400 200 T 2200 100"
          stroke="url(#gradient1)"
          strokeWidth="3"
          fill="none"
          className="animate-[draw_20s_ease-in-out_infinite]"
        />
        <path
          d="M -100 250 Q 300 300, 700 280 T 1500 320 T 2300 250"
          stroke="url(#gradient2)"
          strokeWidth="2.5"
          fill="none"
          className="animate-[draw_25s_ease-in-out_infinite_reverse]"
        />
        <path
          d="M -150 400 Q 250 500, 650 420 T 1450 480 T 2250 400"
          stroke="url(#gradient3)"
          strokeWidth="2"
          fill="none"
          className="animate-[draw_30s_ease-in-out_infinite]"
        />
        <path
          d="M -100 550 Q 350 600, 750 570 T 1550 620 T 2350 550"
          stroke="url(#gradient1)"
          strokeWidth="2.5"
          fill="none"
          className="animate-[draw_22s_ease-in-out_infinite_reverse]"
        />
        <path
          d="M -200 700 Q 200 800, 600 720 T 1400 780 T 2200 700"
          stroke="url(#gradient2)"
          strokeWidth="3"
          fill="none"
          className="animate-[draw_28s_ease-in-out_infinite]"
        />
      </svg>

      {/* Floating Orbs */}
      <div className="absolute top-10 left-4 w-40 h-40 sm:top-20 sm:left-10 sm:w-64 sm:h-64 bg-primary/10 rounded-full blur-3xl animate-[float_15s_ease-in-out_infinite]" />
      <div className="absolute top-20 right-8 w-48 h-48 sm:top-40 sm:right-20 sm:w-80 sm:h-80 bg-purple-500/10 rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite_reverse]" />
      <div className="absolute bottom-10 left-1/4 w-44 h-44 sm:bottom-20 sm:left-1/3 sm:w-72 sm:h-72 bg-indigo-500/10 rounded-full blur-3xl animate-[float_18s_ease-in-out_infinite]" />

      {/* Gradient Mesh Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.15),transparent_50%),radial-gradient(circle_at_70%_80%,hsl(var(--primary)/0.1),transparent_50%)]" />
    </div>
  );
}

export default AnimatedBackground;