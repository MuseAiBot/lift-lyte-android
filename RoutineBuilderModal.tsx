import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Dumbbell,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import {
  Exercise,
  SetType,
  WorkoutExercise,
  WorkoutRoutine,
  WorkoutSet,
} from '../types/workout';
import { ExerciseLibraryModal } from './ExerciseLibraryModal';

interface RoutineBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRoutine: (routine: WorkoutRoutine) => void;
  existingRoutine?: WorkoutRoutine | null;
  exercises: Exercise[];
  onSaveCustomExercise: (exercise: Exercise) => void;
  weightUnit?: 'lbs' | 'kg';
}

export const RoutineBuilderModal: React.FC<RoutineBuilderModalProps> = ({
  isOpen,
  onClose,
  onSaveRoutine,
  existingRoutine,
  exercises,
  onSaveCustomExercise,
  weightUnit = 'lbs',
}) => {
  const [title, setTitle] = useState(existingRoutine?.title || '');
  const [description, setDescription] = useState(existingRoutine?.description || '');
  const [category, setCategory] = useState(existingRoutine?.category || 'Strength & Hypertrophy');
  const [targetDays, setTargetDays] = useState(existingRoutine?.targetDaysPerWeek || 2);
  const [estimatedMinutes, setEstimatedMinutes] = useState(existingRoutine?.estimatedMinutes || 60);
  const [color, setColor] = useState(existingRoutine?.color || '#10b981');
  const [routineExercises, setRoutineExercises] = useState<WorkoutExercise[]>(
    existingRoutine?.exercises || []
  );

  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  if (!isOpen) return null;

  const handleAddExerciseFromLibrary = (exercise: Exercise) => {
    const newRoutineExercise: WorkoutExercise = {
      id: `re-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      exerciseId: exercise.id,
      exercise: exercise,
      restTimerSeconds: exercise.defaultRestSeconds || 90,
      notes: exercise.notes || '',
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
        {
          id: `s-${Date.now()}-3`,
          setNumber: 3,
          type: 'normal',
          weight: exercise.personalRecord ? exercise.personalRecord.maxWeight : 135,
          reps: 8,
          completed: false,
        },
      ],
    };

    setRoutineExercises((prev) => [...prev, newRoutineExercise]);
  };

  const handleRemoveExercise = (index: number) => {
    setRoutineExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= routineExercises.length) return;
    const copy = [...routineExercises];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setRoutineExercises(copy);
  };

  const handleAddSet = (exerciseIndex: number) => {
    const copy = [...routineExercises];
    const currentSets = copy[exerciseIndex].sets;
    const lastSet = currentSets[currentSets.length - 1];
    const newSet: WorkoutSet = {
      id: `s-${Date.now()}-${currentSets.length + 1}`,
      setNumber: currentSets.length + 1,
      type: 'normal',
      weight: lastSet ? lastSet.weight : 135,
      reps: lastSet ? lastSet.reps : 8,
      completed: false,
    };
    copy[exerciseIndex].sets = [...currentSets, newSet];
    setRoutineExercises(copy);
  };

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    const copy = [...routineExercises];
    copy[exerciseIndex].sets = copy[exerciseIndex].sets
      .filter((_, i) => i !== setIndex)
      .map((s, idx) => ({ ...s, setNumber: idx + 1 }));
    setRoutineExercises(copy);
  };

  const handleUpdateSet = (
    exerciseIndex: number,
    setIndex: number,
    field: keyof WorkoutSet,
    val: unknown
  ) => {
    const copy = [...routineExercises];
    copy[exerciseIndex].sets[setIndex] = {
      ...copy[exerciseIndex].sets[setIndex],
      [field]: val,
    };
    setRoutineExercises(copy);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newRoutine: WorkoutRoutine = {
      id: existingRoutine?.id || `routine-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || 'Custom workout routine',
      category: category.trim(),
      targetDaysPerWeek: Number(targetDays) || 2,
      estimatedMinutes: Number(estimatedMinutes) || 60,
      color,
      exercises: routineExercises,
      isCustom: true,
      lastPerformed: existingRoutine?.lastPerformed,
    };

    onSaveRoutine(newRoutine);
    onClose();
  };

  const themeColors = ['#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444'];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-xs p-0 sm:p-5 animate-in fade-in">
        <div className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-zinc-900 border-t sm:border border-zinc-800 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-zinc-800 bg-zinc-950/95 sticky top-0 z-10">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-emerald-400" />
                <span>{existingRoutine ? 'Customize Routine Plan' : 'Build Custom Routine Plan'}</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Customize every exercise, target sets, reps, and rest intervals
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* Basic Routine Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Routine Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Upper Body Hypertrophy, Night Owl Deadlift Day..."
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Category / Focus
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Strength & Hypertrophy, Push, Lower Body..."
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Target Days / Wk
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={7}
                    value={targetDays}
                    onChange={(e) => setTargetDays(Number(e.target.value))}
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm text-white font-mono-numbers focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Est. Duration (min)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={240}
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm text-white font-mono-numbers focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Routine Description / Training Strategy
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary of intensity, target RPE, or progression scheme..."
                  rows={2}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-hidden resize-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Badge Color
                </label>
                <div className="flex gap-2">
                  {themeColors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-7 w-7 rounded-full border-2 transition ${
                        color === c ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Exercise List */}
            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    Routine Exercises ({routineExercises.length})
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Add exercises and customize reps, sets, and rest time
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLibraryOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-black hover:bg-emerald-400 active:scale-95 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Exercise</span>
                </button>
              </div>

              {routineExercises.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center bg-zinc-950/40">
                  <Dumbbell className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-zinc-400">No exercises added yet.</p>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Click "Add Exercise" to choose from 20+ preset exercises or create your own.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {routineExercises.map((re, exIdx) => (
                    <div
                      key={re.id}
                      className="rounded-xl bg-zinc-950 border border-zinc-800/80 p-4 space-y-3"
                    >
                      {/* Exercise Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold text-emerald-400">
                            {exIdx + 1}
                          </span>
                          <div>
                            <span className="text-sm font-bold text-white">{re.exercise.name}</span>
                            <span className="ml-2 text-xs text-zinc-400 font-medium">
                              ({re.exercise.category} • {re.exercise.equipment})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveExercise(exIdx, 'up')}
                            disabled={exIdx === 0}
                            className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 disabled:opacity-30"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveExercise(exIdx, 'down')}
                            disabled={exIdx === routineExercises.length - 1}
                            className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 disabled:opacity-30"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveExercise(exIdx)}
                            className="p-1 rounded-md text-rose-400 hover:bg-rose-950/40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Rest Timer Setting */}
                      <div className="flex items-center gap-3 text-xs text-zinc-400">
                        <span>Rest Timer:</span>
                        <input
                          type="number"
                          value={re.restTimerSeconds || 90}
                          onChange={(e) => {
                            const copy = [...routineExercises];
                            copy[exIdx].restTimerSeconds = Number(e.target.value);
                            setRoutineExercises(copy);
                          }}
                          className="w-16 rounded-md bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-xs text-white font-mono-numbers text-center"
                        />
                        <span>seconds</span>
                      </div>

                      {/* Sets Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-zinc-800/80 text-[10px] uppercase font-bold text-zinc-500">
                              <th className="py-1 px-2 w-12">Set</th>
                              <th className="py-1 px-2 w-28">Type</th>
                              <th className="py-1 px-2 w-28">Target ({weightUnit})</th>
                              <th className="py-1 px-2 w-24">Target Reps</th>
                              <th className="py-1 px-2 w-12 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/40">
                            {re.sets.map((set, sIdx) => (
                              <tr key={set.id} className="hover:bg-zinc-900/40">
                                <td className="py-1.5 px-2 font-bold text-zinc-400 font-mono-numbers">
                                  {set.setNumber}
                                </td>
                                <td className="py-1.5 px-2">
                                  <select
                                    value={set.type}
                                    onChange={(e) =>
                                      handleUpdateSet(exIdx, sIdx, 'type', e.target.value as SetType)
                                    }
                                    className="rounded-md bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs text-white"
                                  >
                                    <option value="warmup">Warm-up</option>
                                    <option value="normal">Normal</option>
                                    <option value="drop">Drop Set</option>
                                    <option value="failure">To Failure</option>
                                  </select>
                                </td>
                                <td className="py-1.5 px-2">
                                  <input
                                    type="number"
                                    value={set.weight}
                                    onChange={(e) =>
                                      handleUpdateSet(exIdx, sIdx, 'weight', Number(e.target.value))
                                    }
                                    className="w-20 rounded-md bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs text-white font-mono-numbers"
                                  />
                                </td>
                                <td className="py-1.5 px-2">
                                  <input
                                    type="number"
                                    value={set.reps}
                                    onChange={(e) =>
                                      handleUpdateSet(exIdx, sIdx, 'reps', Number(e.target.value))
                                    }
                                    className="w-16 rounded-md bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs text-white font-mono-numbers"
                                  />
                                </td>
                                <td className="py-1.5 px-2 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSet(exIdx, sIdx)}
                                    disabled={re.sets.length <= 1}
                                    className="text-zinc-500 hover:text-rose-400 disabled:opacity-20"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddSet(exIdx)}
                        className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Set</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={routineExercises.length === 0}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-black hover:bg-emerald-400 disabled:opacity-40 transition active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Save Routine Plan</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Embedded Exercise Library Modal for selecting exercises */}
      <ExerciseLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        exercises={exercises}
        onSelectExercise={handleAddExerciseFromLibrary}
        onSaveCustomExercise={onSaveCustomExercise}
        weightUnit={weightUnit}
      />
    </>
  );
};
