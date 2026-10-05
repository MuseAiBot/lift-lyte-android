import { WebPlugin } from '@capacitor/core';
export class LiftlyteHealthConnectWeb extends WebPlugin {
    async isAvailable() {
        return { available: false };
    }
    async checkExercisePermissions() {
        return { granted: false };
    }
    async requestExercisePermissions() {
        throw this.unavailable('Health Connect is only available in the native Android app.');
    }
    async writeWorkout() {
        throw this.unavailable('Health Connect is only available in the native Android app.');
    }
}
