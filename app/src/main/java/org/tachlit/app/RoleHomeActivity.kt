package org.tachlit.app

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AlertDialog
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import org.tachlit.app.data.TachlitDatabase
import org.tachlit.app.data.UserType
import org.tachlit.app.repository.TachlitRepository
import org.tachlit.app.session.SessionManager
import java.io.IOException

/**
 * Generic "personal home" screen shown after a volunteer role successfully
 * registers or the app is relaunched with an active session.
 *
 * Which text is shown depends on the [EXTRA_ROLE] value (a [UserType] name).
 * Logging out permanently deletes the user's registration on the server (and
 * the local copy), clears the persisted session and returns to [MainActivity].
 * If the deletion fails, a Hebrew + English popup explains why and the user
 * stays logged in so they can retry.
 */
class RoleHomeActivity : BaseActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_role_home)

        // Prevent going back to a registration/login screen — logging out is
        // the only way to return to the main screen.
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                moveTaskToBack(true)
            }
        })

        val role = intent.getStringExtra(EXTRA_ROLE)
            ?: SessionManager.getRole(this)
            ?: run {
                // No session at all — bounce to main.
                goToMain()
                return
            }

        val name = SessionManager.getUserName(this).orEmpty()
        findViewById<TextView>(R.id.tvRoleHomeGreeting).text =
            getString(R.string.role_home_greeting, name)
        findViewById<TextView>(R.id.tvRoleHomeRole).text =
            getString(R.string.role_home_role_label, roleDisplayName(role))
        findViewById<TextView>(R.id.tvActivitiesBody).text =
            getString(R.string.role_home_activities_empty)

        findViewById<Button>(R.id.btnRoleHomeLogout).setOnClickListener { confirmLogout() }
    }

    private fun confirmLogout() {
        AlertDialog.Builder(this)
            .setTitle(R.string.logout_confirm_title)
            .setMessage(R.string.logout_delete_confirm_message)
            .setPositiveButton(R.string.yes) { _, _ -> doLogout() }
            .setNegativeButton(R.string.no, null)
            .show()
    }

    private fun doLogout() {
        val db = TachlitDatabase.getDatabase(applicationContext)
        val repository = TachlitRepository(
            db.userDao(),
            db.learnAskerDao(),
            db.learnGiverDao(),
            db.officeVolunteerDao(),
            db.foodVolunteerDao(),
            db.pairingDao()
        )
        lifecycleScope.launch {
            showLoading()
            val result = repository.deleteRegistrationOnLogout(
                authToken = SessionManager.getAuthToken(this@RoleHomeActivity),
                userId = SessionManager.getUserId(this@RoleHomeActivity)
            )
            hideLoading()
            result
                .onSuccess {
                    SessionManager.logout(this@RoleHomeActivity)
                    goToMain()
                }
                .onFailure { error ->
                    val cause = if (error is IOException) {
                        getString(R.string.server_unreachable)
                    } else {
                        error.message ?: getString(R.string.registration_failed_unknown)
                    }
                    showErrorDialog(getString(R.string.logout_failed_title), cause)
                }
        }
    }

    private fun goToMain() {
        val intent = Intent(this, MainActivity::class.java)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
        startActivity(intent)
        finish()
    }

    private fun roleDisplayName(role: String): String = when (role) {
        UserType.LEARN_ASKER.name -> getString(R.string.role_learn_asker)
        UserType.LEARN_GIVER.name -> getString(R.string.role_learn_giver)
        UserType.OFFICE_VOLUNTEER.name -> getString(R.string.role_office_volunteer)
        UserType.FOOD_VOLUNTEER.name -> getString(R.string.role_food_volunteer)
        UserType.GROUP_COORDINATOR.name -> getString(R.string.role_group_coordinator)
        UserType.SUPERVISOR.name -> getString(R.string.role_supervisor)
        else -> role
    }

    companion object {
        const val EXTRA_ROLE = "extra_role"
    }
}
