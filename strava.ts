import { WorkoutLog } from '../types/workout';
import { buildTcxForWorkout } from './tcx';

/**
 * Real Strava integration (OAuth 2.0 authorization-code flow + file upload API).
 *
 * NOTE on the client secret: Strava's token exchange requires the client
 * secret, which cannot be kept private inside a browser-only app. This is
 * acceptable for a personal-use app (your own Strava app, your own data),
 * but do not ship these credentials in an app other people install — that
 * setup needs a small backend to hold the secret.
 */

// Centralized so the Jan 2027 migration to https://api-v3.strava.com is a one-line change
export const STRAVA_API_BASE = 'https://www.strava.com/api/v3';
const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize';
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';

const TOKENS_KEY = 'liftlyte_strava_tokens';
const APP_CREDS_KEY = 'liftlyte_strava_app';
const OAUTH_STATE_KEY = 'liftlyte_oauth_state';
const OAUTH_NOTICE_KEY = 'liftlyte_oauth_notice';

export interface StravaTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch seconds
  athlete?: { id: number; firstname: string; lastname: string };
}

export interface StravaAppCredentials {
  clientId: string;
  clientSecret: string;
}

export interface StravaActivity {
  id: number;
  name: string;
  type: string;
  start_date: string;
  elapsed_time: number;
  distance: number;
}

// --- Credential storage (this browser only) ---

export function getStravaAppCredentials(): StravaAppCredentials | null {
  try {
    const raw = localStorage.getItem(APP_CREDS_KEY);
    return raw ? (JSON.parse(raw) as StravaAppCredentials) : null;
  } catch {
    return null;
  }
}

export function saveStravaAppCredentials(creds: StravaAppCredentials) {
  try {
    localStorage.setItem(APP_CREDS_KEY, JSON.stringify(creds));
  } catch {
    // ignore
  }
}

function getStravaTokens(): StravaTokens | null {
  try {
    const raw = localStorage.getItem(TOKENS_KEY);
    return raw ? (JSON.parse(raw) as StravaTokens) : null;
  } catch {
    return null;
  }
}

function saveStravaTokens(tokens: StravaTokens) {
  try {
    localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
  } catch {
    // ignore
  }
}

export function clearStravaTokens() {
  try {
    localStorage.removeItem(TOKENS_KEY);
  } catch {
    // ignore
  }
}

export function isStravaConnected(): boolean {
  return getStravaTokens() !== null;
}

export function getStravaAthleteName(): string | null {
  const t = getStravaTokens();
  if (!t?.athlete) return null;
  return `${t.athlete.firstname} ${t.athlete.lastname}`.trim() || null;
}

// --- OAuth flow ---

export function stravaRedirectUri(): string {
  return window.location.origin + window.location.pathname;
}

export function beginStravaOAuth(clientId: string) {
  const state = `strava_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  try {
    sessionStorage.setItem(OAUTH_STATE_KEY, state);
  } catch {
    // ignore
  }
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: stravaRedirectUri(),
    approval_prompt: 'auto',
    scope: 'read,activity:read,activity:write',
    state,
  });
  window.location.href = `${STRAVA_AUTH_URL}?${params.toString()}`;
}

export function consumeOAuthState(): string | null {
  try {
    const s = sessionStorage.getItem(OAUTH_STATE_KEY);
    sessionStorage.removeItem(OAUTH_STATE_KEY);
    return s;
  } catch {
    return null;
  }
}

export function setOAuthNotice(ok: boolean, message: string) {
  try {
    localStorage.setItem(OAUTH_NOTICE_KEY, JSON.stringify({ ok, message, ts: Date.now() }));
  } catch {
    // ignore
  }
}

export function takeOAuthNotice(): { ok: boolean; message: string } | null {
  try {
    const raw = localStorage.getItem(OAUTH_NOTICE_KEY);
    localStorage.removeItem(OAUTH_NOTICE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function postTokenExchange(body: Record<string, string>): Promise<StravaTokens> {
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Strava token exchange failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  const tokens: StravaTokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
    athlete: data.athlete
      ? { id: data.athlete.id, firstname: data.athlete.firstname, lastname: data.athlete.lastname }
      : undefined,
  };
  saveStravaTokens(tokens);
  return tokens;
}

export async function completeStravaOAuth(code: string): Promise<StravaTokens> {
  const creds = getStravaAppCredentials();
  if (!creds) throw new Error('Strava app credentials are missing. Enter your Client ID and Client Secret first.');
  return postTokenExchange({
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    code,
    grant_type: 'authorization_code',
  });
}

/** Returns a valid access token, refreshing it when expired. */
export async function getValidStravaAccessToken(): Promise<string> {
  const tokens = getStravaTokens();
  if (!tokens) throw new Error('Strava is not connected.');
  const nowSec = Math.floor(Date.now() / 1000);
  if (tokens.expires_at > nowSec + 120) return tokens.access_token;

  const creds = getStravaAppCredentials();
  if (!creds) throw new Error('Strava app credentials are missing; reconnect Strava.');
  const refreshed = await postTokenExchange({
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    grant_type: 'refresh_token',
    refresh_token: tokens.refresh_token,
  });
  // Preserve athlete info across refreshes (refresh responses omit it)
  if (!refreshed.athlete && tokens.athlete) {
    refreshed.athlete = tokens.athlete;
    saveStravaTokens(refreshed);
  }
  return refreshed.access_token;
}

export async function disconnectStrava() {
  try {
    const tokens = getStravaTokens();
    if (tokens) {
      // Best-effort revoke on Strava's side
      await fetch(`${STRAVA_API_BASE}/oauth/deauthorize`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }).catch(() => undefined);
    }
  } finally {
    clearStravaTokens();
  }
}

// --- API calls ---

async function stravaFetch(path: string, init?: RequestInit) {
  const token = await getValidStravaAccessToken();
  const res = await fetch(`${STRAVA_API_BASE}${path}`, {
    ...init,
    headers: { ...(init?.headers || {}), Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Strava API error (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.json();
}

export async function fetchStravaRecentActivities(perPage = 5): Promise<StravaActivity[]> {
  return stravaFetch(`/athlete/activities?per_page=${perPage}`);
}

interface StravaUploadStatus {
  id: number;
  status: string;
  activity_id: number | null;
  error: string | null;
}

/**
 * Uploads a finished workout to Strava as a real activity:
 * builds a TCX file, uploads it, waits for processing, then tags it
 * as WeightTraining. Returns the new Strava activity id.
 */
export async function uploadWorkoutToStrava(
  log: WorkoutLog,
  weightUnit: 'lbs' | 'kg',
  onProgress?: (stage: string) => void
): Promise<number> {
  onProgress?.('Preparing workout file…');
  const tcx = buildTcxForWorkout(log, weightUnit);
  const file = new Blob([tcx], { type: 'application/xml' });

  const form = new FormData();
  form.append('file', file, `lift-lyte-${log.id}.tcx`);
  form.append('name', log.routineTitle.slice(0, 100) || 'Lift Lyte Workout');
  form.append('description', `Logged with Lift Lyte Workout Planner • ${log.totalSets} sets, ${log.totalReps} reps`);
  form.append('data_type', 'tcx');
  form.append('trainer', '1');
  form.append('external_id', log.id);

  onProgress?.('Uploading to Strava…');
  const token = await getValidStravaAccessToken();
  const uploadRes = await fetch(`${STRAVA_API_BASE}/uploads`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!uploadRes.ok) {
    const text = await uploadRes.text().catch(() => '');
    throw new Error(`Strava upload failed (${uploadRes.status}): ${text.slice(0, 200)}`);
  }
  const upload: StravaUploadStatus = await uploadRes.json();
  if (upload.error) throw new Error(`Strava rejected the upload: ${upload.error}`);

  // Poll until Strava finishes processing the file
  onProgress?.('Strava is processing the workout…');
  const deadline = Date.now() + 45000;
  let activityId: number | null = null;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2500));
    const status: StravaUploadStatus = await stravaFetch(`/uploads/${upload.id}`);
    if (status.error) throw new Error(`Strava processing failed: ${status.error}`);
    if (status.activity_id) {
      activityId = status.activity_id;
      break;
    }
  }
  if (!activityId) throw new Error('Timed out waiting for Strava to process the upload.');

  // Tag it as strength training (uploads default to a generic type)
  onProgress?.('Tagging as strength training…');
  await stravaFetch(`/activities/${activityId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'WeightTraining' }),
  }).catch(() => undefined); // non-fatal if the type update fails

  return activityId;
}
