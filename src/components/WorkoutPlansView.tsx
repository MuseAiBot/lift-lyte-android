import React, { useState } from 'react';
import {
  Clock,
  Copy,
  Dumbbell,
  Edit2,
  Flame,
  Moon,
  MoreVertical,
  Play,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Trophy,
} from 'lucide-react';
import {
  Exercise,
  UserSettings,
  WorkoutLog,
  WorkoutRoutine,
} from '../types/workout';

interface WorkoutPlansViewProps {
  routines: WorkoutRoutine[];
  onStartRoutine: (routine: WorkoutRoutine) => void;
  onStartEmptyWorkout: () => void;
  onOpenRoutineBuilder: (routine?: WorkoutRoutine) => void;
  onDeleteRoutine: (routineId: string) => void;
  onDuplicateRoutine: (routine: WorkoutRoutine) => void;
  onOpenExerciseLibrary: () => void;
  settings: UserSettings;
}

export const WorkoutPlansView: React.FC<WorkoutPlansViewProps> = ({
  routines,
  onStartRoutine,
  onStartEmptyWorkout,
  onOpenRoutineBuilder,
  onDeleteRoutine,
  onDuplicateRoutine,
  onOpenExerciseLibrary,
  settings,
}) => {
  const [search, setSearch] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Guarantee only user-created custom routines are shown
  const customRoutinesOnly = routines.filter((r) => r.isCustom);

  const filtered = customRoutinesOnly.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Hero & Action Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 p-5 sm:p-6 rounded-3xl border border-zinc-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Custom Plans Only
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Your Custom Workouts
          </h2>
          <p className="text-xs text-zinc-400 max-w-xl">
            Simplified workspace containing exclusively your custom workouts. Build routines with your chosen exercises, target reps, weights, and rest periods.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 pt-2 sm:pt-0">
          <button
            onClick={() => onOpenRoutineBuilder()}
            className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 sm:py-2.5 text-xs font-bold text-black hover:bg-emerald-400 active:scale-95 transition shadow-lg shadow-emerald-500/20 min-h-[44px]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Custom Plan</span>
          </button>
          <button
            onClick={onStartEmptyWorkout}
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-zinc-800 border border-zinc-700/80 px-3.5 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 active:scale-95 transition min-h-[44px]"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            <span>Freestyle Session</span>
          </button>
          <button
            onClick={onOpenExerciseLibrary}
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-zinc-800 border border-zinc-700/80 px-3.5 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 active:scale-95 transition min-h-[44px]"
          >
            <Dumbbell className="w-3.5 h-3.5 text-amber-400" />
            <span>Exercise Catalog</span>
          </button>
        </div>
      </div>

      {/* Search Input (Only show if there are custom routines) */}
      {customRoutinesOnly.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search custom routine by title, focus, or category..."
            className="w-full rounded-2xl bg-zinc-900 border border-zinc-800/80 pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-hidden"
          />
        </div>
      )}

      {/* Routine Cards Grid or Empty State */}
      {customRoutinesOnly.length === 0 ? (
        <div className="rounded-3xl bg-zinc-900/60 border border-dashed border-zinc-800 p-8 sm:p-12 text-center space-y-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mx-auto">
            <Dumbbell className="w-8 h-8" />
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-white">No Pre-Populated Workouts</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              All generic pre-set plans have been removed. This workspace is simplified exclusively for your custom workouts.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onOpenRoutineBuilder()}
              className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-xs font-bold text-black hover:bg-emerald-400 active:scale-95 transition shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Your First Custom Plan</span>
            </button>
            <button
              onClick={onStartEmptyWorkout}
              className="flex items-center gap-2 rounded-2xl bg-zinc-800 border border-zinc-700 px-4 py-3 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 active:scale-95 transition"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              <span>Start Freestyle Workout</span>
            </button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 text-xs">
          No custom routines found matching "{search}".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filtered.map((routine) => {
            const muscleGroups = Array.from(
              new Set(routine.exercises.map((e) => e.exercise.category))
            );
            const totalSets = routine.exercises.reduce((acc, curr) => acc + curr.sets.length, 0);

            return (
              <div
                key={routine.id}
                className="relative flex flex-col justify-between rounded-3xl bg-zinc-900/90 border border-zinc-800/90 p-5 sm:p-6 hover:border-zinc-700 transition shadow-lg group"
              >
                <div>
                  {/* Header & Tag */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: routine.color || '#10b981' }}
                      />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        {routine.category}
                      </span>
                      <span className="rounded-md bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                        Custom Plan
                      </span>
                    </div>

                    {/* Options Menu */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setActiveMenuId(activeMenuId === routine.id ? null : routine.id)
                        }
                        className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuId === routine.id && (
                        <div
                          className="absolute right-0 mt-1 w-36 rounded-xl bg-zinc-950 border border-zinc-800 p-1 shadow-2xl z-20 animate-in fade-in"
                          onClick={() => setActiveMenuId(null)}
                        >
                          <button
                            onClick={() => onOpenRoutineBuilder(routine)}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Customize</span>
                          </button>
                          <button
                            onClick={() => onDuplicateRoutine(routine)}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Duplicate</span>
                          </button>
                          <button
                            onClick={() => onDeleteRoutine(routine.id)}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-950/40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-extrabold text-white mt-2 group-hover:text-emerald-400 transition">
                    {routine.title}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                    {routine.description}
                  </p>

                  {/* Meta Pills */}
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-300">
                    <div className="flex items-center gap-1 rounded-lg bg-zinc-950/70 border border-zinc-800 px-2.5 py-1 font-mono-numbers">
                      <Clock className="w-3 h-3 text-emerald-400" />
                      <span>~{routine.estimatedMinutes}m</span>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg bg-zinc-950/70 border border-zinc-800 px-2.5 py-1 font-mono-numbers">
                      <Dumbbell className="w-3 h-3 text-cyan-400" />
                      <span>{routine.exercises.length} Exercises</span>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg bg-zinc-950/70 border border-zinc-800 px-2.5 py-1 font-mono-numbers">
                      <Flame className="w-3 h-3 text-amber-400" />
                      <span>{totalSets} Sets</span>
                    </div>
                  </div>

                  {/* Muscle Distribution Tags */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {muscleGroups.map((mg) => (
                      <span
                        key={mg}
                        className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-[10px] font-semibold text-zinc-300 border border-zinc-700/40"
                      >
                        {mg}
                      </span>
                    ))}
                  </div>

                  {/* Exercise Preview List */}
                  <div className="mt-4 pt-3 border-t border-zinc-800/60 space-y-1">
                    {routine.exercises.slice(0, 3).map((ex, i) => (
                      <div
                        key={ex.id}
                        className="flex items-center justify-between text-xs text-zinc-400"
                      >
                        <span className="truncate pr-2">
                          {i + 1}. {ex.exercise.name}
                        </span>
                        <span className="font-mono-numbers text-[11px] text-zinc-500 shrink-0">
                          {ex.sets.length} sets
                        </span>
                      </div>
                    ))}
                    {routine.exercises.length > 3 && (
                      <div className="text-[11px] text-zinc-500 italic">
                        +{routine.exercises.length - 3} more exercises...
                      </div>
                    )}
                  </div>
                </div>

                {/* Start Workout Button */}
                <div className="mt-5 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500">
                    Target: {routine.targetDaysPerWeek}x / week
                  </span>
                  <button
                    onClick={() => onStartRoutine(routine)}
                    className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-black hover:bg-emerald-400 active:scale-95 transition shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Workout</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
