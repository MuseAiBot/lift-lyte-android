import React, { useEffect, useState } from 'react';
import {
  ArrowDownToLine,
  CheckCircle2,
  Compass,
  Download,
  Heart,
  HeartPulse,
  Info,
  RefreshCw,
  Smartphone,
  Upload,
  Watch,
  XCircle,
  Zap,
} from 'lucide-react';
import { HealthPlatformSync, UserSettings, WorkoutLog } from '../types/workout';
import { generateHealthExport } from '../utils/storage';
import {
  hasHealthConnectPermissions,
  isHealthConnectAvailable,
  isNativeApp,
  requestHealthConnectPermissions,
  writeWorkoutToHealthConnect,
} from '../utils/healthConnect';
import {
  beginStravaOAuth,
  disconnectStrava,
  fetchStravaRecentActivities,
  getStravaAppCredentials,
  getStravaAthleteName,
  isStravaConnected,
  saveStravaAppCredentials,
  StravaActivity,
  takeOAuthNotice,
  uploadWorkoutToStrava,
} from '../utils/strava';

interface HealthSyncViewProps {
  platforms: HealthPlatformSync[];
  onUpdatePlatforms: (platforms: HealthPlatformSync[]) => void;
  logs: WorkoutLog[];
  isOnline: boolean;
  settings: UserSettings;
  onLogSynced: (logId: string, platform: string) => void;
}

type ExportFormat = 'tcx' | 'samsung_json' | 'apple_xml' | 'json' | 'csv';

export const HealthSyncView: React.FC<HealthSyncViewProps> = ({
  platforms,
  onUpdatePlatforms,
  logs,
  isOnline,
  settings,
  onLogSynced,
}) => {
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [selectedExportFormat, setSelectedExportFormat] = useState<ExportFormat>('tcx');

  // Strava state
  const [stravaClientId, setStravaClientId] = useState('');
  const [stravaClientSecret, setStravaClientSecret] = useState('');
  const [stravaBusy, setStravaBusy] = useState(false);
  const [stravaProgress, setStravaProgress] = useState<string | null>(null);
  const [stravaActivities, setStravaActivities] = useState<StravaActivity[] | null>(null);
  const [stravaConnected, setStravaConnected] = useState(isStravaConnected());
  const [stravaAthlete, setStravaAthlete] = useState<string | null>(getStravaAthleteName());

  // Native Health Connect state (Android app only)
  const nativeApp = isNativeApp();
  const [hcAvailable, setHcAvailable] = useState<boolean | null>(null);
  const [hcGranted, setHcGranted] = useState(false);
  const [hcBusy, setHcBusy] = useState(false);

  const pushLog = (msg: string) => setSyncLogs((prev) => [`${new Date().toLocaleTimeString()} — ${msg}`, ...prev.slice(0, 9)]);

  useEffect(() => {
    const n = takeOAuthNotice();
    if (n) {
      setNotice(n);
      pushLog(n.message);
    }
    const creds = getStravaAppCredentials();
    if (creds) {
      setStravaClientId(creds.clientId);
      setStravaClientSecret(creds.clientSecret);
    }
    if (isStravaConnected()) {
      setStravaConnected(true);
      setStravaAthlete(getStravaAthleteName());
      fetchStravaRecentActivities(5)
        .then(setStravaActivities)
        .catch(() => setStravaActivities([]));
    }
    if (isNativeApp()) {
      isHealthConnectAvailable()
        .then(async (available) => {
          setHcAvailable(available);
          if (available) {
            const granted = await hasHealthConnectPermissions();
            setHcGranted(granted);
            if (granted) markPlatform('health_connect', { enabled: true, status: 'connected' });
          }
        })
        .catch(() => setHcAvailable(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markPlatform = (platformKey: string, patch: Partial<HealthPlatformSync>) => {
    const updated = platforms.map((p) => (p.platform === platformKey ? { ...p, ...patch } : p));
    onUpdatePlatforms(updated);
  };

  // --- Strava actions ---

  const handleStravaConnect = () => {
    if (!stravaClientId.trim() || !stravaClientSecret.trim()) {
      setNotice({ ok: false, message: 'Enter your Strava Client ID and Client Secret first.' });
      return;
    }
    saveStravaAppCredentials({ clientId: stravaClientId.trim(), clientSecret: stravaClientSecret.trim() });
    beginStravaOAuth(stravaClientId.trim());
  };

  const handleStravaDisconnect = async () => {
    setStravaBusy(true);
    try {
      await disconnectStrava();
    } finally {
      setStravaBusy(false);
    }
    setStravaConnected(false);
    setStravaAthlete(null);
    setStravaActivities(null);
    markPlatform('strava', { enabled: false, status: 'idle' });
    pushLog('Disconnected from Strava.');
    setNotice({ ok: true, message: 'Disconnected from Strava.' });
  };

  const handleStravaUpload = async () => {
    const latest = logs[0];
    if (!latest) {
      setNotice({ ok: false, message: 'No workouts logged yet — log a workout first, then upload it.' });
      return;
    }
    setStravaBusy(true);
    setStravaProgress(null);
    setNotice(null);
    try {
      const activityId = await uploadWorkoutToStrava(latest, settings.weightUnit, setStravaProgress);
      onLogSynced(latest.id, 'strava');
      const platform = platforms.find((p) => p.platform === 'strava');
      markPlatform('strava', {
        enabled: true,
        status: 'connected',
        lastSyncTime: new Date().toISOString(),
        syncedWorkoutsCount: (platform?.syncedWorkoutsCount || 0) + 1,
      });
      pushLog(`Uploaded "${latest.routineTitle}" to Strava (activity ${activityId}).`);
      setNotice({ ok: true, message: `Uploaded "${latest.routineTitle}" to Strava as a strength workout.` });
      fetchStravaRecentActivities(5).then(setStravaActivities).catch(() => undefined);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed.';
      pushLog(`Strava upload failed: ${msg}`);
      setNotice({ ok: false, message: msg });
    } finally {
      setStravaBusy(false);
      setStravaProgress(null);
    }
  };

  // --- Native Health Connect actions (Android app only) ---

  const handleHealthConnectConnect = async () => {
    setHcBusy(true);
    setNotice(null);
    try {
      const granted = await requestHealthConnectPermissions();
      setHcGranted(granted);
      if (granted) {
        markPlatform('health_connect', { enabled: true, status: 'connected' });
        pushLog('Health Connect connected — exercise permissions granted.');
        setNotice({ ok: true, message: 'Health Connect connected. Your workouts can now be written to Health Connect.' });
      } else {
        setNotice({ ok: false, message: 'Health Connect permissions were not granted.' });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Health Connect connection failed.';
      pushLog(`Health Connect connect failed: ${msg}`);
      setNotice({ ok: false, message: msg });
    } finally {
      setHcBusy(false);
    }
  };

  const handleHealthConnectWrite = async () => {
    const latest = logs[0];
    if (!latest) {
      setNotice({ ok: false, message: 'No workouts logged yet — log a workout first, then write it.' });
      return;
    }
    setHcBusy(true);
    setNotice(null);
    try {
      await writeWorkoutToHealthConnect(latest);
      onLogSynced(latest.id, 'health_connect');
      const platform = platforms.find((p) => p.platform === 'health_connect');
      markPlatform('health_connect', {
        enabled: true,
        status: 'connected',
        lastSyncTime: new Date().toISOString(),
        syncedWorkoutsCount: (platform?.syncedWorkoutsCount || 0) + 1,
      });
      pushLog(`Wrote "${latest.routineTitle}" to Health Connect.`);
      setNotice({ ok: true, message: `"${latest.routineTitle}" written to Health Connect as a strength workout.` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Write failed.';
      pushLog(`Health Connect write failed: ${msg}`);
      setNotice({ ok: false, message: msg });
    } finally {
      setHcBusy(false);
    }
  };

  // --- Export ---

  const handleDownloadExport = () => {
    const content = generateHealthExport(logs, selectedExportFormat, settings.weightUnit);
    const mime = selectedExportFormat === 'csv' ? 'text/csv' : selectedExportFormat === 'tcx' || selectedExportFormat === 'apple_xml' ? 'application/xml' : 'application/json';
    const ext = selectedExportFormat === 'tcx' ? 'tcx' : selectedExportFormat === 'apple_xml' ? 'xml' : selectedExportFormat === 'csv' ? 'csv' : 'json';
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lift-lyte-${selectedExportFormat}-${new Date().toISOString().slice(0, 10)}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    pushLog(`Exported ${logs.length} workout(s) as ${ext.toUpperCase()}.`);
  };

  const stravaPlatform = platforms.find((p) => p.platform === 'strava');
  const otherPlatforms = platforms.filter((p) => p.platform !== 'strava');
  const callbackDomain = typeof window !== 'undefined' ? window.location.hostname : '';

  const formatButtons: { key: ExportFormat; label: string }[] = [
    { key: 'tcx', label: 'TCX (Strava / Garmin)' },
    { key: 'samsung_json', label: 'Samsung Health (JSON)' },
    { key: 'apple_xml', label: 'Apple Health (XML)' },
    { key: 'json', label: 'Universal (JSON)' },
    { key: 'csv', label: 'Universal (CSV)' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 p-5 sm:p-6 rounded-3xl border border-zinc-800 shadow-xl">
        <div className="flex items-center gap-2">
          <HeartPulse className="w-4 h-4 text-emerald-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
            Health Ecosystem Integration
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
          Health Platform Sync Hub
        </h2>
        <p className="text-xs text-zinc-400 max-w-xl">
          {nativeApp
            ? 'Running as a native app: Health Connect writes real strength workouts on this device, and Strava uploads work too. Other platforms still need a manual file export below.'
            : "Strava connects for real — upload finished workouts directly. Samsung Health, Apple Health, and Google Health Connect have no web API, so they can't connect from a browser app; export files below and import them manually instead."}
        </p>
      </div>

      {notice && (
        <div
          className={`rounded-xl border p-3 text-xs font-bold flex items-center gap-2 animate-in fade-in ${
            notice.ok
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}
        >
          {notice.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
          <span className="flex-1">{notice.message}</span>
          <button onClick={() => setNotice(null)} className="text-zinc-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Real Strava Integration */}
      <div className="rounded-3xl bg-zinc-900/90 border border-orange-500/30 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-400" />
            <h3 className="text-base font-bold text-white">Strava — Real Sync</h3>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                stravaConnected
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}
            >
              {stravaConnected ? 'CONNECTED' : 'NOT CONNECTED'}
            </span>
          </div>
          {stravaConnected && stravaAthlete && (
            <span className="text-xs text-zinc-400">as <span className="font-bold text-white">{stravaAthlete}</span></span>
          )}
        </div>

        {!stravaConnected ? (
          <div className="space-y-3">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Connect your own Strava app (free) to upload Lift Lyte workouts to Strava as real strength
              activities. Your Client Secret stays in this browser only — fine for personal use.
            </p>
            <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4 space-y-2 text-xs text-zinc-300">
              <div className="font-bold text-white text-[11px] uppercase tracking-wider">One-time setup</div>
              <ol className="list-decimal list-inside space-y-1 text-zinc-400">
                <li>Go to <span className="text-zinc-200 font-semibold">strava.com/settings/api</span> and create an application.</li>
                <li>Set <span className="text-zinc-200 font-semibold">Authorization Callback Domain</span> to <code className="bg-zinc-800 px-1 rounded text-emerald-300">{callbackDomain}</code></li>
                <li>Paste your Client ID and Client Secret below, then connect.</li>
              </ol>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Strava Client ID</label>
                <input
                  value={stravaClientId}
                  onChange={(e) => setStravaClientId(e.target.value)}
                  placeholder="e.g. 123456"
                  inputMode="numeric"
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm font-mono-numbers text-white focus:border-orange-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Strava Client Secret</label>
                <input
                  value={stravaClientSecret}
                  onChange={(e) => setStravaClientSecret(e.target.value)}
                  placeholder="40-character secret"
                  type="password"
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm font-mono-numbers text-white focus:border-orange-500 focus:outline-hidden"
                />
              </div>
            </div>
            <button
              onClick={handleStravaConnect}
              className="flex items-center gap-2 rounded-2xl bg-orange-500 hover:bg-orange-400 text-black px-5 py-3 text-xs font-black uppercase tracking-wider active:scale-95 transition shadow-lg shadow-orange-500/20"
            >
              <Zap className="w-4 h-4" />
              <span>Save & Connect with Strava</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleStravaUpload}
                disabled={stravaBusy || !isOnline}
                className="flex items-center gap-2 rounded-2xl bg-orange-500 hover:bg-orange-400 text-black px-5 py-3 text-xs font-black uppercase tracking-wider active:scale-95 transition disabled:opacity-50 shadow-lg shadow-orange-500/20"
              >
                <Upload className={`w-4 h-4 ${stravaBusy ? 'animate-pulse' : ''}`} />
                <span>{stravaBusy ? (stravaProgress || 'Working…') : 'Upload latest workout to Strava'}</span>
              </button>
              <button
                onClick={handleStravaDisconnect}
                disabled={stravaBusy}
                className="rounded-2xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-4 py-3 text-xs font-bold text-zinc-300 transition disabled:opacity-50"
              >
                Disconnect
              </button>
            </div>

            {stravaPlatform && stravaPlatform.syncedWorkoutsCount > 0 && (
              <p className="text-[11px] text-zinc-500 font-mono-numbers">
                {stravaPlatform.syncedWorkoutsCount} workout(s) uploaded via Lift Lyte
                {stravaPlatform.lastSyncTime && ` • last: ${new Date(stravaPlatform.lastSyncTime).toLocaleString()}`}
              </p>
            )}

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">Recent Strava activities</div>
              {stravaActivities === null ? (
                <p className="text-xs text-zinc-500">Loading…</p>
              ) : stravaActivities.length === 0 ? (
                <p className="text-xs text-zinc-500">No activities found on your Strava account yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {stravaActivities.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-xl bg-zinc-950 border border-zinc-800/80 px-3 py-2 text-xs">
                      <span className="font-bold text-zinc-200 truncate">{a.name}</span>
                      <span className="text-zinc-500 font-mono-numbers shrink-0 ml-2">
                        {a.type} • {new Date(a.start_date).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Other platforms — honest states */}
      <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800 p-5 sm:p-6 shadow-xl space-y-4">
        <div>
          <h3 className="text-base font-bold text-white">Other Platforms</h3>
          <p className="text-xs text-zinc-400">What each platform can and can't do from a web app.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {otherPlatforms.map((p) => {
            if (p.platform === 'health_connect' && nativeApp) {
              return (
                <div key={p.platform} className="rounded-2xl bg-zinc-950 border border-emerald-500/30 p-4 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-bold text-white">{p.name}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                        hcGranted
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      {hcGranted ? 'CONNECTED' : 'NOT CONNECTED'}
                    </span>
                  </div>
                  {hcAvailable === false ? (
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Health Connect isn't available on this device. It needs Android 9+ with the
                      Health Connect app installed (or Android 14+, where it's built in).
                    </p>
                  ) : hcAvailable === null ? (
                    <p className="text-[11px] text-zinc-500">Checking Health Connect…</p>
                  ) : !hcGranted ? (
                    <>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Write Lift Lyte workouts straight into Health Connect as strength-training
                        sessions — Samsung Health and other apps pick them up from there.
                      </p>
                      <button
                        onClick={handleHealthConnectConnect}
                        disabled={hcBusy}
                        className="flex items-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black px-5 py-3 text-xs font-black uppercase tracking-wider active:scale-95 transition disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>{hcBusy ? 'Working…' : 'Connect Health Connect'}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Connected. Writes each workout as a strength-training session with calories.
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={handleHealthConnectWrite}
                          disabled={hcBusy || logs.length === 0}
                          className="flex items-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black px-5 py-3 text-xs font-black uppercase tracking-wider active:scale-95 transition disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                        >
                          <Upload className={`w-4 h-4 ${hcBusy ? 'animate-pulse' : ''}`} />
                          <span>{hcBusy ? 'Writing…' : 'Write latest workout to Health Connect'}</span>
                        </button>
                      </div>
                      {p.syncedWorkoutsCount > 0 && (
                        <p className="text-[11px] text-zinc-500 font-mono-numbers">
                          {p.syncedWorkoutsCount} workout(s) written via Lift Lyte
                          {p.lastSyncTime && ` • last: ${new Date(p.lastSyncTime).toLocaleString()}`}
                        </p>
                      )}
                    </>
                  )}
                </div>
              );
            }
            const unavailable = p.kind === 'unavailable';
            return (
              <div key={p.platform} className="rounded-2xl bg-zinc-950 border border-zinc-800/80 p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {p.platform === 'samsung_health' && <Watch className="w-4 h-4 text-cyan-400" />}
                  {p.platform === 'apple_health' && <Heart className="w-4 h-4 text-rose-400" />}
                  {p.platform === 'health_connect' && <Smartphone className="w-4 h-4 text-emerald-400" />}
                  {p.platform === 'whoop' && <HeartPulse className="w-4 h-4 text-zinc-400" />}
                  {p.platform === 'garmin' && <Compass className="w-4 h-4 text-zinc-400" />}
                  <span className="text-sm font-bold text-white">{p.name}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      unavailable
                        ? 'bg-zinc-800 text-zinc-500'
                        : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {unavailable ? 'NOT AVAILABLE ON WEB' : 'NATIVE APP ONLY'}
                  </span>
                </div>
                {p.setupHint && (
                  <p className="text-[11px] text-zinc-400 leading-relaxed flex gap-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-zinc-500" />
                    <span>{p.setupHint}</span>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Export — real files */}
      <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800 p-5 sm:p-6 shadow-xl space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export Workout Data</span>
          </h3>
          <p className="text-xs text-zinc-400">
            Real files you can import manually: TCX works with Strava, Garmin, and Samsung Health uploads.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
          <div className="flex flex-wrap gap-2">
            {formatButtons.map((f) => (
              <button
                key={f.key}
                onClick={() => setSelectedExportFormat(f.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedExportFormat === f.key
                    ? 'bg-emerald-500 text-black'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleDownloadExport}
            disabled={logs.length === 0}
            className="flex items-center gap-1.5 ml-auto rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-4 py-2 text-xs font-bold text-white transition active:scale-95 disabled:opacity-50"
          >
            <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download ({logs.length} Workouts)</span>
          </button>
        </div>
      </div>

      {/* Sync event log */}
      <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800 p-5 sm:p-6 shadow-xl space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Events</span>
        </h4>
        <div className="space-y-1.5 rounded-2xl bg-zinc-950 p-4 border border-zinc-800/80 font-mono-numbers text-xs min-h-[64px]">
          {syncLogs.length === 0 ? (
            <p className="text-zinc-600">No sync events yet. Connect Strava or export a file to get started.</p>
          ) : (
            syncLogs.map((logStr, i) => (
              <div key={i} className="flex items-center gap-2 text-zinc-300 py-0.5">
                <span className="text-emerald-400">❯</span>
                <span className="text-zinc-400">{logStr}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
