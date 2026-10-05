import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  Check,
  Dumbbell,
  Eye,
  EyeOff,
  Flame,
  Moon,
  Palette,
  Play,
  Settings2,
  Shield,
  Sun,
  Wifi,
  WifiOff,
  X,
  Zap,
} from 'lucide-react';
import { ThemeOption, UserSettings, WorkoutLog } from '../types/workout';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  settings: UserSettings;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;
  isOnline: boolean;
  activeWorkout: WorkoutLog | null;
  onOpenActiveWorkout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onUpdateSettings,
  isOnline,
  activeWorkout,
  onOpenActiveWorkout,
}) => {
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  // Dismiss the theme menu on Escape or click-outside
  useEffect(() => {
    if (!showThemeMenu) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowThemeMenu(false);
    };
    const onPointerDown = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [showThemeMenu]);

  const themeColors: Record<ThemeOption, { name: string; dot: string; desc: string }> = {
    midnight: { name: 'Midnight Stealth', dot: 'bg-emerald-500', desc: 'OLED Black & Emerald' },
    obsidian: { name: 'Obsidian Gold', dot: 'bg-amber-400', desc: 'Deep Charcoal & Gold' },
    electric: { name: 'Electric Neon', dot: 'bg-cyan-400', desc: 'Cyber Navy & Cyan' },
    crimson: { name: 'Crimson Pump', dot: 'bg-rose-500', desc: 'Stealth Black & Crimson' },
    light: { name: 'Daylight High-Vis', dot: 'bg-zinc-900', desc: 'Crisp High-Contrast' },
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-3 sm:px-6">
        {/* Brand & Identity: Lift Lyte */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 via-zinc-800 to-zinc-900 border border-emerald-500/40 shadow-inner group">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
            <Dumbbell className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-zinc-100 absolute opacity-70" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-black tracking-tight text-white font-mono-numbers">
                LIFT
              </span>
              <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                LYTE
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-medium hidden md:block">
              Custom Workout Tracker & Health Sync
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Active Workout Resume Badge (Prominent on Mobile & Desktop) */}
          {activeWorkout && (
            <button
              onClick={onOpenActiveWorkout}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 transition active:scale-95 animate-pulse min-h-[36px]"
              title="Resume workout in progress"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Resume</span>
            </button>
          )}

          {/* Desktop Toolbar Controls */}
          <div className="hidden sm:flex items-center gap-2">
            {/* Offline Mode / Test Switcher */}
            <button
              onClick={() => onUpdateSettings({ simulateOffline: !settings.simulateOffline })}
              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium border transition ${
                !isOnline
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
              title={
                settings.simulateOffline
                  ? 'Offline Simulation Active - Click to reconnect'
                  : 'Click to simulate remote gym offline mode'
              }
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px]">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] font-semibold text-amber-300">
                    {settings.simulateOffline ? 'Offline (Test)' : 'Offline'}
                  </span>
                </>
              )}
            </button>

            {/* Night Vision Low-Blue Filter Toggle */}
            <button
              onClick={() => onUpdateSettings({ nightVisionMode: !settings.nightVisionMode })}
              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium border transition ${
                settings.nightVisionMode
                  ? 'bg-rose-950/80 border-rose-500/50 text-rose-300 shadow-xs shadow-rose-900/40'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
              title="Night Vision Filter: Low-light red/amber eye protection for night training"
            >
              {settings.nightVisionMode ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-[11px]">Night Vision ON</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-[11px]">Night Vision</span>
                </>
              )}
            </button>

            {/* Unit Toggle (lbs / kg) */}
            <button
              onClick={() => onUpdateSettings({ weightUnit: settings.weightUnit === 'lbs' ? 'kg' : 'lbs' })}
              className="flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs font-bold text-zinc-200 hover:border-zinc-700 transition font-mono-numbers"
              title="Toggle weight unit (lbs / kg)"
            >
              {settings.weightUnit.toUpperCase()}
            </button>

            {/* Theme Palette Switcher */}
            <div className="relative" ref={themeMenuRef}>
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 p-2 text-zinc-300 hover:text-white hover:border-zinc-700 transition"
                title="Change Gym Ambience Theme"
              >
                <Palette className="w-4 h-4" />
              </button>

              {showThemeMenu && (
                <div
                  className="absolute right-0 mt-2 w-52 rounded-2xl bg-zinc-900 border border-zinc-800 p-1.5 shadow-2xl z-50 animate-in fade-in"
                  onClick={() => setShowThemeMenu(false)}
                >
                  <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-800 mb-1">
                    Theme Ambience
                  </div>
                  {(Object.keys(themeColors) as ThemeOption[]).map((thm) => (
                    <button
                      key={thm}
                      onClick={() => onUpdateSettings({ theme: thm })}
                      className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition ${
                        settings.theme === thm
                          ? 'bg-zinc-800 text-white font-semibold'
                          : 'text-zinc-300 hover:bg-zinc-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${themeColors[thm].dot}`} />
                        <span>{themeColors[thm].name}</span>
                      </div>
                      {settings.theme === thm && (
                        <span className="text-[10px] font-bold text-emerald-400">Active</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* PWA Install Button */}
            <PWAInstallButton />
          </div>

          {/* Mobile Quick Settings & Offline Status (Streamlined for one-thumb gym use) */}
          <div className="sm:hidden flex items-center gap-1.5">
            {!isOnline && (
              <span className="flex items-center gap-1 rounded-lg bg-amber-500/15 border border-amber-500/40 px-2 py-1 text-[11px] font-bold text-amber-300">
                <WifiOff className="w-3 h-3 text-amber-400" />
                <span>Offline</span>
              </span>
            )}

            <button
              onClick={() => setShowMobileSettings(true)}
              className="flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 p-2 text-zinc-300 hover:text-white active:scale-95 transition min-h-[38px] min-w-[38px]"
              title="Gym Settings & Night Mode"
            >
              <Settings2 className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Settings Slide-over Bottom Sheet */}
      {showMobileSettings && (
        <div className="fixed inset-0 z-50 sm:hidden flex flex-col justify-end bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full rounded-t-3xl bg-zinc-900 border-t border-zinc-800 p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            {/* Sheet Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-extrabold text-white">Lift Lyte Controls</h3>
              </div>
              <button
                onClick={() => setShowMobileSettings(false)}
                className="rounded-full bg-zinc-800 p-1.5 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Weight Unit Stepper / Toggle */}
            <div className="flex items-center justify-between bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800">
              <div>
                <div className="text-xs font-bold text-white">Weight Unit</div>
                <div className="text-[11px] text-zinc-400">Used for sets & volume calculations</div>
              </div>
              <div className="flex rounded-xl bg-zinc-900 p-1 border border-zinc-800">
                <button
                  onClick={() => onUpdateSettings({ weightUnit: 'lbs' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono-numbers transition ${
                    settings.weightUnit === 'lbs'
                      ? 'bg-emerald-500 text-black shadow-sm'
                      : 'text-zinc-400'
                  }`}
                >
                  LBS
                </button>
                <button
                  onClick={() => onUpdateSettings({ weightUnit: 'kg' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono-numbers transition ${
                    settings.weightUnit === 'kg'
                      ? 'bg-emerald-500 text-black shadow-sm'
                      : 'text-zinc-400'
                  }`}
                >
                  KG
                </button>
              </div>
            </div>

            {/* Night Vision Low-Blue Mode Toggle */}
            <div className="flex items-center justify-between bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5 text-rose-400" />
                  <span>Night Vision Filter</span>
                </div>
                <div className="text-[11px] text-zinc-400">Low-blue red/amber eye protection</div>
              </div>
              <button
                onClick={() => onUpdateSettings({ nightVisionMode: !settings.nightVisionMode })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  settings.nightVisionMode ? 'bg-rose-500' : 'bg-zinc-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    settings.nightVisionMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Offline Simulation Toggle */}
            <div className="flex items-center justify-between bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>Simulate Remote Offline Mode</span>
                </div>
                <div className="text-[11px] text-zinc-400">Test offline logging without internet</div>
              </div>
              <button
                onClick={() => onUpdateSettings({ simulateOffline: !settings.simulateOffline })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  settings.simulateOffline ? 'bg-amber-500' : 'bg-zinc-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    settings.simulateOffline ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Theme Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
                Gym Theme Ambience
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(themeColors) as ThemeOption[]).map((thm) => (
                  <button
                    key={thm}
                    onClick={() => onUpdateSettings({ theme: thm })}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition ${
                      settings.theme === thm
                        ? 'bg-zinc-800 border-emerald-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <span className={`h-3 w-3 rounded-full ${themeColors[thm].dot}`} />
                    <span>{themeColors[thm].name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Install PWA Button */}
            <div className="pt-2">
              <PWAInstallButton className="w-full justify-center py-3 text-sm rounded-2xl" />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
