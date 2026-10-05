import React, { useState } from 'react';
import {
  Check,
  Dumbbell,
  Filter,
  Plus,
  Search,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import { EquipmentType, Exercise, MuscleGroup } from '../types/workout';

interface ExerciseLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercises: Exercise[];
  onSelectExercise?: (exercise: Exercise) => void;
  onSaveCustomExercise: (exercise: Exercise) => void;
  weightUnit?: 'lbs' | 'kg';
}

const MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Core',
  'Full Body',
  'Cardio',
];

const EQUIPMENT_TYPES: EquipmentType[] = [
  'Barbell',
  'Dumbbell',
  'Cable',
  'Machine',
  'Bodyweight',
  'Kettlebell',
  'Resistance Band',
  'Smith Machine',
];

export const ExerciseLibraryModal: React.FC<ExerciseLibraryModalProps> = ({
  isOpen,
  onClose,
  exercises,
  onSelectExercise,
  onSaveCustomExercise,
  weightUnit = 'lbs',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('All');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('All');
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);

  // New Exercise Form State
  const [newExName, setNewExName] = useState('');
  const [newExCategory, setNewExCategory] = useState<MuscleGroup>('Chest');
  const [newExEquipment, setNewExEquipment] = useState<EquipmentType>('Barbell');
  const [newExRest, setNewExRest] = useState(90);
  const [newExNotes, setNewExNotes] = useState('');

  if (!isOpen) return null;

  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch =
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.equipment.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscle = selectedMuscle === 'All' || ex.category === selectedMuscle;
    const matchesEquipment = selectedEquipment === 'All' || ex.equipment === selectedEquipment;
    return matchesSearch && matchesMuscle && matchesEquipment;
  });

  const handleCreateExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExName.trim()) return;

    const newExercise: Exercise = {
      id: `custom-ex-${Date.now()}`,
      name: newExName.trim(),
      category: newExCategory,
      equipment: newExEquipment,
      defaultRestSeconds: newExRest,
      notes: newExNotes.trim() || undefined,
      isCustom: true,
    };

    onSaveCustomExercise(newExercise);
    setIsCreatingCustom(false);
    setNewExName('');
    setNewExNotes('');
    if (onSelectExercise) {
      onSelectExercise(newExercise);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-xs p-0 sm:p-5 animate-in fade-in">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-zinc-900 border-t sm:border border-zinc-800 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-zinc-800 bg-zinc-950/95 sticky top-0 z-10">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-emerald-400" />
              <span>{isCreatingCustom ? 'Create Custom Exercise' : 'Exercise Catalog & PRs'}</span>
            </h3>
            <p className="text-xs text-zinc-400">
              {isCreatingCustom
                ? 'Design a custom exercise tailored to your gym equipment'
                : 'Browse exercises, monitor personal records, or add to your workout'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isCreatingCustom && (
              <button
                onClick={() => setIsCreatingCustom(true)}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Custom Exercise</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Create Custom Exercise Form */}
        {isCreatingCustom ? (
          <form onSubmit={handleCreateExercise} className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Exercise Name *
              </label>
              <input
                type="text"
                required
                value={newExName}
                onChange={(e) => setNewExName(e.target.value)}
                placeholder="e.g. Bulgarian Split Squat, Neutral Grip Pull-Up..."
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Primary Muscle Group
                </label>
                <select
                  value={newExCategory}
                  onChange={(e) => setNewExCategory(e.target.value as MuscleGroup)}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-hidden"
                >
                  {MUSCLE_GROUPS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Equipment Type
                </label>
                <select
                  value={newExEquipment}
                  onChange={(e) => setNewExEquipment(e.target.value as EquipmentType)}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-hidden"
                >
                  {EQUIPMENT_TYPES.map((eq) => (
                    <option key={eq} value={eq}>
                      {eq}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Default Rest Timer: <span className="text-emerald-400 font-mono-numbers">{newExRest}s</span>
              </label>
              <div className="flex gap-2">
                {[45, 60, 90, 120, 180].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setNewExRest(sec)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition font-mono-numbers ${
                      newExRest === sec
                        ? 'bg-emerald-500 text-black'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Form Cues / Notes (Optional)
              </label>
              <textarea
                value={newExNotes}
                onChange={(e) => setNewExNotes(e.target.value)}
                placeholder="e.g. Keep chest high, pause 1 second at full stretch..."
                rows={2}
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-hidden resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsCreatingCustom(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-black hover:bg-emerald-400 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Save Exercise</span>
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* Search and Filters */}
            <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/40 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search exercise name, muscle, equipment..."
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-800 pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Muscle Pills Carousel */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                <button
                  onClick={() => setSelectedMuscle('All')}
                  className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    selectedMuscle === 'All'
                      ? 'bg-emerald-500 text-black'
                      : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  All Muscles
                </button>
                {MUSCLE_GROUPS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMuscle(m)}
                    className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      selectedMuscle === m
                        ? 'bg-emerald-500 text-black'
                        : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Exercise List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-zinc-800/40">
              {filteredExercises.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-xs">
                  No exercises matched your search. Click "Custom Exercise" above to create one!
                </div>
              ) : (
                filteredExercises.map((exercise) => (
                  <div
                    key={exercise.id}
                    className="pt-2.5 first:pt-0 flex items-center justify-between group hover:bg-zinc-800/40 p-2.5 rounded-xl transition"
                  >
                    <div className="space-y-1 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition">
                          {exercise.name}
                        </span>
                        {exercise.isCustom && (
                          <span className="rounded-md bg-purple-500/10 border border-purple-500/30 px-1.5 py-0.5 text-[10px] font-bold text-purple-300">
                            Custom
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
                        <span className="font-semibold text-zinc-300">{exercise.category}</span>
                        <span>•</span>
                        <span>{exercise.equipment}</span>
                        <span>•</span>
                        <span>Rest: {exercise.defaultRestSeconds}s</span>
                      </div>

                      {/* Personal Record Badge */}
                      {exercise.personalRecord && (
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-amber-400 font-mono-numbers">
                          <Trophy className="w-3 h-3 text-amber-400" />
                          <span>
                            PR: {exercise.personalRecord.maxWeight} {weightUnit} ×{' '}
                            {exercise.personalRecord.maxReps} reps (Est. 1RM:{' '}
                            {exercise.personalRecord.estimated1RM} {weightUnit})
                          </span>
                        </div>
                      )}
                    </div>

                    {onSelectExercise ? (
                      <button
                        onClick={() => {
                          onSelectExercise(exercise);
                          onClose();
                        }}
                        className="flex items-center gap-1 shrink-0 rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-black hover:bg-emerald-400 active:scale-95 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    ) : (
                      <div className="shrink-0 text-zinc-500 text-xs font-medium">
                        {exercise.personalRecord ? (
                          <span className="text-emerald-400 text-[11px] font-mono-numbers font-bold">
                            Active PR
                          </span>
                        ) : (
                          <span className="text-zinc-600 text-[11px]">No PR yet</span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
