import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Calculator,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Dumbbell,
  Flame,
  Heart,
  Maximize2,
  Minimize2,
  Moon,
  Plus,
  Share2,
  Trash2,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import {
  Exercise,
  SetType,
  UserSettings,
  WorkoutExercise,
  WorkoutLog,
  WorkoutSet,
} from '../types/workout';
import { soundManager } from '../utils/audio';
import { calculate1RM, formatDuration } from '../utils/storage';
import { ExerciseLibraryModal } from './ExerciseLibraryModal';
import { PlateCalculatorModal } from './PlateCalculatorModal';
import { RestTimerFloating } from './RestTimerFloating';

interface ActiveWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void; // minimize
  activeWorkout: WorkoutLog;
  onUpdateActiveWorkout: (workout: WorkoutLog) => void;
  onFinishWorkout: (finishedLog: WorkoutLog) => void;
  onDiscardWorkout: () => void;
  exercises: Exercise[];
  onSaveCustomExercise: (exercise: Exercise) => void;
  settings: UserSettings;
}

export const ActiveWorkoutModal: React.FC<ActiveWorkoutModalProps> = ({
  isOpen,
  onClose,
  activeWorkout,
  onUpdateActiveWorkout,
  onFinishWorkout,
  onDiscardWorkout,
  exercises,
  onSaveCustomExercise,
  settings,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(activeWorkout.durationSeconds || 0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [plateCalcWeight, setPlateCalcWeight] = useState<number | null>(null);

  // Rest Timer State
  const [restRemaining, setRestRemaining] = useState<number>(0);
  const [restTotal, setRestTotal] = useState<number>(90);
  const [isRestActive, setIsRestActive] = useState<boolean>(false);

  // PR Celebration State
  const [recentPRAlert, setRecentPRAlert] = useState<string | null>(null);

  // Workout Summary Finish Dialog
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<WorkoutLog | null>(null);

  // Timer Tick — uses a ref so the 1s interval never overwrites newer
  // workout state with a stale closure between set-toggles.
  const activeWorkoutRef = useRef(activeWorkout);
  activeWorkoutRef.current = activeWorkout;
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        // update duration every 5 seconds
        if (next % 5 === 0) {
          onUpdateActiveWorkout({ ...activeWorkoutRef.current, durationSeconds: next });
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onUpdateActiveWorkout]);

  // Rest Timer Countdown
  useEffect(() => {
    if (!isRestActive || restRemaining <= 0) return;
    const interval = setInterval(() => {
      setRestRemaining((prev) => {
        if (prev <= 1) {
          setIsRestActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRestActive, restRemaining]);

  const startRestTimer = (seconds: number) => {
    setRestTotal(seconds);
    setRestRemaining(seconds);
    setIsRestActive(true);
  };

  const handleAdjustRest = (delta: number) => {
    setRestRemaining((prev) => Math.max(0, prev + delta));
    setRestTotal((prev) => Math.max(prev, restRemaining + delta));
  };

  const handleToggleSetComplete = (exIdx: number, setIdx: number) => {
    const workoutCopy = { ...activeWorkout };
    const currentSet = workoutCopy.exercises[exIdx].sets[setIdx];
    const willBeCompleted = !currentSet.completed;

    workoutCopy.exercises[exIdx].sets[setIdx] = {
      ...currentSet,
      completed: willBeCompleted,
    };

    // Calculate total stats
    let totalVol = 0;
    let totalReps = 0;
    let totalSets = 0;

    workoutCopy.exercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        if (s.completed) {
          totalVol += s.weight * s.reps;
          totalReps += s.reps;
          totalSets += 1;
        }
      });
    });

    workoutCopy.totalVolume = totalVol;
    workoutCopy.totalReps = totalReps;
    workoutCopy.totalSets = totalSets;

    onUpdateActiveWorkout(workoutCopy);

    // If set was just marked completed, check for PR and start rest timer
    if (willBeCompleted) {
      const exercise = workoutCopy.exercises[exIdx].exercise;
      const currentPr = exercise.personalRecord;
      const est1RM = calculate1RM(currentSet.weight, currentSet.reps);

      if (
        !currentPr ||
        currentSet.weight > currentPr.maxWeight ||
        est1RM > currentPr.estimated1RM
      ) {
        // PR Broken!
        if (settings.soundEnabled) soundManager.playPRCelebration();
        setRecentPRAlert(
          `🏆 NEW PERSONAL RECORD! ${exercise.name}: ${currentSet.weight} ${settings.weightUnit} × ${currentSet.reps} reps (Est 1RM: ${est1RM} ${settings.weightUnit})`
        );
        setTimeout(() => setRecentPRAlert(null), 6000);
      }

      // Trigger Rest timer
      const restTime = workoutCopy.exercises[exIdx].restTimerSeconds || 90;
      startRestTimer(restTime);
    }
  };

  const handleUpdateSet = (
    exIdx: number,
    setIdx: number,
    field: keyof WorkoutSet,
    val: unknown
  ) => {
    const workoutCopy = { ...activeWorkout };
    workoutCopy.exercises[exIdx].sets[setIdx] = {
      ...workoutCopy.exercises[exIdx].sets[setIdx],
      [field]: val,
    };
    onUpdateActiveWorkout(workoutCopy);
  };

  const handleAddSet = (exIdx: number) => {
    const workoutCopy = { ...activeWorkout };
    const currentSets = workoutCopy.exercises[exIdx].sets;
    const lastSet = currentSets[currentSets.length - 1];

    const newSet: WorkoutSet = {
      id: `set-${Date.now()}-${currentSets.length + 1}`,
      setNumber: currentSets.length + 1,
      type: 'normal',
      weight: lastSet ? lastSet.weight : 135,
      reps: lastSet ? lastSet.reps : 8,
      completed: false,
      previousWeight: lastSet?.weight,
      previousReps: lastSet?.reps,
    };

    workoutCopy.exercises[exIdx].sets = [...currentSets, newSet];
    onUpdateActiveWorkout(workoutCopy);
  };

  const handleRemoveSet = (exIdx: number, setIdx: number) => {
    const workoutCopy = { ...activeWorkout };
    workoutCopy.exercises[exIdx].sets = workoutCopy.exercises[exIdx].sets
      .filter((_, i) => i !== setIdx)
      .map((s, idx) => ({ ...s, setNumber: idx + 1 }));
    onUpdateActiveWorkout(workoutCopy);
  };

  const handleAddExerciseToWorkout = (exercise: Exercise) => {
    const workoutCopy = { ...activeWorkout };
    const newEx: WorkoutExercise = {
      id: `act-we-${Date.now()}`,
      exerciseId: exercise.id,
      exercise: exercise,
      restTimerSeconds: exercise.defaultRestSeconds || 90,
      sets: [
        {
          id: `s-${Date.now()}-1`,
          setNumber: 1,
          type: 'warmup',
          weight: exercise.personalRecord ? Math.round(exercise.personalRecord.maxWeight * 0.5) : 95,
          reps: 10,
          completed: false,
        },
        {
          id: `s-${Date.now()}-2`,
          setNumber: 2,
          type: 'normal',
          weight: exercise.personalRecord ? exercise.personalRecord.maxWeight : 135,
          reps: 8,
          completed: false,
        },
      ],
    };
    workoutCopy.exercises = [...workoutCopy.exercises, newEx];
    onUpdateActiveWorkout(workoutCopy);
  };

  const handleRemoveExercise = (exIdx: number) => {
    const workoutCopy = { ...activeWorkout };
    workoutCopy.exercises = workoutCopy.exercises.filter((_, i) => i !== exIdx);
    onUpdateActiveWorkout(workoutCopy);
  };

  const handleFinish = () => {
    try {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4', '#f59e0b', '#3b82f6'],
      });
    } catch {
      // Ignore if canvas blocked
    }

    if (settings.soundEnabled) {
      soundManager.playPRCelebration();
    }

    // Determine if night session (started after 8 PM or before 5 AM)
    const hour = new Date().getHours();
    const isNight = hour >= 20 || hour < 5;

    // Calculate calories burned estimate: ~6 kcal per minute of intense resistance training
    const minutes = Math.max(1, Math.round(elapsedSeconds / 60));
    const estimatedCalories = Math.round(minutes * 7.8);

    const completedLog: WorkoutLog = {
      ...activeWorkout,
      completedAt: new Date().toISOString(),
      durationSeconds: elapsedSeconds,
      caloriesBurned: estimatedCalories,
      // Heart-rate fields stay undefined: this device has no HR sensor, and
      // fabricating biometric data would pollute the user's health record.
      isNightSession: isNight,
    };

    setSummaryData(completedLog);
    setShowSummary(true);
  };

  const handleConfirmSummarySave = () => {
    if (summaryData) {
      onFinishWorkout(summaryData);
    }
  };

  if (!isOpen) return null;

  // Minimized floating banner at bottom
  if (isMinimized) {
    return (
      <div className="fixed bottom-20 sm:bottom-6 left-4 sm:left-6 z-40 animate-in fade-in">
        <div
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-3 bg-zinc-900 border border-emerald-500/50 rounded-2xl p-3 shadow-2xl cursor-pointer hover:bg-zinc-800 transition text-white"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <Dumbbell className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">{activeWorkout.routineTitle}</span>
              <span className="text-[10px] font-mono-numbers text-emerald-400 font-bold">
                {formatDuration(elapsedSeconds)}
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 font-mono-numbers">
              {activeWorkout.totalSets} sets done • {activeWorkout.totalVolume} {settings.weightUnit}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(false);
            }}
            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-0 sm:p-4 animate-in fade-in">
        <div className="w-full h-full sm:h-auto sm:max-h-[96vh] max-w-4xl flex flex-col rounded-none sm:rounded-3xl bg-zinc-900 border-0 sm:border border-zinc-800 shadow-2xl overflow-hidden">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-3.5 border-b border-zinc-800 bg-zinc-950/95 sticky top-0 z-20">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
                <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight truncate">
                    {activeWorkout.routineTitle}
                  </h3>
                  {new Date().getHours() >= 20 && (
                    <span className="flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-amber-300 shrink-0">
                      <Moon className="w-2.5 h-2.5" />
                      <span className="hidden xs:inline">Night Session</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px] sm:text-xs text-zinc-400 font-mono-numbers">
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    {formatDuration(elapsedSeconds)}
                  </span>
                  <span>•</span>
                  <span className="truncate">
                    <strong className="text-zinc-200">{activeWorkout.totalVolume} {settings.weightUnit}</strong>
                  </span>
                  <span>•</span>
                  <span><strong className="text-zinc-200">{activeWorkout.totalSets}</strong> sets</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={() => setIsMinimized(true)}
                className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                title="Minimize workout"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleFinish}
                className="flex items-center gap-1 sm:gap-1.5 rounded-xl bg-emerald-500 px-3 sm:px-4 py-2 text-xs font-bold text-black hover:bg-emerald-400 active:scale-95 transition shadow-sm"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Finish</span>
              </button>
            </div>
          </div>

          {/* PR Banner Toast */}
          {recentPRAlert && (
            <div className="bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-amber-500/20 border-b border-amber-500/40 px-3 sm:px-4 py-2 text-xs font-bold text-amber-300 flex items-center justify-between animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400 animate-bounce shrink-0" />
                <span className="text-[11px] sm:text-xs truncate">{recentPRAlert}</span>
              </div>
              <button onClick={() => setRecentPRAlert(null)} className="text-zinc-400 hover:text-white ml-2">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Exercises Workout Sheet */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 pb-24 sm:pb-6">
            {activeWorkout.exercises.map((we, exIdx) => {
              const exercisePr = we.exercise.personalRecord;
              return (
                <div
                  key={we.id}
                  className="rounded-2xl bg-zinc-950/80 border border-zinc-800/80 p-3.5 sm:p-5 shadow-sm space-y-3"
                >
                  {/* Exercise Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-lg bg-zinc-800 text-[11px] sm:text-xs font-bold text-emerald-400 font-mono-numbers shrink-0">
                          {exIdx + 1}
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-white">{we.exercise.name}</h4>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium mt-0.5">
                        <span>{we.exercise.category}</span>
                        <span>•</span>
                        <span>{we.exercise.equipment}</span>
                      </div>

                      {exercisePr && (
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-400/90 font-mono-numbers">
                          <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">
                            Best: {exercisePr.maxWeight} {settings.weightUnit} × {exercisePr.maxReps} (1RM: {exercisePr.estimated1RM} {settings.weightUnit})
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Barbell Plate Calculator for barbell exercises */}
                      {we.exercise.equipment === 'Barbell' && (
                        <button
                          onClick={() => {
                            const lastSet = we.sets[we.sets.length - 1];
                            setPlateCalcWeight(lastSet ? lastSet.weight : 225);
                          }}
                          className="flex items-center gap-1 rounded-xl bg-zinc-800 border border-zinc-700 px-2 sm:px-2.5 py-1.5 text-[11px] font-semibold text-zinc-300 hover:text-white"
                          title="Open Barbell Plate Calculator"
                        >
                          <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="hidden xs:inline">Plates</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleRemoveExercise(exIdx)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400"
                        title="Remove exercise from workout"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Mobile Sets Card View (< sm) */}
                  <div className="sm:hidden space-y-2">
                    {we.sets.map((set, setIdx) => {
                      const isComplete = set.completed;
                      const weightStep = settings.weightUnit === 'lbs' ? 5 : 2.5;

                      return (
                        <div
                          key={set.id}
                          className={`rounded-xl p-2.5 border transition ${
                            isComplete
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-zinc-200'
                              : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-800/60">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white font-mono-numbers">
                                Set {set.setNumber}
                              </span>
                              <span className="text-[10px] uppercase font-bold text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-800">
                                {set.type}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              {set.previousWeight && set.previousReps && (
                                <span className="text-[10px] text-zinc-500 font-mono-numbers">
                                  Prev: {set.previousWeight} × {set.previousReps}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveSet(exIdx, setIdx)}
                                disabled={we.sets.length <= 1}
                                className="text-zinc-500 hover:text-rose-400 disabled:opacity-20 p-1"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Stepper Inputs + Large Thumb Checkmark */}
                          <div className="grid grid-cols-12 gap-2 items-center pt-2">
                            {/* Weight Stepper */}
                            <div className="col-span-5 bg-zinc-950 p-1 rounded-xl border border-zinc-800 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateSet(
                                    exIdx,
                                    setIdx,
                                    'weight',
                                    Math.max(0, set.weight - weightStep)
                                  )
                                }
                                className="h-8 w-7 flex items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 font-bold active:bg-zinc-700"
                              >
                                -
                              </button>
                              <div className="text-center font-mono-numbers">
                                <span className="text-xs font-black text-white">{set.weight}</span>
                                <span className="text-[9px] text-zinc-500 block -mt-0.5">
                                  {settings.weightUnit}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateSet(
                                    exIdx,
                                    setIdx,
                                    'weight',
                                    set.weight + weightStep
                                  )
                                }
                                className="h-8 w-7 flex items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 font-bold active:bg-zinc-700"
                              >
                                +
                              </button>
                            </div>

                            {/* Reps Stepper */}
                            <div className="col-span-4 bg-zinc-950 p-1 rounded-xl border border-zinc-800 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateSet(
                                    exIdx,
                                    setIdx,
                                    'reps',
                                    Math.max(0, set.reps - 1)
                                  )
                                }
                                className="h-8 w-7 flex items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 font-bold active:bg-zinc-700"
                              >
                                -
                              </button>
                              <div className="text-center font-mono-numbers">
                                <span className="text-xs font-black text-white">{set.reps}</span>
                                <span className="text-[9px] text-zinc-500 block -mt-0.5">reps</span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateSet(exIdx, setIdx, 'reps', set.reps + 1)
                                }
                                className="h-8 w-7 flex items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 font-bold active:bg-zinc-700"
                              >
                                +
                              </button>
                            </div>

                            {/* Large 44px Done Checkmark Button */}
                            <div className="col-span-3">
                              <button
                                type="button"
                                onClick={() => handleToggleSetComplete(exIdx, setIdx)}
                                className={`w-full h-10 flex items-center justify-center rounded-xl transition active:scale-90 font-bold text-xs ${
                                  isComplete
                                    ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30'
                                    : 'bg-zinc-800 border border-zinc-700 text-zinc-300 active:bg-zinc-700'
                                }`}
                              >
                                <Check className="w-5 h-5 stroke-[3]" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Sets Tracker Table (>= sm) */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-zinc-800/80 text-[10px] uppercase font-bold text-zinc-500">
                          <th className="py-1 px-2 w-12 text-center">Set</th>
                          <th className="py-1 px-2 w-24">Type</th>
                          <th className="py-1 px-2 w-28">Previous</th>
                          <th className="py-1 px-2 w-28">{settings.weightUnit.toUpperCase()}</th>
                          <th className="py-1 px-2 w-24">Reps</th>
                          <th className="py-1 px-2 w-20">RPE</th>
                          <th className="py-1 px-2 w-16 text-center">Done</th>
                          <th className="py-1 px-1 w-8 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/40">
                        {we.sets.map((set, setIdx) => {
                          const isComplete = set.completed;
                          return (
                            <tr
                              key={set.id}
                              className={`transition ${
                                isComplete ? 'bg-emerald-500/5 text-zinc-300' : 'hover:bg-zinc-900/40'
                              }`}
                            >
                              <td className="py-2 px-2 text-center font-bold text-zinc-400 font-mono-numbers">
                                {set.setNumber}
                              </td>

                              <td className="py-2 px-2">
                                <select
                                  value={set.type}
                                  onChange={(e) =>
                                    handleUpdateSet(exIdx, setIdx, 'type', e.target.value as SetType)
                                  }
                                  className="rounded-md bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs text-white"
                                >
                                  <option value="warmup">Warmup</option>
                                  <option value="normal">Normal</option>
                                  <option value="drop">Drop</option>
                                  <option value="failure">Failure</option>
                                </select>
                              </td>

                              <td className="py-2 px-2 font-mono-numbers text-[11px] text-zinc-500">
                                {set.previousWeight && set.previousReps
                                  ? `${set.previousWeight} × ${set.previousReps}`
                                  : '—'}
                              </td>

                              <td className="py-2 px-2">
                                <input
                                  type="number"
                                  value={set.weight}
                                  onChange={(e) =>
                                    handleUpdateSet(exIdx, setIdx, 'weight', Number(e.target.value))
                                  }
                                  className="w-20 rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-xs text-white font-mono-numbers font-bold focus:border-emerald-500 focus:outline-hidden"
                                />
                              </td>

                              <td className="py-2 px-2">
                                <input
                                  type="number"
                                  value={set.reps}
                                  onChange={(e) =>
                                    handleUpdateSet(exIdx, setIdx, 'reps', Number(e.target.value))
                                  }
                                  className="w-16 rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-xs text-white font-mono-numbers font-bold focus:border-emerald-500 focus:outline-hidden"
                                />
                              </td>

                              <td className="py-2 px-2">
                                <select
                                  value={set.rpe || 8}
                                  onChange={(e) =>
                                    handleUpdateSet(exIdx, setIdx, 'rpe', Number(e.target.value))
                                  }
                                  className="rounded-md bg-zinc-900 border border-zinc-800 px-1.5 py-1 text-xs text-zinc-300 font-mono-numbers"
                                >
                                  <option value="6">@6</option>
                                  <option value="7">@7</option>
                                  <option value="8">@8</option>
                                  <option value="9">@9</option>
                                  <option value="10">@10 (Max)</option>
                                </select>
                              </td>

                              <td className="py-2 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleSetComplete(exIdx, setIdx)}
                                  className={`flex h-8 w-8 mx-auto items-center justify-center rounded-xl transition active:scale-90 ${
                                    isComplete
                                      ? 'bg-emerald-500 text-black shadow-sm shadow-emerald-500/40'
                                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                  }`}
                                  title={isComplete ? 'Set Completed' : 'Mark Set Complete'}
                                >
                                  <Check className="w-4 h-4 stroke-[3]" />
                                </button>
                              </td>

                              <td className="py-2 px-1 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSet(exIdx, setIdx)}
                                  disabled={we.sets.length <= 1}
                                  className="text-zinc-600 hover:text-rose-400 disabled:opacity-20"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Add Set Button */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => handleAddSet(exIdx)}
                      className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 p-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Set</span>
                    </button>
                    <span className="text-[11px] text-zinc-500 font-mono-numbers">
                      Rest: {we.restTimerSeconds || 90}s
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Add Exercise to Live Workout */}
            <button
              onClick={() => setIsLibraryOpen(true)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-800 hover:border-emerald-500/50 p-3.5 sm:p-4 text-xs font-bold text-zinc-300 hover:text-emerald-400 transition bg-zinc-950/40 min-h-[48px]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Exercise to This Workout</span>
            </button>
          </div>

          {/* Bottom Action Footer - Sticky on Mobile */}
          <div
            className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-t border-zinc-800 bg-zinc-950/95 sticky bottom-0 z-20"
            style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <button
              onClick={onDiscardWorkout}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition py-2"
            >
              Discard
            </button>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setIsMinimized(true)}
                className="px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Minimize
              </button>
              <button
                onClick={handleFinish}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 sm:px-6 py-2.5 text-xs font-bold text-black hover:bg-emerald-400 active:scale-95 transition shadow-lg shadow-emerald-500/20"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Finish Workout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Rest Timer */}
      <RestTimerFloating
        remainingSeconds={restRemaining}
        totalSeconds={restTotal}
        isActive={isRestActive}
        onAdjustSeconds={handleAdjustRest}
        onSkip={() => {
          setIsRestActive(false);
          setRestRemaining(0);
        }}
        soundEnabled={settings.soundEnabled}
      />

      {/* Plate Calculator Modal */}
      {plateCalcWeight !== null && (
        <PlateCalculatorModal
          isOpen={true}
          onClose={() => setPlateCalcWeight(null)}
          initialWeight={plateCalcWeight}
          unit={settings.weightUnit}
          barWeight={settings.barbellWeight}
        />
      )}

      {/* Exercise Library Modal to pick exercises */}
      <ExerciseLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        exercises={exercises}
        onSelectExercise={handleAddExerciseToWorkout}
        onSaveCustomExercise={onSaveCustomExercise}
        weightUnit={settings.weightUnit}
      />

      {/* Completed Workout Summary & Celebration Dialog */}
      {showSummary && summaryData && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-zinc-900 border border-emerald-500/40 p-6 shadow-2xl space-y-5 text-white">
            <div className="text-center space-y-1">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 mb-2">
                <Trophy className="w-6 h-6 animate-bounce" />
              </div>
              <h3 className="text-xl font-black tracking-tight text-white">Workout Crushed!</h3>
              <p className="text-xs text-zinc-400">
                {summaryData.routineTitle} logged successfully.
              </p>
            </div>

            {/* High-Impact Stat Matrix */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="rounded-xl bg-zinc-950 p-3 text-center border border-zinc-800">
                <div className="text-xs text-zinc-400">Total Volume</div>
                <div className="text-lg font-black font-mono-numbers text-emerald-400 mt-1">
                  {summaryData.totalVolume.toLocaleString()}
                </div>
                <div className="text-[10px] text-zinc-500">{settings.weightUnit}</div>
              </div>

              <div className="rounded-xl bg-zinc-950 p-3 text-center border border-zinc-800">
                <div className="text-xs text-zinc-400">Duration</div>
                <div className="text-lg font-black font-mono-numbers text-white mt-1">
                  {formatDuration(summaryData.durationSeconds)}
                </div>
                <div className="text-[10px] text-zinc-500">Active Time</div>
              </div>

              <div className="rounded-xl bg-zinc-950 p-3 text-center border border-zinc-800">
                <div className="text-xs text-zinc-400">Calories</div>
                <div className="text-lg font-black font-mono-numbers text-rose-400 mt-1">
                  {summaryData.caloriesBurned}
                </div>
                <div className="text-[10px] text-zinc-500">kcal burned</div>
              </div>
            </div>

            {/* Sets & Heart Rate breakdown */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl bg-zinc-950/60 p-3 border border-zinc-800/80 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-zinc-400">Sets & Reps</div>
                  <div className="text-sm font-bold text-white font-mono-numbers">
                    {summaryData.totalSets} sets • {summaryData.totalReps} reps
                  </div>
                </div>
              </div>

              {summaryData.heartRateAvg != null && (
              <div className="rounded-xl bg-zinc-950/60 p-3 border border-zinc-800/80 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                  <Heart className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-zinc-400">Heart Rate</div>
                  <div className="text-sm font-bold text-white font-mono-numbers">
                    {summaryData.heartRateAvg} avg bpm
                  </div>
                </div>
              </div>
              )}
            </div>

            {/* Save & Finish Button */}
            <button
              onClick={handleConfirmSummarySave}
              className="w-full rounded-2xl bg-emerald-500 py-3.5 text-xs font-black uppercase tracking-wider text-black hover:bg-emerald-400 active:scale-95 transition"
            >
              Save Workout & Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
