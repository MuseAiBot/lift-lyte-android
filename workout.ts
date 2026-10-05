export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Biceps'
  | 'Triceps'
  | 'Quads'
  | 'Hamstrings'
  | 'Glutes'
  | 'Calves'
  | 'Core'
  | 'Full Body'
  | 'Cardio';

export type EquipmentType =
  | 'Barbell'
  | 'Dumbbell'
  | 'Cable'
  | 'Machine'
  | 'Bodyweight'
  | 'Kettlebell'
  | 'Resistance Band'
  | 'Smith Machine'
  | 'Cardio Machine';

export type SetType = 'warmup' | 'normal' | 'drop' | 'failure';

export interface Exercise {
  id: string;
  name: string;
  category: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  equipment: EquipmentType;
  defaultRestSeconds: number;
  notes?: string;
  isCustom?: boolean;
  personalRecord?: {
    maxWeight: number;
    maxReps: number;
    estimated1RM: number;
    achievedAt: string;
  };
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  type: SetType;
  weight: number; // in lbs or kg (controlled by user setting)
  reps: number;
  rpe?: number; // 6 to 10
  completed: boolean;
  previousWeight?: number;
  previousReps?: number;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  sets: WorkoutSet[];
  notes?: string;
  restTimerSeconds?: number;
}

export interface WorkoutRoutine {
  id: string;
  title: string;
  description: string;
  category: string;
  targetDaysPerWeek: number;
  estimatedMinutes: number;
  exercises: WorkoutExercise[];
  isCustom?: boolean;
  color?: string;
  lastPerformed?: string;
}

export interface WorkoutLog {
  id: string;
  routineId?: string;
  routineTitle: string;
  startedAt: string;
  completedAt?: string;
  durationSeconds: number;
  exercises: WorkoutExercise[];
  totalVolume: number; // total weight * reps
  totalReps: number;
  totalSets: number;
  notes?: string;
  rating?: number; // 1-5
  caloriesBurned?: number;
  heartRateAvg?: number;
  heartRatePeak?: number;
  isNightSession?: boolean;
  sharedToCommunity?: boolean;
  syncedPlatforms?: string[];
  prAchievements?: {
    exerciseName: string;
    type: string;
    value: string;
  }[];
}

export interface PersonalRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  metric: '1RM' | 'max_weight' | 'max_reps' | 'max_volume';
  value: number;
  unit: string;
  achievedAt: string;
  workoutLogId: string;
  previousValue?: number;
}

export type HealthPlatformKind = 'oauth' | 'native_only' | 'unavailable';

export interface HealthPlatformSync {
  platform: 'apple_health' | 'google_fit' | 'health_connect' | 'samsung_health' | 'strava' | 'whoop' | 'garmin';
  name: string;
  icon: string;
  /** How this platform can integrate: real OAuth, native-mobile-only (no web API), or not feasible. */
  kind: HealthPlatformKind;
  /** Honest one-liner shown in the UI explaining what works and what doesn't. */
  setupHint?: string;
  enabled: boolean;
  lastSyncTime?: string;
  status: 'connected' | 'syncing' | 'idle' | 'error';
  syncedWorkoutsCount: number;
  autoExport: boolean;
  supportedMetrics: string[];
}

export interface HealthMetricsOverview {
  activeCaloriesToday: number;
  activeCaloriesWeekly: number;
  restingHeartRate: number;
  avgWorkoutHeartRate: number;
  sleepScore: number; // 0-100
  recoveryStatus: 'Optimal' | 'Prime' | 'Fatigued' | 'Need Rest';
  vo2Max: number;
  weeklyWorkoutMinutes: number;
  stepCountToday: number;
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export type ThemeOption = 'midnight' | 'obsidian' | 'electric' | 'crimson' | 'light';

export interface UserSettings {
  weightUnit: 'lbs' | 'kg';
  theme: ThemeOption;
  nightVisionMode: boolean; // low-blue red/amber shift
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  defaultRestTime: number;
  barbellWeight: number; // 45 lbs or 20 kg
  simulateOffline: boolean;
}
