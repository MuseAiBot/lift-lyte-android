import { WebPlugin } from '@capacitor/core';

import type { LiftlyteHealthConnectPlugin } from './definitions';

export class LiftlyteHealthConnectWeb extends WebPlugin implements LiftlyteHealthConnectPlugin {
  async isAvailable(): Promise<{ available: boolean }> {
    return { available: false };
  }

  async checkExercisePermissions(): Promise<{ granted: boolean }> {
    return { granted: false };
  }

  async requestExercisePermissions(): Promise<{ granted: boolean }> {
    throw this.unavailable('Health Connect is only available in the native Android app.');
  }

  async writeWorkout(): Promise<{ id: string }> {
    throw this.unavailable('Health Connect is only available in the native Android app.');
  }
}
