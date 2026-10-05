import React, { useState } from 'react';
import {
  Activity,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  Flame,
  Moon,
  Plus,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import {
  UserSettings,
  WorkoutLog,
  WorkoutRoutine,
} from '../types/workout';
import { formatDuration } from '../utils/storage';

interface CalendarViewProps {
  logs: WorkoutLog[];
  routines: WorkoutRoutine[];
  onStartRoutine: (routine: WorkoutRoutine) => void;
  settings: UserSettings;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  logs,
  routines,
  onStartRoutine,
  settings,
}) => {
  // Current calendar view month (defaults to the real current month)
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => new Date());
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Days in month
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Local YYYY-MM-DD for a Date (avoids UTC-shift issues from toISOString)
  const toLocalDateStr = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Check logs matching a date string (YYYY-MM-DD). startedAt is stored as a
  // UTC ISO string, so compare on the *local* date — otherwise a late-evening
  // workout renders on the next day's cell.
  const getLogsForDate = (dateObj: Date): WorkoutLog[] => {
    const dateStr = toLocalDateStr(dateObj);

    return logs.filter((l) => toLocalDateStr(new Date(l.startedAt)) === dateStr);
  };

  // Frequency calculations
  const monthLogs = logs.filter((l) => {
    const d = new Date(l.startedAt);
    return d.getFullYear() === year && d.getMonth() === month;
  });
  const totalWorkoutsThisMonth = monthLogs.length;

  const totalVolumeThisMonth = monthLogs.reduce((acc, curr) => acc + curr.totalVolume, 0);

  // Days elapsed in the viewed month (full month when viewing past months)
  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
  const daysElapsed = isCurrentMonth ? today.getDate() : totalDays;

  const activeDaysThisMonth = new Set(monthLogs.map((l) => l.startedAt.slice(0, 10))).size;
  const consistencyRate = daysElapsed > 0 ? Math.round((activeDaysThisMonth / daysElapsed) * 100) : 0;
  const avgWorkoutsPerWeek = daysElapsed > 0 ? (totalWorkoutsThisMonth / daysElapsed) * 7 : 0;

  // Calculate Streak (current run ending today/yesterday, plus all-time best)
  const calculateStreak = () => {
    const sortedDates = Array.from(
      new Set(logs.map((l) => l.startedAt.slice(0, 10)))
    ).sort();

    if (sortedDates.length === 0) return { current: 0, best: 0 };

    const dateSet = new Set(sortedDates);

    // Best streak: longest run of consecutive days anywhere in history
    let best = 1;
    let run = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1] + 'T12:00:00');
      const curr = new Date(sortedDates[i] + 'T12:00:00');
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        run++;
        best = Math.max(best, run);
      } else if (diffDays > 1) {
        run = 1;
      }
    }

    // Current streak: consecutive days ending today, or yesterday if no workout logged yet today
    const todayStr = toLocalDateStr(today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toLocalDateStr(yesterday);

    let cursor: Date | null = null;
    if (dateSet.has(todayStr)) cursor = new Date(today);
    else if (dateSet.has(yesterdayStr)) cursor = yesterday;

    let current = 0;
    while (cursor && dateSet.has(toLocalDateStr(cursor))) {
      current++;
      cursor = new Date(cursor);
      cursor.setDate(cursor.getDate() - 1);
    }

    return { current, best };
  };

  const streakInfo = calculateStreak();

  const selectedDayLogs = selectedDate ? getLogsForDate(selectedDate) : [];

  return (
    <div className="space-y-6">
      {/* Top Header & Frequency Analytics Bar */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 p-5 sm:p-6 rounded-3xl border border-zinc-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Workout Frequency & History
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
              Training Calendar
            </h2>
            <p className="text-xs text-zinc-400">
              Track consistency across separate days, monitor workout frequency, and inspect session logs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-2 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-white px-3 font-mono-numbers">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-2 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Frequency & Streak Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="rounded-2xl bg-zinc-950/80 p-3.5 border border-zinc-800/80">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Current Streak</span>
            </div>
            <div className="text-xl font-black text-amber-400 mt-1 font-mono-numbers">
              {streakInfo.current} <span className="text-xs font-semibold text-zinc-400">Days</span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Best: {streakInfo.best} days</div>
          </div>

          <div className="rounded-2xl bg-zinc-950/80 p-3.5 border border-zinc-800/80">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Monthly Sessions</span>
            </div>
            <div className="text-xl font-black text-white mt-1 font-mono-numbers">
              {totalWorkoutsThisMonth}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">{avgWorkoutsPerWeek.toFixed(1)} workouts / week</div>
          </div>

          <div className="rounded-2xl bg-zinc-950/80 p-3.5 border border-zinc-800/80">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Dumbbell className="w-3.5 h-3.5 text-cyan-400" />
              <span>Month Volume</span>
            </div>
            <div className="text-xl font-black text-cyan-400 mt-1 font-mono-numbers">
              {totalVolumeThisMonth.toLocaleString()}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">{settings.weightUnit} total lifted</div>
          </div>

          <div className="rounded-2xl bg-zinc-950/80 p-3.5 border border-zinc-800/80">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Trophy className="w-3.5 h-3.5 text-purple-400" />
              <span>Consistency Rate</span>
            </div>
            <div className="text-xl font-black text-purple-400 mt-1 font-mono-numbers">
              {consistencyRate}%
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">{activeDaysThisMonth} of {daysElapsed} days active</div>
          </div>
        </div>
      </div>

      {/* Interactive Calendar Grid */}
      <div className="rounded-3xl bg-zinc-900/80 border border-zinc-800 p-4 sm:p-6 shadow-xl">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-zinc-400 uppercase tracking-wider">
          {daysOfWeek.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Day Cells */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
          {/* Empty cells before month begins */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="min-h-[58px] sm:min-h-[105px] rounded-xl sm:rounded-2xl bg-zinc-950/20 border border-transparent p-1 sm:p-2 opacity-30"
            />
          ))}

          {/* Month Days */}
          {Array.from({ length: totalDays }).map((_, idx) => {
            const dayNum = idx + 1;
            const thisDate = new Date(year, month, dayNum);
            const dayLogs = getLogsForDate(thisDate);
            const hasWorkout = dayLogs.length > 0;
            const isToday =
              dayNum === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const isSelected =
              selectedDate?.getDate() === dayNum &&
              selectedDate?.getMonth() === month &&
              selectedDate?.getFullYear() === year;

            return (
              <button
                key={dayNum}
                onClick={() => {
                  setSelectedDate(thisDate);
                  setIsDayModalOpen(true);
                }}
                className={`min-h-[58px] sm:min-h-[105px] rounded-xl sm:rounded-2xl p-1.5 sm:p-2.5 flex flex-col justify-between text-left transition border ${
                  isSelected
                    ? 'border-emerald-400 bg-emerald-500/10 shadow-md'
                    : hasWorkout
                    ? 'border-emerald-500/30 bg-zinc-950 hover:border-emerald-500/60'
                    : 'border-zinc-800/80 bg-zinc-950/40 hover:bg-zinc-800/40'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-md sm:rounded-lg text-[11px] sm:text-xs font-bold font-mono-numbers ${
                      isToday
                        ? 'bg-emerald-500 text-black font-black'
                        : hasWorkout
                        ? 'text-white'
                        : 'text-zinc-500'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {dayLogs.some((l) => l.isNightSession) && (
                    <span title="Night Training Session">
                      <Moon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
                    </span>
                  )}
                </div>

                {hasWorkout ? (
                  <div className="space-y-1 w-full mt-1">
                    {/* Mobile Dot/Badge Indicator */}
                    <div className="sm:hidden flex items-center justify-center">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400/80" />
                    </div>

                    {/* Desktop Detailed Labels */}
                    <div className="hidden sm:block space-y-1">
                      {dayLogs.map((log) => (
                        <div
                          key={log.id}
                          className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300 truncate"
                          title={log.routineTitle}
                        >
                          {log.routineTitle}
                        </div>
                      ))}
                      <div className="text-[10px] font-mono-numbers text-zinc-400 font-semibold truncate">
                        {dayLogs.reduce((acc, c) => acc + c.totalVolume, 0).toLocaleString()}{' '}
                        {settings.weightUnit}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-zinc-600 font-medium hidden sm:block">
                    Rest Day
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day Details Modal (Native Bottom Sheet on Mobile, Modal on Desktop) */}
      {isDayModalOpen && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-zinc-900 border-t sm:border border-zinc-800 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Day Inspector
                </span>
                <h3 className="text-lg font-bold text-white">
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </h3>
              </div>
              <button
                onClick={() => setIsDayModalOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedDayLogs.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-500 mx-auto">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-300">No workout recorded on this day</p>
                  <p className="text-xs text-zinc-500">Rest, recover, or start a scheduled routine now.</p>
                </div>
                <div className="pt-2">
                  <span className="text-xs font-semibold uppercase text-zinc-400 block mb-2">
                    Quick Start Routine:
                  </span>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {routines.slice(0, 3).map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          setIsDayModalOpen(false);
                          onStartRoutine(r);
                        }}
                        className="rounded-xl bg-zinc-800 hover:bg-emerald-500 hover:text-black border border-zinc-700 px-3 py-1.5 text-xs font-bold text-zinc-200 transition"
                      >
                        {r.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {selectedDayLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Dumbbell className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-sm font-bold text-white">{log.routineTitle}</h4>
                      </div>
                      {log.isNightSession && (
                        <span className="flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                          <Moon className="w-3 h-3" />
                          <span>Night Session</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-zinc-900/60 p-2 rounded-xl border border-zinc-800/80">
                        <div className="text-zinc-500 text-[10px]">Volume</div>
                        <div className="font-bold text-emerald-400 font-mono-numbers">
                          {log.totalVolume.toLocaleString()} {settings.weightUnit}
                        </div>
                      </div>
                      <div className="bg-zinc-900/60 p-2 rounded-xl border border-zinc-800/80">
                        <div className="text-zinc-500 text-[10px]">Duration</div>
                        <div className="font-bold text-white font-mono-numbers">
                          {formatDuration(log.durationSeconds)}
                        </div>
                      </div>
                      <div className="bg-zinc-900/60 p-2 rounded-xl border border-zinc-800/80">
                        <div className="text-zinc-500 text-[10px]">Calories</div>
                        <div className="font-bold text-rose-400 font-mono-numbers">
                          {log.caloriesBurned || 450} kcal
                        </div>
                      </div>
                    </div>

                    {/* Exercises Summary */}
                    <div className="space-y-1.5 pt-2 border-t border-zinc-800/60">
                      <span className="text-[10px] font-bold uppercase text-zinc-500">
                        Exercises & Performance:
                      </span>
                      {log.exercises.map((ex) => {
                        const completedSets = ex.sets.filter((s) => s.completed);
                        const maxW = Math.max(0, ...completedSets.map((s) => s.weight));
                        return (
                          <div
                            key={ex.id}
                            className="flex items-center justify-between text-xs text-zinc-300 py-1 border-b border-zinc-800/40 last:border-none"
                          >
                            <span>{ex.exercise.name}</span>
                            <span className="font-mono-numbers text-zinc-400">
                              {completedSets.length} sets • Max {maxW} {settings.weightUnit}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Health Platforms verified sync */}
                    {log.syncedPlatforms && log.syncedPlatforms.length > 0 && (
                      <div className="text-[10px] text-emerald-400/90 font-semibold flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span>
                          Synced to{' '}
                          {log.syncedPlatforms
                            .map((p) => p.replace('_', ' ').toUpperCase())
                            .join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setIsDayModalOpen(false)}
              className="w-full rounded-2xl bg-zinc-800 py-2.5 text-xs font-bold text-white hover:bg-zinc-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
