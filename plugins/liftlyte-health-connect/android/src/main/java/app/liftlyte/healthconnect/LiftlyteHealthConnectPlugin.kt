package app.liftlyte.healthconnect

import androidx.activity.result.ActivityResult
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.metadata.Device
import androidx.health.connect.client.records.metadata.Metadata
import androidx.health.connect.client.units.Energy
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.time.Instant
import java.time.ZoneOffset

/**
 * Minimal Health Connect bridge for Lift Lyte (Android).
 *
 * - isAvailable(): true when the Health Connect SDK is usable on this device.
 * - requestExercisePermissions(): prompts for READ/WRITE_EXERCISE (+WRITE_ACTIVE_CALORIES_BURNED).
 * - writeWorkout(): inserts an ExerciseSessionRecord (strength training) and,
 *   when provided, an ActiveCaloriesBurnedRecord for the same time range.
 *
 * Web/iOS: not implemented (see src/web.ts) — the app falls back to its
 * existing export/Strava flows on those platforms.
 */
@CapacitorPlugin(name = "LiftlyteHealthConnect")
class LiftlyteHealthConnectPlugin : Plugin() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    private val exercisePermissions: Set<String> = setOf(
        "android.permission.health.READ_EXERCISE",
        "android.permission.health.WRITE_EXERCISE",
        "android.permission.health.WRITE_ACTIVE_CALORIES_BURNED"
    )

    private fun clientOrNull(): HealthConnectClient? {
        return try {
            if (HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE) {
                HealthConnectClient.getOrCreate(context)
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }

    @PluginMethod
    fun isAvailable(call: PluginCall) {
        val ret = JSObject()
        ret.put("available", clientOrNull() != null)
        call.resolve(ret)
    }

    @PluginMethod
    fun checkExercisePermissions(call: PluginCall) {
        val client = clientOrNull()
        if (client == null) {
            val ret = JSObject()
            ret.put("granted", false)
            call.resolve(ret)
            return
        }
        scope.launch {
            try {
                val granted = client.permissionController.getGrantedPermissions()
                val ret = JSObject()
                ret.put("granted", granted.containsAll(exercisePermissions))
                call.resolve(ret)
            } catch (e: Exception) {
                call.reject(e.message ?: "Permission check failed")
            }
        }
    }

    @PluginMethod
    fun requestExercisePermissions(call: PluginCall) {
        val client = clientOrNull()
        if (client == null) {
            call.reject("Health Connect is not available on this device")
            return
        }
        scope.launch {
            try {
                val granted = client.permissionController.getGrantedPermissions()
                if (granted.containsAll(exercisePermissions)) {
                    val ret = JSObject()
                    ret.put("granted", true)
                    call.resolve(ret)
                    return@launch
                }
                val permissionContract = PermissionController.createRequestPermissionResultContract()
                val intent = permissionContract.createIntent(context, exercisePermissions)
                val hostActivity = bridge.activity
                if (hostActivity == null) {
                    call.reject("Activity not available")
                    return@launch
                }
                hostActivity.runOnUiThread {
                    try {
                        startActivityForResult(call, intent, "handlePermissionResult")
                    } catch (e: Exception) {
                        call.reject("Could not open Health Connect permissions: ${e.message}")
                    }
                }
            } catch (e: Exception) {
                call.reject(e.message ?: "Permission request failed")
            }
        }
    }

    @ActivityCallback
    private fun handlePermissionResult(call: PluginCall?, result: ActivityResult) {
        if (call == null) return
        scope.launch {
            try {
                val client = clientOrNull()
                val granted = client?.permissionController?.getGrantedPermissions() ?: emptySet()
                val ret = JSObject()
                ret.put("granted", granted.containsAll(exercisePermissions))
                call.resolve(ret)
            } catch (e: Exception) {
                call.reject(e.message ?: "Permission check failed")
            }
        }
    }

    @PluginMethod
    fun writeWorkout(call: PluginCall) {
        val title = call.getString("title") ?: "Workout"
        val notes = call.getString("notes")
        val startIso = call.getString("startTime")
        val endIso = call.getString("endTime")
        val caloriesKcal = call.getDouble("caloriesKcal")
        val clientRecordId = call.getString("clientRecordId")
        if (startIso.isNullOrBlank() || endIso.isNullOrBlank()) {
            call.reject("startTime and endTime are required (ISO 8601)")
            return
        }
        val client = clientOrNull()
        if (client == null) {
            call.reject("Health Connect is not available on this device")
            return
        }
        scope.launch {
            try {
                val granted = client.permissionController.getGrantedPermissions()
                if (!granted.contains("android.permission.health.WRITE_EXERCISE")) {
                    call.reject("WRITE_EXERCISE permission not granted")
                    return@launch
                }
                val start = Instant.parse(startIso)
                val end = Instant.parse(endIso)
                val zone = ZoneOffset.systemDefault().rules
                // Use manualEntry for app-recorded workouts. Attach the client
                // record id so retries don't insert duplicate sessions.
                val metadata = Metadata.manualEntry(
                    device = Device(type = Device.TYPE_PHONE)
                ).copy(clientRecordId = clientRecordId)
                val session = ExerciseSessionRecord(
                    exerciseType = ExerciseSessionRecord.EXERCISE_TYPE_STRENGTH_TRAINING,
                    startTime = start,
                    startZoneOffset = zone.getOffset(start),
                    endTime = end,
                    endZoneOffset = zone.getOffset(end),
                    title = title,
                    notes = notes,
                    metadata = metadata
                )
                val records = mutableListOf<androidx.health.connect.client.records.Record>(session)
                if (caloriesKcal != null && caloriesKcal > 0 &&
                    granted.contains("android.permission.health.WRITE_ACTIVE_CALORIES_BURNED")
                ) {
                    records.add(
                        ActiveCaloriesBurnedRecord(
                            startTime = start,
                            startZoneOffset = zone.getOffset(start),
                            endTime = end,
                            endZoneOffset = zone.getOffset(end),
                            energy = Energy.kilocalories(caloriesKcal),
                            metadata = metadata
                        )
                    )
                }
                val response = client.insertRecords(records)
                val ret = JSObject()
                val idList = response.recordIdsList
                ret.put("id", if (!idList.isEmpty()) idList[0] else "")
                call.resolve(ret)
            } catch (e: Exception) {
                call.reject(e.message ?: "Failed to write workout to Health Connect")
            }
        }
    }
}
