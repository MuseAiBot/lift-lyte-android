import {
  AchievementBadge,
  Exercise,
  HealthPlatformSync,
  UserSettings,
  WorkoutLog,
  WorkoutRoutine,
} from '../types/workout';
import {
  INITIAL_ACHIEVEMENTS,
  INITIAL_EXERCISES,
  INITIAL_HEALTH_PLATFORMS,
  INITIAL_ROUTINES,
  INITIAL_WORKOUT_LOGS,
} from './defaultData';

const KEYS = {
  ROUTINES: 'liftlyte_workouts_routines',
  EXERCISES: 'liftlyte_workouts_exercises',
  LOGS: 'liftlyte_workouts_logs',
  ACHIEVEMENTS: 'liftlyte_workouts_achievements',
  HEALTH: 'liftlyte_workouts_health_platforms_v2',
  SETTINGS: 'liftlyte_workouts_settings',
  OFFLINE_QUEUE: 'liftlyte_offline_sync_queue',
  SCHEMA_VERSION: 'liftlyte_schema_version',
};

/**
 * Bump this when the shape or seed content of stored data changes.
 * migrateStorageIfNeeded() clears stale seeded data on version change.
 */
export const CURRENT_SCHEMA_VERSION = 3;

/**
 * One-time migrations for browsers holding stale data. Safe to call on every
 * app start. Preserves user routines, logs, settings — only resets seeded
 * demo content.
 */
export function migrateStorageIfNeeded() {
  try {
    const raw = localStorage.getItem(KEYS.SCHEMA_VERSION);
    const storedVersion = raw ? parseInt(raw, 10) : 1;
    if (storedVersion < 2) {
      // v2: strip demo PR seed data — reset exercises to PR-free catalog, clear demo achievements
      localStorage.setItem(KEYS.EXERCISES, JSON.stringify(INITIAL_EXERCISES));
      localStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(INITIAL_ACHIEVEMENTS));
    }
    if (storedVersion < 3) {
      // v3: replace fake "connected" health platforms with honest defaults
      // (all disconnected; the old connected states were simulated)
      localStorage.setItem(KEYS.HEALTH, JSON.stringify(INITIAL_HEALTH_PLATFORMS));
    }
    if (storedVersion < CURRENT_SCHEMA_VERSION) {
      localStorage.setItem(KEYS.SCHEMA_VERSION, String(CURRENT_SCHEMA_VERSION));
    }
  } catch {
    // Storage unavailable — getters already fall back to clean defaults
  }
}

export const DEFAULT_SETTINGS: UserSettings = {
  weightUnit: 'lbs',
  theme: 'midnight',
  nightVisionMode: false,
  soundEnabled: true,
  vibrationEnabled: true,
  defaultRestTime: 90,
  barbellWeight: 45,
  simulateOffline: false,
};

// --- Storage API with Safe Fallbacks ---

export function getStoredRoutines(): WorkoutRoutine[] {
  try {
    const data = localStorage.getItem(KEYS.ROUTINES);
    if (!data) return [];
    const parsed = JSON.parse(data);
    // Keep only custom workouts created by the user
    return Array.isArray(parsed) ? parsed.filter((r) => r.isCustom) : [];
  } catch {
    return [];
  }
}

export function saveStoredRoutines(routines: WorkoutRoutine[]) {
  try {
    localStorage.setItem(KEYS.ROUTINES, JSON.stringify(routines));
  } catch (err) {
    console.error('Failed to save routines to localStorage', err);
  }
}

export function getStoredExercises(): Exercise[] {
  try {
    const data = localStorage.getItem(KEYS.EXERCISES);
    return data ? JSON.parse(data) : INITIAL_EXERCISES;
  } catch {
    return INITIAL_EXERCISES;
  }
}

export function saveStoredExercises(exercises: Exercise[]) {
  try {
    localStorage.setItem(KEYS.EXERCISES, JSON.stringify(exercises));
  } catch (err) {
    console.error('Failed to save exercises to localStorage', err);
  }
}

export function getStoredLogs(): WorkoutLog[] {
  try {
    const data = localStorage.getItem(KEYS.LOGS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveStoredLogs(logs: WorkoutLog[]) {
  try {
    localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
  } catch (err) {
    console.error('Failed to save logs to localStorage', err);
  }
}

export function getStoredAchievements(): AchievementBadge[] {
  try {
    const data = localStorage.getItem(KEYS.ACHIEVEMENTS);
    return data ? JSON.parse(data) : INITIAL_ACHIEVEMENTS;
  } catch {
    return INITIAL_ACHIEVEMENTS;
  }
}

export function saveStoredAchievements(achievements: AchievementBadge[]) {
  try {
    localStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
  } catch (err) {
    console.error('Failed to save achievements', err);
  }
}

export function getStoredHealthPlatforms(): HealthPlatformSync[] {
  try {
    const data = localStorage.getItem(KEYS.HEALTH);
    const platforms: HealthPlatformSync[] = data ? JSON.parse(data) : INITIAL_HEALTH_PLATFORMS;
    // Ensure Samsung Health is always included in the list
    const hasSamsung = platforms.some((p) => p.platform === 'samsung_health');
    if (!hasSamsung) {
      const samsungEntry = INITIAL_HEALTH_PLATFORMS.find((p) => p.platform === 'samsung_health');
      if (samsungEntry) {
        return [samsungEntry, ...platforms];
      }
    }
    return platforms;
  } catch {
    return INITIAL_HEALTH_PLATFORMS;
  }
}

export function saveStoredHealthPlatforms(platforms: HealthPlatformSync[]) {
  try {
    localStorage.setItem(KEYS.HEALTH, JSON.stringify(platforms));
  } catch (err) {
    console.error('Failed to save health platforms', err);
  }
}

export function getStoredSettings(): UserSettings {
  try {
    const data = localStorage.getItem(KEYS.SETTINGS);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: UserSettings) {
  try {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings', err);
  }
}

// --- Offline Queue Handling ---

export interface OfflineAction {
  id: string;
  type: 'SAVE_WORKOUT_LOG' | 'SYNC_HEALTH' | 'POST_COMMUNITY' | 'UPDATE_PR';
  payload: unknown;
  timestamp: string;
}

export function getOfflineQueue(): OfflineAction[] {
  try {
    const data = localStorage.getItem(KEYS.OFFLINE_QUEUE);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addToOfflineQueue(action: Omit<OfflineAction, 'id' | 'timestamp'>) {
  const queue = getOfflineQueue();
  const newAction: OfflineAction = {
    ...action,
    id: `queue-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
  };
  queue.push(newAction);
  try {
    localStorage.setItem(KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
  } catch {
    // Ignore
  }
  return newAction;
}

export function clearOfflineQueue() {
  try {
    localStorage.removeItem(KEYS.OFFLINE_QUEUE);
  } catch {
    // Ignore
  }
}

// --- Calculations & Utility Functions ---

/**
 * Calculates Estimated 1RM using Brzycki formula.
 * 1RM = Weight / (1.0278 - (0.0278 * Reps))
 */
export function calculate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  const estimate = weight / (1.0278 - 0.0278 * Math.min(reps, 30));
  return Math.round(estimate);
}

/**
 * Calculates standard gym barbell plates needed for each side of the bar.
 * Standard Olympic bar is 45 lbs (or 20 kg).
 */
export function calculateBarbellPlates(
  targetWeight: number,
  barWeight: number = 45,
  unit: 'lbs' | 'kg' = 'lbs'
): { plate: number; count: number }[] {
  const plates = unit === 'lbs' ? [45, 35, 25, 10, 5, 2.5] : [25, 20, 15, 10, 5, 2.5, 1.25];
  let remainingPerSide = Math.max(0, (targetWeight - barWeight) / 2);
  const result: { plate: number; count: number }[] = [];

  for (const plate of plates) {
    if (remainingPerSide >= plate) {
      const count = Math.floor(remainingPerSide / plate);
      result.push({ plate, count });
      remainingPerSide -= count * plate;
    }
  }

  return result;
}

/**
 * Format duration in seconds into 'Xm Ys' or 'Xh Ym'
 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}h ${m}m`;
  }
  return `${m}m ${s > 0 ? `${s}s` : ''}`.trim();
}

import { buildTcxForWorkout } from './tcx';

/**
 * Generates an Apple Health / Google Fit export string (XML / JSON)
 */
export function generateHealthExport(
  logs: WorkoutLog[],
  format: 'json' | 'csv' | 'apple_xml' | 'samsung_json' | 'tcx',
  weightUnit: 'lbs' | 'kg' = 'lbs'
) {
  if (format === 'tcx') {
    // Real Training Center XML — importable by Strava, Garmin, Samsung Health
    const docs = logs.map((l) => buildTcxForWorkout(l, weightUnit));
    // Return the single workout's TCX, or wrap multiple (TCX supports multiple Activity nodes;
    // for simplicity, multi-log export concatenates the Activity blocks into one document)
    if (docs.length <= 1) return docs[0] || '';
    const activities = docs
      .map((d) => {
        const m = d.match(/<Activity Sport="Other">[\s\S]*?<\/Activity>/);
        return m ? m[0] : '';
      })
      .join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd">
  <Activities>
${activities}
  </Activities>
</TrainingCenterDatabase>`;
  }

  if (format === 'samsung_json') {
    return JSON.stringify(
      {
        source: 'Lift Lyte Workout Planner',
        targetPlatform: 'Samsung Health (Galaxy Watch & Phone)',
        exportTimestamp: new Date().toISOString(),
        version: '1.0',
        workouts: logs.map((l) => ({
          sessionId: l.id,
          title: l.routineTitle,
          exerciseType: 'WeightTraining',
          startTime: l.startedAt,
          endTime: l.completedAt || l.startedAt,
          durationSeconds: l.durationSeconds,
          activeCalories: l.caloriesBurned || 450,
          avgHeartRate: l.heartRateAvg || 140,
          peakHeartRate: l.heartRatePeak || 170,
          totalLiftedWeight: l.totalVolume,
          totalSets: l.totalSets,
          totalReps: l.totalReps,
          exercises: l.exercises.map((e) => ({
            exerciseName: e.exercise.name,
            muscleGroup: e.exercise.category,
            sets: e.sets.map((s) => ({
              set: s.setNumber,
              type: s.type,
              weight: s.weight,
              reps: s.reps,
              completed: s.completed,
            })),
          })),
        })),
      },
      null,
      2
    );
  }

  if (format === 'json') {
    return JSON.stringify(logs, null, 2);
  }

  if (format === 'csv') {
    const headers = ['Date', 'Routine', 'Duration(s)', 'Total Volume', 'Sets', 'Reps', 'Calories', 'Avg HR', 'Peak HR'];
    const rows = logs.map((l) => [
      l.startedAt,
      `"${l.routineTitle.replace(/"/g, '""')}"`,
      l.durationSeconds,
      l.totalVolume,
      l.totalSets,
      l.totalReps,
      l.caloriesBurned || 0,
      l.heartRateAvg || 0,
      l.heartRatePeak || 0,
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  // Apple HealthKit Compatible Workout XML
  const xmlItems = logs
    .map(
      (l) => `  <Workout workoutActivityType="HKWorkoutActivityTypeTraditionalStrengthTraining"
    duration="${(l.durationSeconds / 60).toFixed(1)}"
    durationUnit="min"
    totalEnergyBurned="${l.caloriesBurned || 450}"
    totalEnergyBurnedUnit="kcal"
    startDate="${l.startedAt}"
    endDate="${l.completedAt || l.startedAt}">
    <MetadataEntry key="HKWorkoutBrandName" value="Lift Lyte Workout Tracker" />
    <MetadataEntry key="HKWorkoutTotalVolume" value="${l.totalVolume}" />
    <MetadataEntry key="HKAverageHeartRate" value="${l.heartRateAvg || 140} count/min" />
  </Workout>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE HealthData [
  <!ELEMENT HealthData (ExportDate, Workout*)>
  <!ELEMENT ExportDate EMPTY>
  <!ATTLIST ExportDate value CDATA #REQUIRED>
  <!ELEMENT Workout (MetadataEntry*)>
  <!ELEMENT MetadataEntry EMPTY>
]>
<HealthData locale="en_US">
  <ExportDate value="${new Date().toISOString()}" />
${xmlItems}
</HealthData>`;
}
