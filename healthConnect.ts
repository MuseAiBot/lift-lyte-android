import { Capacitor } from '@capacitor/core';
import { LiftlyteHealthConnect } from 'liftlyte-health-connect';

import type { WorkoutLog } from '../types/workout';

/** True when running inside the native Capacitor shell (Android app). */
export const isNativeApp = (): boolean => Capacitor.isNativePlatform();

/** True when the native Health Connect bridge can be used on this device. */
export async function isHealthConnectAvailable(): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    const { available } = await LiftlyteHealthConnect.isAvailable();
    return available;
  } catch {
    return false;
  }
}

/** Silent check — true when the user already granted the exercise permissions. */
export async function hasHealthConnectPermissions(): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    const { granted } = await LiftlyteHealthConnect.checkExercisePermissions();
    return granted;
  } catch {
    return false;
  }
}

/** Shows the Health Connect permission dialog. */
export async function requestHealthConnectPermissions(): Promise<boolean> {
  const { granted } = await LiftlyteHealthConnect.requestExercisePermissions();
  return granted;
}

function estimateCalories(log: WorkoutLog): number {
  if (log.caloriesBurned && log.caloriesBurned > 0) return Math.round(log.caloriesBurned);
  const minutes = Math.max(1, (log.durationSeconds || 1800) / 60);
  return Math.round(minutes * 5);
}

function buildNotes(log: WorkoutLog): string {
  const lines = log.exercises.slice(0, 8).map((ex) => {
    const sets = ex.sets.length;
    const top = ex.sets[0];
    const weight = top?.weight ? ` @ ${top.weight} lb` : '';
    return `${ex.exercise.name}: ${sets} sets${weight}`;
  });
  let notes = lines.join('; ');
  if (log.exercises.length > 8) notes += `; +${log.exercises.length - 8} more`;
  notes += ` | ${log.totalSets} sets, ${log.totalReps} reps, ${Math.round(log.totalVolume).toLocaleString()} lb volume`;
  return notes.slice(0, 900);
}

/**
 * Writes a finished workout to Health Connect as a strength-training session.
 * Returns the Health Connect record id. The log id is used as the client record
 * id so retries don't create duplicates.
 */
export async function writeWorkoutToHealthConnect(log: WorkoutLog): Promise<string> {
  const startTime = new Date(log.startedAt).toISOString();
  const endTime = log.completedAt
    ? new Date(log.completedAt).toISOString()
    : new Date(new Date(log.startedAt).getTime() + (log.durationSeconds || 0) * 1000).toISOString();
  const { id } = await LiftlyteHealthConnect.writeWorkout({
    title: log.routineTitle || 'Lift Lyte Workout',
    notes: buildNotes(log),
    startTime,
    endTime,
    caloriesKcal: estimateCalories(log),
    clientRecordId: `lift-lyte-${log.id}`,
  });
  return id;
}
