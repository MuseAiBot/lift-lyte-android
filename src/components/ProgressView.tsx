import React, { useState } from 'react';
import {
  Award,
  Calendar,
  CheckCircle,
  Dumbbell,
  Flame,
  LineChart,
  Percent,
  Share2,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react';
import { Exercise, MuscleGroup, UserSettings, WorkoutLog } from '../types/workout';
import { calculate1RM } from '../utils/storage';

interface ProgressViewProps {
  logs: WorkoutLog[];
  exercises: Exercise[];
  settings: UserSettings;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  logs,
  exercises,
  settings,
}) => {
  // Trackable lifts: Prioritize custom exercises and exercises with logged data or PRs
  const trackableExercises = exercises.length > 0 ? exercises : [];

  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(
    trackableExercises.find((e) => e.isCustom)?.id || trackableExercises[0]?.id || 'ex-bench-press'
  );

  // 1RM Calculator State
  const [calcWeight, setCalcWeight] = useState(225);
  const [calcReps, setCalcReps] = useState(5);
  const calculated1RM = calculate1RM(calcWeight, calcReps);

  const selectedExercise = exercises.find((e) => e.id === selectedExerciseId);

  // Bodyweight exercises log PRs with 0 lbs — display them as "Bodyweight", not "0 lbs"
  const prWeightLabel = (maxWeight: number): string =>
    maxWeight > 0 ? `${maxWeight} ${settings.weightUnit}` : 'Bodyweight';
  const prEst1RMLabel = (est1RM: number): string =>
    est1RM > 0 ? `${est1RM} ${settings.weightUnit}` : '—';

  // Extract historical trend for selected exercise from logs
  const exerciseHistory = logs
    .filter((l) => l.exercises.some((e) => e.exerciseId === selectedExerciseId))
    .map((l) => {
      const we = l.exercises.find((e) => e.exerciseId === selectedExerciseId);
      const completedSets = we?.sets.filter((s) => s.completed) || [];
      const maxWeight = Math.max(0, ...completedSets.map((s) => s.weight));
      const bestSet = completedSets.find((s) => s.weight === maxWeight);
      const est1RM = bestSet ? calculate1RM(bestSet.weight, bestSet.reps) : maxWeight;
      return {
        date: l.startedAt.slice(0, 10),
        maxWeight,
        reps: bestSet?.reps || 0,
        est1RM,
      };
    })
    .reverse();

  // Muscle Volume Distribution
  const muscleVolumeMap: Record<string, number> = {};
  logs.forEach((log) => {
    log.exercises.forEach((we) => {
      const cat = we.exercise.category;
      const vol = we.sets
        .filter((s) => s.completed)
        .reduce((sum, s) => sum + s.weight * s.reps, 0);
      muscleVolumeMap[cat] = (muscleVolumeMap[cat] || 0) + vol;
    });
  });

  const totalAllVolume = Object.values(muscleVolumeMap).reduce((a, b) => a + b, 0) || 1;

  // Rep percentage chart based on calculated 1RM
  const repPercentages = [
    { percent: 100, reps: 1 },
    { percent: 95, reps: 2 },
    { percent: 90, reps: 4 },
    { percent: 85, reps: 6 },
    { percent: 80, reps: 8 },
    { percent: 75, reps: 10 },
    { percent: 70, reps: 12 },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 p-5 sm:p-6 rounded-3xl border border-zinc-800 shadow-xl">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
            Analytics & Strength Trajectory
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
          Personal Progress & Records
        </h2>
        <p className="text-xs text-zinc-400 max-w-2xl">
          Monitor your estimated 1-Rep Max growth over time, analyze muscle volume distribution, and celebrate Personal Record milestones.
        </p>
      </div>

      {/* 1RM Strength Progression Tracker */}
      <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800 p-5 sm:p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Exercise Progression
            </span>
            <h3 className="text-lg font-black text-white">Strength Growth & 1RM Over Time</h3>
          </div>

          {/* Exercise Dropdown */}
          <select
            value={selectedExerciseId}
            onChange={(e) => setSelectedExerciseId(e.target.value)}
            className="rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2 text-xs font-bold text-white focus:border-emerald-500 focus:outline-hidden"
          >
            {trackableExercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.isCustom ? '★ ' : ''}{ex.name} ({ex.category})
              </option>
            ))}
          </select>
        </div>

        {/* Current PR Overview Card */}
        {selectedExercise?.personalRecord && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800/80">
            <div>
              <div className="text-[11px] text-zinc-400">All-Time Max Weight</div>
              <div className="text-lg sm:text-xl font-black font-mono-numbers text-white mt-0.5">
                {prWeightLabel(selectedExercise.personalRecord.maxWeight)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-zinc-400">Max Reps at Weight</div>
              <div className="text-lg sm:text-xl font-black font-mono-numbers text-emerald-400 mt-0.5">
                {selectedExercise.personalRecord.maxReps} reps
              </div>
            </div>
            <div>
              <div className="text-[11px] text-zinc-400">Estimated 1RM</div>
              <div className="text-lg sm:text-xl font-black font-mono-numbers text-amber-400 mt-0.5">
                {prEst1RMLabel(selectedExercise.personalRecord.estimated1RM)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-zinc-400">PR Date</div>
              <div className="text-xs sm:text-sm font-bold text-zinc-300 mt-1 font-mono-numbers">
                {selectedExercise.personalRecord.achievedAt.slice(0, 10)}
              </div>
            </div>
          </div>
        )}

        {/* Visual Progression Bars Timeline */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
            <span>Historical Sessions Progression</span>
            <span className="text-[10px] text-emerald-400">Calculated 1RM Trend</span>
          </div>

          {exerciseHistory.length === 0 ? (
            <div className="text-center py-8 text-xs text-zinc-500">
              No historical sessions logged for this exercise yet. Start a workout to build the chart!
            </div>
          ) : (
            <div className="space-y-2">
              {exerciseHistory.map((entry, idx) => {
                const maxEst = Math.max(...exerciseHistory.map((h) => h.est1RM), 1);
                const percent = Math.round((entry.est1RM / maxEst) * 100);

                return (
                  <div
                    key={`${entry.date}-${idx}`}
                    className="flex items-center gap-3 bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800/60"
                  >
                    <div className="w-20 text-xs font-mono-numbers text-zinc-400 shrink-0">
                      {entry.date}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-white font-mono-numbers">
                          {entry.maxWeight} {settings.weightUnit} × {entry.reps} reps
                        </span>
                        <span className="font-mono-numbers font-black text-emerald-400">
                          1RM: {entry.est1RM} {settings.weightUnit}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Grid: 1RM Calculator & Muscle Volume Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1RM Calculator Widget */}
        <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800 p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-bold text-white">One-Rep Max (1RM) Calculator</h3>
          </div>
          <p className="text-xs text-zinc-400">
            Calculate your true theoretical maximum strength and training percentage zones using the Brzycki standard.
          </p>

          <div className="grid grid-cols-2 gap-3 bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                Weight Lifted ({settings.weightUnit})
              </label>
              <input
                type="number"
                value={calcWeight}
                onChange={(e) => setCalcWeight(Number(e.target.value))}
                className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm font-bold text-white font-mono-numbers focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                Reps Performed
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={calcReps}
                onChange={(e) => setCalcReps(Number(e.target.value))}
                className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm font-bold text-white font-mono-numbers focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4">
            <div>
              <div className="text-xs text-emerald-400 font-bold uppercase">Estimated 1-Rep Max</div>
              <div className="text-2xl font-black text-white font-mono-numbers mt-0.5">
                {calculated1RM} <span className="text-sm font-bold text-emerald-400">{settings.weightUnit}</span>
              </div>
            </div>
            <Trophy className="w-8 h-8 text-emerald-400 opacity-80" />
          </div>

          {/* Percentage Target Table */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
            {repPercentages.map((item) => (
              <div
                key={item.percent}
                className="bg-zinc-950 p-2 rounded-xl border border-zinc-800/80 text-center"
              >
                <div className="text-[10px] text-zinc-400 font-bold">
                  {item.percent}% ({item.reps} RM)
                </div>
                <div className="text-xs font-black text-white font-mono-numbers mt-0.5">
                  {Math.round((calculated1RM * item.percent) / 100)} {settings.weightUnit}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Muscle Volume Breakdown */}
        <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800 p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Muscle Group Volume Distribution</h3>
          </div>
          <p className="text-xs text-zinc-400">
            Total workload volume distributed across major muscle groups to detect imbalances.
          </p>

          <div className="space-y-3 pt-2">
            {Object.entries(muscleVolumeMap).map(([muscle, vol]) => {
              const pct = Math.round((vol / totalAllVolume) * 100);
              return (
                <div key={muscle} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-200">{muscle}</span>
                    <span className="font-mono-numbers text-zinc-400">
                      {vol.toLocaleString()} {settings.weightUnit} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-950 overflow-hidden border border-zinc-800/60">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Personal Records Trophy Wall */}
      <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Personal Records (PR) Wall</h3>
          </div>
          <span className="text-xs text-zinc-500 font-mono-numbers">
            {trackableExercises.filter((b) => b.personalRecord).length} Records Tracked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {trackableExercises.filter((b) => b.personalRecord).length === 0 ? (
            <div className="col-span-full text-center py-8 space-y-2">
              <Trophy className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-sm font-semibold text-zinc-300">No personal records yet</p>
              <p className="text-xs text-zinc-500">Log a workout to set your first record!</p>
            </div>
          ) : (
          trackableExercises
            .filter((b) => b.personalRecord)
            .map((ex) => {
              const pr = ex.personalRecord!;
              return (
                <div
                  key={ex.id}
                  className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4 space-y-2 hover:border-amber-500/50 transition group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                        {ex.category}
                      </span>
                      <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition">
                        {ex.name}
                      </h4>
                    </div>
                    <Award className="w-5 h-5 text-amber-400 shrink-0" />
                  </div>

                  <div className="flex items-baseline gap-2 pt-1 font-mono-numbers">
                    <span className="text-2xl font-black text-white">{pr.maxWeight > 0 ? pr.maxWeight : 'BW'}</span>
                    <span className="text-xs font-bold text-amber-400">
                      {pr.maxWeight > 0 ? settings.weightUnit : ''} × {pr.maxReps} reps
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400 font-mono-numbers">
                    <span>Est 1RM: {prEst1RMLabel(pr.estimated1RM)}</span>
                    <span>{pr.achievedAt.slice(0, 10)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
