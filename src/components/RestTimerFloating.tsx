import React, { useEffect } from 'react';
import { Bell, FastForward, Minus, Plus, X } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface RestTimerFloatingProps {
  remainingSeconds: number;
  totalSeconds: number;
  isActive: boolean;
  onAdjustSeconds: (delta: number) => void;
  onSkip: () => void;
  soundEnabled?: boolean;
}

export const RestTimerFloating: React.FC<RestTimerFloatingProps> = ({
  remainingSeconds,
  totalSeconds,
  isActive,
  onAdjustSeconds,
  onSkip,
  soundEnabled = true,
}) => {
  useEffect(() => {
    if (!isActive) return;

    if (remainingSeconds <= 3 && remainingSeconds > 0 && soundEnabled) {
      soundManager.playRestCountdownTick();
    } else if (remainingSeconds === 0 && soundEnabled) {
      soundManager.playRestCompleteChime();
    }
  }, [remainingSeconds, isActive, soundEnabled]);

  if (!isActive && remainingSeconds <= 0) return null;

  const percent = totalSeconds > 0 ? Math.max(0, Math.min(100, (remainingSeconds / totalSeconds) * 100)) : 0;
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-3 bg-zinc-900/95 backdrop-blur-md border border-emerald-500/40 rounded-2xl p-3 sm:p-3.5 shadow-2xl text-white">
        {/* Progress Ring / Visual Indicator */}
        <div className="relative flex h-12 w-12 items-center justify-center">
          <svg className="h-12 w-12 -rotate-90 transform" viewBox="0 0 36 36">
            <path
              className="text-zinc-800"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-emerald-400 transition-all duration-300"
              strokeDasharray={`${percent}, 100`}
              strokeWidth="3.5"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <span className="absolute font-mono-numbers text-xs font-black text-white">
            {formatted}
          </span>
        </div>

        {/* Labels & Controls */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Rest Timer
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
          </div>

          <div className="mt-1 flex items-center gap-1">
            <button
              onClick={() => onAdjustSeconds(-15)}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 active:scale-95 text-xs font-bold"
              title="-15 seconds"
            >
              -15
            </button>
            <button
              onClick={() => onAdjustSeconds(30)}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 active:scale-95 text-xs font-bold"
              title="+30 seconds"
            >
              +30
            </button>
            <button
              onClick={onSkip}
              className="flex h-7 px-2 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 active:scale-95 text-xs font-bold gap-1"
              title="Skip Rest"
            >
              <FastForward className="w-3 h-3" />
              <span>Ready</span>
            </button>
          </div>
        </div>

        <button
          onClick={onSkip}
          className="rounded-lg p-1 text-zinc-500 hover:text-zinc-300"
          title="Dismiss timer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
