package com.example.tachlit.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Build
import androidx.core.app.NotificationCompat
import com.example.tachlit.MainActivity
import com.example.tachlit.R
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * Receives FCM messages and displays them as system notifications.
 * Also uploads new FCM tokens to the server when they rotate.
 */
class TachlitFirebaseMessagingService : FirebaseMessagingService() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onCreate() {
        super.onCreate()
        ensureChannel(this)
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        // Save locally so the app can send it once the user is authenticated.
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString(KEY_PENDING_TOKEN, token).apply()

        // If we already have an auth token, upload immediately.
        val authToken = prefs.getString(KEY_AUTH_TOKEN, null)
        if (!authToken.isNullOrBlank()) {
            scope.launch {
                FcmTokenUploader.upload(applicationContext, authToken, token)
            }
        }
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)

        val title = message.notification?.title
            ?: message.data["title"]
            ?: getString(R.string.app_name)
        val body = message.notification?.body
            ?: message.data["body"]
            ?: ""

        showNotification(title, body, message.data)
    }

    private fun showNotification(title: String, body: String, data: Map<String, String>) {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            data.forEach { (k, v) -> putExtra(k, v) }
        }

        val pendingFlags =
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M)
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            else PendingIntent.FLAG_UPDATE_CURRENT

        val pending = PendingIntent.getActivity(this, 0, intent, pendingFlags)

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pending)
            .build()

        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.notify((System.currentTimeMillis() and 0x7fffffff).toInt(), notification)
    }

    companion object {
        const val CHANNEL_ID = "tachlit_default"
        const val PREFS_NAME = "tachlit_fcm_prefs"
        const val KEY_PENDING_TOKEN = "pending_fcm_token"
        const val KEY_AUTH_TOKEN = "auth_token"

        fun ensureChannel(context: Context) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                if (nm.getNotificationChannel(CHANNEL_ID) == null) {
                    val channel = NotificationChannel(
                        CHANNEL_ID,
                        "Tachlit notifications",
                        NotificationManager.IMPORTANCE_HIGH
                    ).apply {
                        description = "General Tachlit push notifications"
                    }
                    nm.createNotificationChannel(channel)
                }
            }
        }

        fun sharedPrefs(context: Context): SharedPreferences =
            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }
}
