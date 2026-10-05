import { registerPlugin } from '@capacitor/core';
const LiftlyteHealthConnect = registerPlugin('LiftlyteHealthConnect', {
    web: () => import('./web').then((m) => new m.LiftlyteHealthConnectWeb()),
});
export * from './definitions';
export { LiftlyteHealthConnect };
