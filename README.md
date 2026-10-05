# Lift Lyte — Workout Planner (Android)

Custom exercise planner for reps, sets, workout routines, personal progress
analytics, health sync, night-training dark mode, frequency calendar, and
offline support.

Built with React 19 + Vite + Tailwind CSS, shipped to Android via Capacitor 8.
Also works as a PWA on the web.

## Features

- **Workout tracking** — log sets, reps, and weight with an active-workout modal,
  rest timer, and plate calculator
- **Routines & plans** — build custom routines and follow workout plans
- **Exercise library** — searchable library grouped by muscle group and equipment
- **Progress analytics** — charts, 1RM estimates, and personal records
- **Frequency calendar** — see training consistency at a glance
- **Health Connect** — write strength sessions straight to Android Health Connect
  (native plugin in `plugins/liftlyte-health-connect`)
- **Strava integration** — OAuth + TCX export of workouts
- **Offline-first** — queues changes when offline and syncs later
- **PWA** — installable on the web with offline caching (web builds only)

## Getting started

Prerequisites: Node.js 20+, npm, and (for Android) Android Studio.

```bash
# 1. Install dependencies (includes the local Health Connect plugin)
npm install

# 2. Build the Health Connect plugin's types (needed for typecheck)
npx tsc -p plugins/liftlyte-health-connect/tsconfig.json

# 3. Start the web dev server
npm run dev

# Typecheck
npm run lint
```

### Android build

```bash
# Web assets for the native shell (skips the PWA service worker)
CAPACITOR_BUILD=true npm run build

npx cap add android   # first time only
npx cap sync android
```

The GitHub workflow in `build-aab.yml` produces a signed `.aab`.
It needs these repository secrets: `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`,
`KEY_ALIAS`, `KEY_PASSWORD`.

## Project layout

```
src/                  # web app
  App.tsx, main.tsx
  components/         # UI: modals, views, navigation
  hooks/              # useOnlineStatus, usePWAInstall
  types/              # workout domain types
  utils/              # storage, strava, tcx, audio, health-connect bridge
plugins/
  liftlyte-health-connect/   # Capacitor plugin: Android Health Connect bridge
    src/              # definitions.ts, web.ts, index.ts
    android/          # Kotlin native implementation + manifest
```

## Notes

- `npm install` uses `--legacy-peer-deps` if the esbuild peer range from
  Vite 8 conflicts with the pinned esbuild version.
- Health Connect permissions (exercise read/write) are declared in the
  plugin's `android/src/main/AndroidManifest.xml`.
