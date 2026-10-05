import { registerPlugin } from '@capacitor/core';

import type { LiftlyteHealthConnectPlugin } from './definitions';

const LiftlyteHealthConnect = registerPlugin<LiftlyteHealthConnectPlugin>('LiftlyteHealthConnect', {
  web: () => import('./web').then((m) => new m.LiftlyteHealthConnectWeb()),
});

export * from './definitions';
export { LiftlyteHealthConnect };
