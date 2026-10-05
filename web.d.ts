import { WebPlugin } from '@capacitor/core';
import type { LiftlyteHealthConnectPlugin } from './definitions';
export declare class LiftlyteHealthConnectWeb extends WebPlugin implements LiftlyteHealthConnectPlugin {
    isAvailable(): Promise<{
        available: boolean;
    }>;
    checkExercisePermissions(): Promise<{
        granted: boolean;
    }>;
    requestExercisePermissions(): Promise<{
        granted: boolean;
    }>;
    writeWorkout(): Promise<{
        id: string;
    }>;
}
