package com.example.tachlit

import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.CheckBox
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.Toolbar
import androidx.lifecycle.lifecycleScope
import com.example.tachlit.data.TachlitDatabase
import com.example.tachlit.repository.TachlitRepository
import kotlinx.coroutines.launch

/**
 * Simple screen for the SUPERVISOR to send a push notification broadcast
 * to one or more role groups (teachers, students, office volunteers, ...).
 *
 * Uses the same supervisor JWT already stored in [TachlitRepository]. If the
 * repository has no token (e.g. the user re-opened the app without logging in),
 * a friendly error is shown.
 */
class SupervisorSendNotificationActivity : AppCompatActivity() {

    private lateinit var repository: TachlitRepository

    // Order matches the CHECK constraint on users.user_type in the DB.
    private val roleKeys = listOf(
        "LEARN_ASKER",
        "LEARN_GIVER",
        "OFFICE_VOLUNTEER",
        "FOOD_VOLUNTEER",
        "GROUP_COORDINATOR",
        "SUPERVISOR"
    )
    private val roleLabels = listOf(
        "Learn askers (students)",
        "Learn givers (teachers)",
        "Office volunteers",
        "Food volunteers",
        "Group coordinators",
        "Supervisors"
    )

    private val checkboxes = mutableListOf<CheckBox>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_supervisor_send_notification)

        // Toolbar
        findViewById<Toolbar?>(R.id.toolbar)?.let {
            setSupportActionBar(it)
            supportActionBar?.setDisplayHomeAsUpEnabled(true)
            supportActionBar?.title = getString(R.string.send_notification_title)
        }

        val db = TachlitDatabase.getDatabase(applicationContext)
        repository = TachlitRepository(
            userDao = db.userDao(),
            learnAskerDao = db.learnAskerDao(),
            learnGiverDao = db.learnGiverDao(),
            officeVolunteerDao = db.officeVolunteerDao(),
            foodVolunteerDao = db.foodVolunteerDao(),
            pairingDao = db.pairingDao()
        )

        val titleInput = findViewById<EditText>(R.id.editTitle)
        val bodyInput = findViewById<EditText>(R.id.editBody)
        val rolesContainer = findViewById<android.widget.LinearLayout>(R.id.rolesContainer)
        val progress = findViewById<ProgressBar>(R.id.progress)
        val sendBtn = findViewById<Button>(R.id.btnSend)

        // Dynamically add a checkbox for each role
        roleKeys.forEachIndexed { idx, _ ->
            val cb = CheckBox(this).apply {
                text = roleLabels[idx]
                textSize = 16f
            }
            checkboxes.add(cb)
            rolesContainer.addView(cb)
        }

        sendBtn.setOnClickListener {
            val title = titleInput.text.toString().trim()
            val body = bodyInput.text.toString().trim()
            if (title.isEmpty() || body.isEmpty()) {
                Toast.makeText(this, R.string.send_notification_missing_fields, Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            val selectedRoles = checkboxes
                .mapIndexedNotNull { i, cb -> if (cb.isChecked) roleKeys[i] else null }
            if (selectedRoles.isEmpty()) {
                Toast.makeText(this, R.string.send_notification_no_role, Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            progress.visibility = View.VISIBLE
            sendBtn.isEnabled = false

            lifecycleScope.launch {
                val result = repository.sendPushToRoles(selectedRoles, title, body)
                progress.visibility = View.GONE
                sendBtn.isEnabled = true
                result.fold(
                    onSuccess = { resp ->
                        val sent = resp.sent ?: 0
                        val failed = resp.failed ?: 0
                        Toast.makeText(
                            this@SupervisorSendNotificationActivity,
                            "Sent: $sent, failed: $failed",
                            Toast.LENGTH_LONG
                        ).show()
                    },
                    onFailure = { err ->
                        Toast.makeText(
                            this@SupervisorSendNotificationActivity,
                            err.message ?: "Failed to send notification",
                            Toast.LENGTH_LONG
                        ).show()
                    }
                )
            }
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}
