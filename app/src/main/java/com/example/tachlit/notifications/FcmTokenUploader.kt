package com.example.tachlit.notifications

import android.content.Context
import android.util.Log
import com.example.tachlit.network.NetworkModule
import com.example.tachlit.network.RegisterDeviceTokenRequest
import com.google.android.gms.tasks.Task
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/**
 * Small helper responsible for:
 *  - fetching the current FCM token,
 *  - saving the auth token & FCM token in shared prefs,
 *  - uploading the device token to the Tachlit backend so the server can push to it.
 *
 * Call [saveAuthTokenAndUpload] right after a successful login/registration.
 */
object FcmTokenUploader {

    private const val TAG = "FcmTokenUploader"

    /**
     * Save the newly received JWT and (re)upload the FCM token attached to this user.
     * Safe to call multiple times.
     */
    fun saveAuthTokenAndUpload(context: Context, authToken: String) {
        val prefs = TachlitFirebaseMessagingService.sharedPrefs(context)
        prefs.edit().putString(TachlitFirebaseMessagingService.KEY_AUTH_TOKEN, authToken).apply()

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val fcmToken = fetchCurrentToken()
                if (fcmToken.isNullOrBlank()) return@launch
                prefs.edit().putString(TachlitFirebaseMessagingService.KEY_PENDING_TOKEN, fcmToken).apply()
                upload(context, authToken, fcmToken)
            } catch (e: Exception) {
                Log.w(TAG, "Failed to fetch FCM token: ${e.message}")
            }
        }
    }

    /**
     * Upload the given FCM token attached to the current auth token.
     */
    suspend fun upload(context: Context, authToken: String, fcmToken: String) {
        try {
            val resp = NetworkModule.apiService.registerDeviceToken(
                "Bearer $authToken",
                RegisterDeviceTokenRequest(token = fcmToken, platform = "android")
            )
            if (resp.isSuccessful && resp.body()?.success == true) {
                Log.i(TAG, "FCM token registered on server")
            } else {
                Log.w(TAG, "Server rejected FCM token: ${resp.code()} ${resp.message()}")
            }
        } catch (e: Exception) {
            Log.w(TAG, "Failed to upload FCM token: ${e.message}")
        }
    }

    /**
     * Clear stored auth token (call on logout). Best-effort deletes the token
     * server-side as well so this device stops receiving pushes.
     */
    fun clearAuthAndUnregister(context: Context) {
        val prefs = TachlitFirebaseMessagingService.sharedPrefs(context)
        val authToken = prefs.getString(TachlitFirebaseMessagingService.KEY_AUTH_TOKEN, null)
        val fcmToken = prefs.getString(TachlitFirebaseMessagingService.KEY_PENDING_TOKEN, null)
        prefs.edit().remove(TachlitFirebaseMessagingService.KEY_AUTH_TOKEN).apply()

        if (authToken.isNullOrBlank() || fcmToken.isNullOrBlank()) return

        CoroutineScope(Dispatchers.IO).launch {
            try {
                NetworkModule.apiService.deleteDeviceToken(
                    "Bearer $authToken",
                    RegisterDeviceTokenRequest(token = fcmToken, platform = "android")
                )
            } catch (_: Exception) { /* ignore */ }
        }
    }

    private suspend fun fetchCurrentToken(): String? =
        suspendCancellableCoroutine { cont ->
            val task: Task<String> = FirebaseMessaging.getInstance().token
            task.addOnCompleteListener { t ->
                if (t.isSuccessful) cont.resume(t.result)
                else cont.resumeWithException(
                    t.exception ?: RuntimeException("Unknown FCM token error")
                )
            }
        }
}
