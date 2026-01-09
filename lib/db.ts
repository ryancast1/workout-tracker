// lib/db.ts
export type SessionRecord = {
  workout: string; // slug: "push-ups", "leg-press", etc.
  performed_on: string; // YYYY-MM-DD
  notes: string | null;
  compact: string; // what you show in "Last Session"
  payload: any; // raw details (sets/reps/weight/etc.)
};

function keyForWorkout(workout: string) {
  return `workout_log_${workout}_v1`;
}

// TEMP implementation (localStorage).
// In 2.0 we'll replace these with Supabase calls.
export async function getLastSession(workout: string): Promise<SessionRecord | null> {
  const raw = localStorage.getItem(keyForWorkout(workout));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionRecord;
  } catch {
    return null;
  }
}

export async function saveSession(record: SessionRecord): Promise<void> {
  localStorage.setItem(keyForWorkout(record.workout), JSON.stringify(record));
}
