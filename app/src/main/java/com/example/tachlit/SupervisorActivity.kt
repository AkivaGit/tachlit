package com.example.tachlit

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.view.inputmethod.InputMethodManager
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.databinding.DataBindingUtil
import androidx.lifecycle.lifecycleScope
import com.example.tachlit.data.TachlitDatabase
import com.example.tachlit.databinding.ActivitySupervisorBinding
import com.example.tachlit.repository.TachlitRepository
import kotlinx.coroutines.launch

class SupervisorActivity : AppCompatActivity() {

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
    }

    private fun setupUI() {
        supportActionBar?.title = getString(R.string.supervisor_title)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
    }

    private fun setupClickListeners() {
        binding.btnLogin.setOnClickListener {
            handleLogin()
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
            try {
                val result = repository.loginSupervisor(supervisorEmail, enteredPassword)
                if (result.isSuccess) {
                    // Login successful
                    hideKeyboard()
                    showManagementSection()
                    loadStatistics()
                    Toast.makeText(this@SupervisorActivity, "Login successful", Toast.LENGTH_SHORT).show()
                } else {
                    // Login failed
                    binding.etSupervisorPassword.error = "Invalid password: ${result.exceptionOrNull()?.message}"
                    Toast.makeText(this@SupervisorActivity, "Login failed", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
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
            try {
                val result = repository.getStatistics()
                if (result.isSuccess) {
                    val stats = result.getOrNull()!!

                    // Update UI with real statistics
                    binding.tvLearnersCount.text = stats.learnAskers.toString()
                    binding.tvTeachersCount.text = stats.learnGivers.toString()
                    binding.tvPairingsCount.text = stats.totalPairings.toString()

                    println("[DEBUG_LOG] Statistics loaded - Learners: ${stats.learnAskers}, Teachers: ${stats.learnGivers}, Pairings: ${stats.totalPairings}")
                } else {
                    // Fallback to default values if server request fails
                    binding.tvLearnersCount.text = "0"
                    binding.tvTeachersCount.text = "0"
                    binding.tvPairingsCount.text = "0"

                    Toast.makeText(this@SupervisorActivity, "Failed to load statistics: ${result.exceptionOrNull()?.message}", Toast.LENGTH_SHORT).show()
                    println("[DEBUG_LOG] Failed to load statistics: ${result.exceptionOrNull()?.message}")
                }
            } catch (e: Exception) {
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
        startActivity(intent)
    }

    private fun handleViewUnmatchedLearners() {
        // Navigate to unmatched learners screen
        val intent = Intent(this, SupervisorManagementActivity::class.java)
        intent.putExtra(SupervisorManagementActivity.EXTRA_VIEW_TYPE, SupervisorManagementActivity.VIEW_UNMATCHED_LEARNERS)
        // Pass the supervisor token so the new activity can access the API
        intent.putExtra("supervisor_token", repository.getSupervisorToken())
        startActivity(intent)
    }

    private fun handleViewAvailableTeachers() {
        // Navigate to available teachers screen
        val intent = Intent(this, SupervisorManagementActivity::class.java)
        intent.putExtra(SupervisorManagementActivity.EXTRA_VIEW_TYPE, SupervisorManagementActivity.VIEW_AVAILABLE_TEACHERS)
        // Pass the supervisor token so the new activity can access the API
        intent.putExtra("supervisor_token", repository.getSupervisorToken())
        startActivity(intent)
    }

    private fun handleSuggestedMatches() {
        // Navigate to suggested matches screen
        val intent = Intent(this, SupervisorManagementActivity::class.java)
        intent.putExtra(SupervisorManagementActivity.EXTRA_VIEW_TYPE, SupervisorManagementActivity.VIEW_SUGGESTED_MATCHES)
        // Pass the supervisor token so the new activity can access the API
        intent.putExtra("supervisor_token", repository.getSupervisorToken())
        startActivity(intent)
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

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
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
