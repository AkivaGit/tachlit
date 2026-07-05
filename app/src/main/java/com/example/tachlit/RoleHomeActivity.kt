package com.example.tachlit

import android.content.Intent
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.example.tachlit.data.UserType
import com.example.tachlit.session.SessionManager

/**
 * Generic "personal home" screen shown after a volunteer role successfully
 * registers or the app is relaunched with an active session.
 *
 * Which text is shown depends on the [EXTRA_ROLE] value (a [UserType] name).
 * A logout button + a top-right logout menu entry return the user to
 * [MainActivity] and clear the persisted session.
 */
class RoleHomeActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_role_home)

        val role = intent.getStringExtra(EXTRA_ROLE)
            ?: SessionManager.getRole(this)
            ?: run {
                // No session at all — bounce to main.
                goToMain()
                return
            }

        supportActionBar?.title = getString(R.string.role_home_title)

        val name = SessionManager.getUserName(this).orEmpty()
        findViewById<TextView>(R.id.tvRoleHomeGreeting).text =
            getString(R.string.role_home_greeting, name)
        findViewById<TextView>(R.id.tvRoleHomeRole).text =
            getString(R.string.role_home_role_label, roleDisplayName(role))
        findViewById<TextView>(R.id.tvActivitiesBody).text =
            getString(R.string.role_home_activities_empty)

        findViewById<Button>(R.id.btnRoleHomeLogout).setOnClickListener { confirmLogout() }
    }

    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menu.add(0, MENU_ID_LOGOUT, 0, R.string.logout)
            .setShowAsActionFlags(MenuItem.SHOW_AS_ACTION_ALWAYS)
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        if (item.itemId == MENU_ID_LOGOUT) {
            confirmLogout()
            return true
        }
        return super.onOptionsItemSelected(item)
    }

    private fun confirmLogout() {
        AlertDialog.Builder(this)
            .setTitle(R.string.logout_confirm_title)
            .setMessage(R.string.logout_confirm_message)
            .setPositiveButton(R.string.yes) { _, _ -> doLogout() }
            .setNegativeButton(R.string.no, null)
            .show()
    }

    private fun doLogout() {
        SessionManager.logout(this)
        goToMain()
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

    @Suppress("MissingSuperCall", "OVERRIDE_DEPRECATION")
    override fun onBackPressed() {
        // Prevent going back to a registration/login screen — logging out is
        // the only way to return to the main screen.
        moveTaskToBack(true)
    }

    companion object {
        const val EXTRA_ROLE = "extra_role"
        private const val MENU_ID_LOGOUT = 200
    }
}
