package com.example.tachlit.session

import android.content.Context
import android.content.Intent
import com.example.tachlit.MainActivity
import com.example.tachlit.RoleHomeActivity
import com.example.tachlit.SupervisorActivity
import com.example.tachlit.data.UserType
import com.example.tachlit.notifications.FcmTokenUploader
import com.example.tachlit.notifications.TachlitFirebaseMessagingService

/**
 * Small wrapper around the FCM SharedPreferences file that keeps the current
 * "logged in" session (user id, name, role, jwt).
 *
 * A session is considered active when we have a role stored. The role is used
 * on app launch (from [com.example.tachlit.SplashActivity]) to decide which
 * screen to open: the supervisor screen for supervisors and the generic
 * [RoleHomeActivity] for every volunteer role.
 */
object SessionManager {

    private const val KEY_ROLE = "session_role"
    private const val KEY_USER_ID = "session_user_id"
    private const val KEY_USER_NAME = "session_user_name"

    private fun prefs(context: Context) =
        TachlitFirebaseMessagingService.sharedPrefs(context.applicationContext)

    /**
     * Persist a logged-in session. The FCM auth token is stored separately by
     * [FcmTokenUploader.saveAuthTokenAndUpload]; this only stores the identity.
     */
    fun saveSession(context: Context, userId: Long, name: String, role: String) {
        prefs(context).edit()
            .putString(KEY_ROLE, role)
            .putLong(KEY_USER_ID, userId)
            .putString(KEY_USER_NAME, name)
            .apply()
    }

    fun getRole(context: Context): String? = prefs(context).getString(KEY_ROLE, null)
    fun getUserName(context: Context): String? = prefs(context).getString(KEY_USER_NAME, null)
    fun getUserId(context: Context): Long = prefs(context).getLong(KEY_USER_ID, -1L)
    fun isLoggedIn(context: Context): Boolean = !getRole(context).isNullOrBlank()

    /**
     * Clear the session on the device and best-effort tell the server to
     * unregister this device's FCM token so it stops receiving pushes.
     */
    fun logout(context: Context) {
        FcmTokenUploader.clearAuthAndUnregister(context.applicationContext)
        prefs(context).edit()
            .remove(KEY_ROLE)
            .remove(KEY_USER_ID)
            .remove(KEY_USER_NAME)
            .apply()
    }

    /**
     * Start the correct home activity for the currently stored role.
     * If no role is stored, opens [MainActivity].
     */
    fun startHomeForCurrentRole(context: Context) {
        val role = getRole(context)
        val intent = when (role) {
            null -> Intent(context, MainActivity::class.java)
            UserType.SUPERVISOR.name -> Intent(context, SupervisorActivity::class.java)
                .putExtra(SupervisorActivity.EXTRA_AUTO_LOGIN, true)
            else -> Intent(context, RoleHomeActivity::class.java)
                .putExtra(RoleHomeActivity.EXTRA_ROLE, role)
        }
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
        context.startActivity(intent)
    }
}
