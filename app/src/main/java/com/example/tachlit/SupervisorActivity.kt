package com.example.tachlit

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.MotionEvent
import android.view.View
import android.view.inputmethod.InputMethodManager
import android.widget.Toast
import androidx.databinding.DataBindingUtil
import androidx.lifecycle.lifecycleScope
import com.example.tachlit.data.TachlitDatabase
import android.view.Menu
import android.view.MenuItem
import com.example.tachlit.databinding.ActivitySupervisorBinding
import androidx.appcompat.app.AlertDialog
import com.example.tachlit.data.UserType
import com.example.tachlit.notifications.FcmTokenUploader
import com.example.tachlit.repository.TachlitRepository
import com.example.tachlit.session.SessionManager
import kotlinx.coroutines.launch

class SupervisorActivity : BaseActivity() {

    private lateinit var binding: ActivitySupervisorBinding
    private lateinit var repository: TachlitRepository
    private val supervisorEmail = "supervisor@tachlit.com" // Default supervisor email
    private val supervisorPassword = "admin123" // Default supervisor password

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = DataBindingUtil.setContentView(this, R.layout.activity_supervisor)

        // Initialize repository
        val database = TachlitDatabase.getDatabase(this)
        repository = TachlitRepository(
            database.userDao(),
            database.learnAskerDao(),
            database.learnGiverDao(),
            database.officeVolunteerDao(),
            database.foodVolunteerDao(),
            database.pairingDao()
        )

        setupUI()
        setupClickListeners()

        // Auto-login flow: if this activity was opened from the splash with an
        // active supervisor session, log the supervisor in automatically.
        if (intent.getBooleanExtra(EXTRA_AUTO_LOGIN, false) &&
            SessionManager.getRole(this) == UserType.SUPERVISOR.name) {
            binding.etSupervisorPassword.setText(supervisorPassword)
            handleLogin()
        }
    }

    private fun setupUI() {
        supportActionBar?.title = getString(R.string.supervisor_title)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
    }

    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        // Only show the "send push notification" entry after supervisor login
        // (i.e. when the management section is visible / we have a token).
        if (repository.getSupervisorToken() != null) {
            menu.add(0, MENU_ID_SEND_PUSH, 0, R.string.supervisor_send_notification_button)
                .setShowAsActionFlags(MenuItem.SHOW_AS_ACTION_ALWAYS)
            menu.add(0, MENU_ID_LOGOUT, 1, R.string.logout)
                .setShowAsActionFlags(MenuItem.SHOW_AS_ACTION_ALWAYS)
        }
        return super.onCreateOptionsMenu(menu)
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        if (item.itemId == MENU_ID_SEND_PUSH) {
            startActivity(Intent(this, SupervisorSendNotificationActivity::class.java))
            return true
        }
        if (item.itemId == MENU_ID_LOGOUT) {
            confirmLogout()
            return true
        }
        return super.onOptionsItemSelected(item)
    }

    @SuppressLint("ClickableViewAccessibility")
    private fun setupClickListeners() {
        binding.btnLogin.setOnClickListener {
            handleLogin()
        }

        // Hidden feature: touch-and-hold the header for 5 seconds to auto-login with admin123
        val secretHandler = Handler(Looper.getMainLooper())
        val secretRunnable = Runnable {
            binding.etSupervisorPassword.setText("admin123")
            handleLogin()
        }
        binding.cardSupervisorHeader.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> secretHandler.postDelayed(secretRunnable, 5000)
                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> secretHandler.removeCallbacks(secretRunnable)
            }
            false
        }

        binding.btnViewAllUsers.setOnClickListener {
            // TODO: Navigate to all users list
            handleViewAllUsers()
        }

        binding.btnViewUnmatchedLearners.setOnClickListener {
            // TODO: Navigate to unmatched learners list
            handleViewUnmatchedLearners()
        }

        binding.btnViewAvailableTeachers.setOnClickListener {
            // TODO: Navigate to available teachers list
            handleViewAvailableTeachers()
        }

        binding.btnSuggestedMatches.setOnClickListener {
            // TODO: Navigate to suggested matches
            handleSuggestedMatches()
        }

        binding.btnApplyFilter.setOnClickListener {
            // TODO: Apply city filter
            handleApplyFilter()
        }
    }

    private fun handleLogin() {
        val enteredPassword = binding.etSupervisorPassword.text.toString().trim()

        if (enteredPassword.isEmpty()) {
            binding.etSupervisorPassword.error = getString(R.string.please_fill_all_fields)
            return
        }

        // Authenticate with server
        lifecycleScope.launch {
            showLoading()
            try {
                val result = repository.loginSupervisor(supervisorEmail, enteredPassword)
                hideLoading()
                if (result.isSuccess) {
                    // Login successful
                    hideKeyboard()
                    showManagementSection()
                    loadStatistics()
                    // Save auth token + upload FCM device token so this device
                    // starts receiving supervisor push notifications.
                    val jwt = result.getOrNull()
                    if (!jwt.isNullOrBlank()) {
                        FcmTokenUploader.saveAuthTokenAndUpload(applicationContext, jwt)
                    }
                    // Persist supervisor session so this device stays logged
                    // in across app restarts.
                    SessionManager.saveSession(
                        this@SupervisorActivity,
                        userId = -1L,
                        name = getString(R.string.supervisor_title),
                        role = UserType.SUPERVISOR.name
                    )
                    // Reveal the "send notification" menu item
                    invalidateOptionsMenu()
                    Toast.makeText(this@SupervisorActivity, "Login successful", Toast.LENGTH_SHORT).show()
                } else {
                    // Login failed
                    binding.etSupervisorPassword.error = "Invalid password: ${result.exceptionOrNull()?.message}"
                    Toast.makeText(this@SupervisorActivity, "Login failed", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                hideLoading()
                binding.etSupervisorPassword.error = "Login error: ${e.message}"
                Toast.makeText(this@SupervisorActivity, "Login error: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun showManagementSection() {
        binding.cardLogin.visibility = View.GONE
        binding.layoutManagement.visibility = View.VISIBLE
    }

    private fun loadStatistics() {
        // Load real statistics from server
        lifecycleScope.launch {
            showLoading()
            try {
                val result = repository.getStatistics()
                hideLoading()
                if (result.isSuccess) {
                    val stats = result.getOrNull()!!

                    // Update UI with real statistics
                    binding.tvLearnersCount.text = stats.learnAskers.toString()
                    binding.tvTeachersCount.text = stats.learnGivers.toString()
                    binding.tvPairingsCount.text = stats.totalPairings.toString()

                    println("[DEBUG_LOG] Statistics loaded - Learners: ${stats.learnAskers}, Teachers: ${stats.learnGivers}, Pairings: ${stats.totalPairings}")
                } else {
                    hideLoading()
                    // Fallback to default values if server request fails
                    binding.tvLearnersCount.text = "0"
                    binding.tvTeachersCount.text = "0"
                    binding.tvPairingsCount.text = "0"

                    Toast.makeText(this@SupervisorActivity, "Failed to load statistics: ${result.exceptionOrNull()?.message}", Toast.LENGTH_SHORT).show()
                    println("[DEBUG_LOG] Failed to load statistics: ${result.exceptionOrNull()?.message}")
                }
            } catch (e: Exception) {
                hideLoading()
                // Fallback to default values if there's an error
                binding.tvLearnersCount.text = "0"
                binding.tvTeachersCount.text = "0"
                binding.tvPairingsCount.text = "0"

                Toast.makeText(this@SupervisorActivity, "Error loading statistics: ${e.message}", Toast.LENGTH_SHORT).show()
                println("[DEBUG_LOG] Error loading statistics: ${e.message}")
            }
        }
    }

    private fun handleViewAllUsers() {
        // Navigate to all users screen
        val intent = Intent(this, SupervisorManagementActivity::class.java)
        intent.putExtra(SupervisorManagementActivity.EXTRA_VIEW_TYPE, SupervisorManagementActivity.VIEW_ALL_USERS)
        // Pass the supervisor token so the new activity can access the API
        intent.putExtra("supervisor_token", repository.getSupervisorToken())
        startActivityForResult(intent, REQUEST_CODE_MANAGEMENT)
    }

    private fun handleViewUnmatchedLearners() {
        // Navigate to unmatched learners screen
        val intent = Intent(this, SupervisorManagementActivity::class.java)
        intent.putExtra(SupervisorManagementActivity.EXTRA_VIEW_TYPE, SupervisorManagementActivity.VIEW_UNMATCHED_LEARNERS)
        // Pass the supervisor token so the new activity can access the API
        intent.putExtra("supervisor_token", repository.getSupervisorToken())
        startActivityForResult(intent, REQUEST_CODE_MANAGEMENT)
    }

    private fun handleViewAvailableTeachers() {
        // Navigate to available teachers screen
        val intent = Intent(this, SupervisorManagementActivity::class.java)
        intent.putExtra(SupervisorManagementActivity.EXTRA_VIEW_TYPE, SupervisorManagementActivity.VIEW_AVAILABLE_TEACHERS)
        // Pass the supervisor token so the new activity can access the API
        intent.putExtra("supervisor_token", repository.getSupervisorToken())
        startActivityForResult(intent, REQUEST_CODE_MANAGEMENT)
    }

    private fun handleSuggestedMatches() {
        // Navigate to suggested matches screen
        val intent = Intent(this, SupervisorManagementActivity::class.java)
        intent.putExtra(SupervisorManagementActivity.EXTRA_VIEW_TYPE, SupervisorManagementActivity.VIEW_SUGGESTED_MATCHES)
        // Pass the supervisor token so the new activity can access the API
        intent.putExtra("supervisor_token", repository.getSupervisorToken())
        startActivityForResult(intent, REQUEST_CODE_MANAGEMENT)
    }

    private fun handleApplyFilter() {
        val cityFilter = binding.etCityFilter.text.toString().trim()
        if (cityFilter.isNotEmpty()) {
            // TODO: Apply city filter to current view
            // This would filter the displayed users/matches by city
        }
    }

    private fun hideKeyboard() {
        val inputMethodManager = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
        val currentFocusedView = currentFocus
        if (currentFocusedView != null) {
            inputMethodManager.hideSoftInputFromWindow(currentFocusedView.windowToken, 0)
        }
    }

    override fun onResume() {
        super.onResume()
        // Refresh statistics when returning to this activity
        if (binding.layoutManagement.visibility == View.VISIBLE) {
            loadStatistics()
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQUEST_CODE_MANAGEMENT && resultCode == RESULT_OK) {
            // Refresh statistics when returning from management activity
            loadStatistics()
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }

    private fun confirmLogout() {
        AlertDialog.Builder(this)
            .setTitle(R.string.logout_confirm_title)
            .setMessage(R.string.logout_confirm_message)
            .setPositiveButton(R.string.yes) { _, _ ->
                SessionManager.logout(this)
                val i = Intent(this, MainActivity::class.java)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
                startActivity(i)
                finish()
            }
            .setNegativeButton(R.string.no, null)
            .show()
    }

    companion object {
        const val EXTRA_AUTO_LOGIN = "extra_auto_login"
        private const val REQUEST_CODE_MANAGEMENT = 1001
        private const val MENU_ID_SEND_PUSH = 100
        private const val MENU_ID_LOGOUT = 101
    }

    override fun onBackPressed() {
        if (binding.layoutManagement.visibility == View.VISIBLE) {
            // If management section is visible, go back to login
            binding.layoutManagement.visibility = View.GONE
            binding.cardLogin.visibility = View.VISIBLE
            binding.etSupervisorPassword.text?.clear()
        } else {
            super.onBackPressed()
        }
    }
}
