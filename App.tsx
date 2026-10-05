/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { ActiveWorkoutModal } from './components/ActiveWorkoutModal';
import { CalendarView } from './components/CalendarView';
import { ExerciseLibraryModal } from './components/ExerciseLibraryModal';
import { Header } from './components/Header';
import { HealthSyncView } from './components/HealthSyncView';
import { Navigation, NavTab } from './components/Navigation';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ProgressView } from './components/ProgressView';
import { RoutineBuilderModal } from './components/RoutineBuilderModal';
import { WorkoutPlansView } from './components/WorkoutPlansView';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import {
  AchievementBadge,
  Exercise,
  HealthPlatformSync,
  UserSettings,
  WorkoutLog,
  WorkoutRoutine,
} from './types/workout';
import {
  addToOfflineQueue,
  clearOfflineQueue,
  getOfflineQueue,
  getStoredAchievements,
  getStoredExercises,
  getStoredHealthPlatforms,
  getStoredLogs,
  getStoredRoutines,
  getStoredSettings,
  saveStoredAchievements,
  saveStoredExercises,
  saveStoredHealthPlatforms,
  saveStoredLogs,
  saveStoredRoutines,
  saveStoredSettings,
} from './utils/storage';
import {
  completeStravaOAuth,
  consumeOAuthState,
  setOAuthNotice,
} from './utils/strava';

export default function App() {
  // --- Persistent State ---
  const [settings, setSettings] = useState<UserSettings>(getStoredSettings);
  const [routines, setRoutines] = useState<WorkoutRoutine[]>(getStoredRoutines);
  const [exercises, setExercises] = useState<Exercise[]>(getStoredExercises);
  const [logs, setLogs] = useState<WorkoutLog[]>(getStoredLogs);
  const [achievements, setAchievements] = useState<AchievementBadge[]>(getStoredAchievements);
  const [healthPlatforms, setHealthPlatforms] = useState<HealthPlatformSync[]>(getStoredHealthPlatforms);

  // --- UI Navigation & Modals ---
  const [currentTab, setCurrentTab] = useState<NavTab>('workouts');
  const [activeWorkout, setActiveWorkout] = useState<WorkoutLog | null>(null);
  const [isActiveWorkoutOpen, setIsActiveWorkoutOpen] = useState(false);
  const [isRoutineBuilderOpen, setIsRoutineBuilderOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<WorkoutRoutine | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // --- Offline & Connectivity Hook ---
  const { isOnline, isSimulated } = useOnlineStatus(settings.simulateOffline);

  // Handle OAuth callbacks (e.g. returning from Strava authorization)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    if (!code || !state) return;

    // Clean the URL immediately so a refresh doesn't re-trigger the exchange
    window.history.replaceState({}, '', window.location.pathname);

    (async () => {
      const savedState = consumeOAuthState();
      if (!savedState || savedState !== state) {
        setOAuthNotice(false, 'OAuth was cancelled or the session expired. Please try connecting again.');
        return;
      }
      const provider = state.split('_')[0];
      try {
        if (provider === 'strava') {
          const tokens = await completeStravaOAuth(code);
          const athlete = tokens.athlete
            ? `${tokens.athlete.firstname} ${tokens.athlete.lastname}`.trim()
            : 'your Strava account';
          setHealthPlatforms((prev) => {
            const next = prev.map((p) =>
              p.platform === 'strava'
                ? { ...p, enabled: true, status: 'connected' as const, lastSyncTime: new Date().toISOString() }
                : p
            );
            saveStoredHealthPlatforms(next);
            return next;
          });
          setOAuthNotice(true, `Connected to Strava as ${athlete}. You can now upload workouts.`);
        } else {
          setOAuthNotice(false, 'Unknown OAuth provider returned.');
        }
      } catch (err) {
        setOAuthNotice(false, err instanceof Error ? err.message : 'Strava connection failed.');
      }
    })();
  }, []);

  // Sync settings updates to localStorage
  const handleUpdateSettings = (newSettings: Partial<UserSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    saveStoredSettings(updated);
  };

  // Sync routines
  const handleSaveRoutine = (routine: WorkoutRoutine) => {
    const exists = routines.some((r) => r.id === routine.id);
    const updated = exists
      ? routines.map((r) => (r.id === routine.id ? routine : r))
      : [routine, ...routines];
    setRoutines(updated);
    saveStoredRoutines(updated);
  };

  const handleDeleteRoutine = (routineId: string) => {
    const updated = routines.filter((r) => r.id !== routineId);
    setRoutines(updated);
    saveStoredRoutines(updated);
  };

  const handleDuplicateRoutine = (routine: WorkoutRoutine) => {
    const cloned: WorkoutRoutine = {
      ...routine,
      id: `routine-${Date.now()}`,
      title: `${routine.title} (Copy)`,
      isCustom: true,
      lastPerformed: undefined,
    };
    const updated = [cloned, ...routines];
    setRoutines(updated);
    saveStoredRoutines(updated);
  };

  // Sync custom exercise
  const handleSaveCustomExercise = (exercise: Exercise) => {
    const exists = exercises.some((e) => e.id === exercise.id);
    const updated = exists
      ? exercises.map((e) => (e.id === exercise.id ? exercise : e))
      : [exercise, ...exercises];
    setExercises(updated);
    saveStoredExercises(updated);
  };

  // Mark a workout log as synced to a real platform (e.g. after Strava upload)
  const handleLogSynced = (logId: string, platform: string) => {
    const updated = logs.map((l) =>
      l.id === logId
        ? { ...l, syncedPlatforms: Array.from(new Set([...(l.syncedPlatforms || []), platform])) }
        : l
    );
    setLogs(updated);
    saveStoredLogs(updated);
  };

  // --- Active Workout Logic ---
  const handleStartRoutine = (routine: WorkoutRoutine) => {    // Clone routine exercises into live workout session
    const clonedExercises = routine.exercises.map((re) => ({
      ...re,
      id: `act-${Date.now()}-${re.exerciseId}`,
      sets: re.sets.map((s, idx) => ({
        ...s,
        id: `act-set-${Date.now()}-${idx}`,
        completed: false,
        previousWeight: s.weight,
        previousReps: s.reps,
      })),
    }));

    const newLiveWorkout: WorkoutLog = {
      id: `workout-${Date.now()}`,
      routineId: routine.id,
      routineTitle: routine.title,
      startedAt: new Date().toISOString(),
      durationSeconds: 0,
      exercises: clonedExercises,
      totalVolume: 0,
      totalReps: 0,
      totalSets: 0,
      syncedPlatforms: [],
    };

    setActiveWorkout(newLiveWorkout);
    setIsActiveWorkoutOpen(true);
  };

  const handleStartEmptyWorkout = () => {
    const newLiveWorkout: WorkoutLog = {
      id: `workout-${Date.now()}`,
      routineTitle: 'Freestyle Workout',
      startedAt: new Date().toISOString(),
      durationSeconds: 0,
      exercises: [],
      totalVolume: 0,
      totalReps: 0,
      totalSets: 0,
      syncedPlatforms: [],
    };

    setActiveWorkout(newLiveWorkout);
    setIsActiveWorkoutOpen(true);
  };

  const handleFinishWorkout = (finishedLog: WorkoutLog) => {
    const updatedLogs = [finishedLog, ...logs];
    setLogs(updatedLogs);
    saveStoredLogs(updatedLogs);

    // Update routines' lastPerformed timestamp
    if (finishedLog.routineId) {
      const updatedRoutines = routines.map((r) =>
        r.id === finishedLog.routineId ? { ...r, lastPerformed: finishedLog.completedAt } : r
      );
      setRoutines(updatedRoutines);
      saveStoredRoutines(updatedRoutines);
    }

    // Check & update personal records in exercises catalog
    const updatedExercises = [...exercises];
    finishedLog.exercises.forEach((we) => {
      const completedSets = we.sets.filter((s) => s.completed);
      if (completedSets.length === 0) return;

      const maxWeight = Math.max(...completedSets.map((s) => s.weight));
      const bestSet = completedSets.find((s) => s.weight === maxWeight);
      const est1RM = bestSet ? Math.round(bestSet.weight / (1.0278 - 0.0278 * Math.min(bestSet.reps, 30))) : maxWeight;

      const exIndex = updatedExercises.findIndex((e) => e.id === we.exerciseId);
      if (exIndex !== -1) {
        const currentPr = updatedExercises[exIndex].personalRecord;
        if (!currentPr || maxWeight > currentPr.maxWeight || est1RM > currentPr.estimated1RM) {
          updatedExercises[exIndex] = {
            ...updatedExercises[exIndex],
            personalRecord: {
              maxWeight,
              maxReps: bestSet?.reps || 1,
              estimated1RM: est1RM,
              achievedAt: finishedLog.completedAt || new Date().toISOString(),
            },
          };
        }
      }
    });
    setExercises(updatedExercises);
    saveStoredExercises(updatedExercises);

    // If offline, add to offline sync queue for health & community
    if (!isOnline) {
      addToOfflineQueue({
        type: 'SAVE_WORKOUT_LOG',
        payload: finishedLog,
      });
    }

    setActiveWorkout(null);
    setIsActiveWorkoutOpen(false);
  };

  const handleDiscardWorkout = () => {
    if (window.confirm('Are you sure you want to discard this in-progress workout?')) {
      setActiveWorkout(null);
      setIsActiveWorkoutOpen(false);
    }
  };

  // Process offline sync queue when reconnected
  const handleSyncOfflineQueue = () => {
    const queue = getOfflineQueue();
    if (queue.length > 0) {
      // All items synced
      clearOfflineQueue();
    }
  };

  // Determine background styling based on theme
  const getThemeClass = () => {
    switch (settings.theme) {
      case 'obsidian':
        return 'bg-[#09090b] text-zinc-100';
      case 'electric':
        return 'bg-[#030712] text-zinc-100';
      case 'crimson':
        return 'bg-[#090405] text-zinc-100';
      case 'light':
        return 'bg-zinc-100 text-zinc-900';
      case 'midnight':
      default:
        return 'bg-zinc-950 text-zinc-100';
    }
  };

  return (
    <div
      className={`min-h-screen ${getThemeClass()} transition-colors duration-200 ${
        settings.nightVisionMode ? 'brightness-95 contrast-105' : ''
      }`}
    >
      {/* Night Vision Red-Shift Filter Overlay */}
      {settings.nightVisionMode && (
        <div className="fixed inset-0 pointer-events-none z-50 mix-blend-color bg-rose-900/35 transition-opacity duration-300" />
      )}

      {/* Header */}
      <Header
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        isOnline={isOnline}
        activeWorkout={activeWorkout}
        onOpenActiveWorkout={() => setIsActiveWorkoutOpen(true)}
      />

      {/* Navigation */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        prCountBadge={exercises.filter((e) => e.personalRecord).length}
      />

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-3 sm:px-6 py-6 pb-28 sm:pb-12">
        {currentTab === 'workouts' && (
          <WorkoutPlansView
            routines={routines}
            onStartRoutine={handleStartRoutine}
            onStartEmptyWorkout={handleStartEmptyWorkout}
            onOpenRoutineBuilder={(routine) => {
              setEditingRoutine(routine || null);
              setIsRoutineBuilderOpen(true);
            }}
            onDeleteRoutine={handleDeleteRoutine}
            onDuplicateRoutine={handleDuplicateRoutine}
            onOpenExerciseLibrary={() => setIsLibraryOpen(true)}
            settings={settings}
          />
        )}

        {currentTab === 'calendar' && (
          <CalendarView
            logs={logs}
            routines={routines}
            onStartRoutine={handleStartRoutine}
            settings={settings}
          />
        )}

        {currentTab === 'progress' && (
          <ProgressView
            logs={logs}
            exercises={exercises}
            settings={settings}
          />
        )}

        {currentTab === 'health' && (
          <HealthSyncView
            platforms={healthPlatforms}
            onUpdatePlatforms={(platforms) => {
              setHealthPlatforms(platforms);
              saveStoredHealthPlatforms(platforms);
            }}
            logs={logs}
            isOnline={isOnline}
            settings={settings}
            onLogSynced={handleLogSynced}
          />
        )}
      </main>

      {/* Floating Offline Notification & Sync Counter */}
      <OfflineIndicator
        isOnline={isOnline}
        isSimulated={isSimulated}
        onSyncQueue={handleSyncOfflineQueue}
      />

      {/* Live Active Workout Player Modal */}
      {activeWorkout && (
        <ActiveWorkoutModal
          isOpen={isActiveWorkoutOpen}
          onClose={() => setIsActiveWorkoutOpen(false)}
          activeWorkout={activeWorkout}
          onUpdateActiveWorkout={(w) => setActiveWorkout(w)}
          onFinishWorkout={handleFinishWorkout}
          onDiscardWorkout={handleDiscardWorkout}
          exercises={exercises}
          onSaveCustomExercise={handleSaveCustomExercise}
          settings={settings}
        />
      )}

      {/* Routine Plan Builder Modal */}
      {isRoutineBuilderOpen && (
        <RoutineBuilderModal
          isOpen={isRoutineBuilderOpen}
          onClose={() => {
            setIsRoutineBuilderOpen(false);
            setEditingRoutine(null);
          }}
          onSaveRoutine={handleSaveRoutine}
          existingRoutine={editingRoutine}
          exercises={exercises}
          onSaveCustomExercise={handleSaveCustomExercise}
          weightUnit={settings.weightUnit}
        />
      )}

      {/* Standalone Exercise Library Modal */}
      <ExerciseLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        exercises={exercises}
        onSaveCustomExercise={handleSaveCustomExercise}
        weightUnit={settings.weightUnit}
      />
    </div>
  );
}
