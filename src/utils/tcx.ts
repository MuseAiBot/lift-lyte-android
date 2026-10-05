import { WorkoutLog } from '../types/workout';

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Builds a real Training Center XML (TCX) document for a workout log.
 * Compatible with Strava / Garmin / Samsung Health manual file import.
 * Strength sessions are encoded as a single Lap with a Notes section
 * summarizing every exercise and set.
 */
export function buildTcxForWorkout(log: WorkoutLog, weightUnit: 'lbs' | 'kg'): string {
  const start = new Date(log.startedAt);
  const startIso = start.toISOString();
  const duration = Math.max(1, Math.round(log.durationSeconds || 0));
  const calories = Math.round(log.caloriesBurned || estimateCalories(log));

  const exerciseNotes = log.exercises
    .map((we) => {
      const done = we.sets.filter((s) => s.completed);
      const setsSummary = done
        .map((s) => `${s.weight}${weightUnit}x${s.reps}`)
        .join(', ');
      return `${we.exercise.name}: ${setsSummary || 'no completed sets'}`;
    })
    .join('\n');

  const notes = `${log.routineTitle}\n${exerciseNotes}\nTotal volume: ${log.totalVolume.toLocaleString()} ${weightUnit} • ${log.totalSets} sets • ${log.totalReps} reps`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd">
  <Activities>
    <Activity Sport="Other">
      <Id>${startIso}</Id>
      <Lap StartTime="${startIso}">
        <TotalTimeSeconds>${duration}</TotalTimeSeconds>
        <DistanceMeters>0</DistanceMeters>
        <Calories>${calories}</Calories>
        <Intensity>Active</Intensity>
        <TriggerMethod>Manual</TriggerMethod>
      </Lap>
      <Notes>${escapeXml(notes)}</Notes>
      <Creator xsi:type="Device_t">
        <Name>Lift Lyte Workout Planner</Name>
        <UnitId>0</UnitId>
        <ProductID>0</ProductID>
      </Creator>
    </Activity>
  </Activities>
</TrainingCenterDatabase>`;
}

function estimateCalories(log: WorkoutLog): number {
  // Rough resistance-training estimate: ~5 kcal per minute
  const minutes = Math.max(1, (log.durationSeconds || 1800) / 60);
  return Math.round(minutes * 5);
}
