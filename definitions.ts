export interface WriteWorkoutOptions {
  /** Display title, e.g. "Push Day — Chest & Triceps". */
  title: string;
  /** Optional free-text notes (exercise/set summary). */
  notes?: string;
  /** ISO 8601 start time. */
  startTime: string;
  /** ISO 8601 end time. */
  endTime: string;
  /** Optional calories burned, in kilocalories. */
  caloriesKcal?: number;
  /** Optional idempotency key so retries don't duplicate the session. */
  clientRecordId?: string;
}

export interface LiftlyteHealthConnectPlugin {
  /** True when the Health Connect SDK is usable on this device (Android native only). */
  isAvailable(): Promise<{ available: boolean }>;
  /** True when all exercise permissions are already granted (no prompt shown). */
  checkExercisePermissions(): Promise<{ granted: boolean }>;
  /** Prompts for Health Connect exercise permissions. Resolves granted=true when all are granted. */
  requestExercisePermissions(): Promise<{ granted: boolean }>;
  /** Writes a strength-training session (and calories, when provided) to Health Connect. */
  writeWorkout(options: WriteWorkoutOptions): Promise<{ id: string }>;
}
