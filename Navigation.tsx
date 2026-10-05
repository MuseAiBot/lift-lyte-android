import React from 'react';
import { CalendarDays, Dumbbell, HeartPulse, LineChart } from 'lucide-react';

export type NavTab = 'workouts' | 'calendar' | 'progress' | 'health';

interface NavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  prCountBadge?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  prCountBadge = 0,
}) => {
  const tabs: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'workouts', label: 'Workouts', icon: Dumbbell },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'progress', label: 'Progress & PRs', icon: LineChart },
    { id: 'health', label: 'Health Sync', icon: HeartPulse },
  ];

  return (
    <>
      {/* Desktop / Tablet Top Tabs Bar */}
      <nav className="hidden sm:block border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xs">
        <div className="mx-auto flex max-w-7xl px-6">
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-3.5 text-xs font-bold transition ${
                    isActive
                      ? 'text-emerald-400'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                  <span>{tab.label}</span>
                  {tab.id === 'progress' && prCountBadge > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/40 px-1 text-[10px] font-bold text-amber-300">
                      {prCountBadge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Floating Bottom Dock with Safe Area */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-800/90 bg-zinc-950/95 backdrop-blur-md px-2 pt-1.5 shadow-2xl"
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="grid grid-cols-4 gap-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition active:scale-95 min-h-[48px] ${
                  isActive
                    ? 'text-emerald-400 bg-emerald-500/10 font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400 scale-105' : 'text-zinc-400'}`} />
                  {tab.id === 'progress' && prCountBadge > 0 && (
                    <span className="absolute -top-1 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-black">
                      {prCountBadge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-tight truncate max-w-[70px] mt-0.5">
                  {tab.id === 'workouts'
                    ? 'Workouts'
                    : tab.id === 'calendar'
                    ? 'Calendar'
                    : tab.id === 'progress'
                    ? 'PRs & Stats'
                    : 'Health Sync'}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
