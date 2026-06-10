package com.example.tachlit

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.view.inputmethod.InputMethodManager
import androidx.appcompat.app.AppCompatActivity
import androidx.databinding.DataBindingUtil
import com.example.tachlit.databinding.ActivitySupervisorBinding

class SupervisorActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySupervisorBinding
    private val supervisorPassword = "123" // This should be configurable

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = DataBindingUtil.setContentView(this, R.layout.activity_supervisor)

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

        if (enteredPassword == supervisorPassword) {
            // Login successful
            hideKeyboard()
            showManagementSection()
            loadStatistics()
        } else {
            // Login failed
            binding.etSupervisorPassword.error = getString(R.string.invalid_supervisor_password)
        }
    }

    private fun showManagementSection() {
        binding.cardLogin.visibility = View.GONE
        binding.layoutManagement.visibility = View.VISIBLE
    }

    private fun loadStatistics() {
        // Load actual statistics from dummy data
        // In a real app, this would come from the database
        val learnersCount = 20 // Based on dummy data in SupervisorManagementActivity
        val teachersCount = 10 // Based on dummy data in SupervisorManagementActivity
        val pairingsCount = 0 // No pairings created yet

        binding.tvLearnersCount.text = learnersCount.toString()
        binding.tvTeachersCount.text = teachersCount.toString()
        binding.tvPairingsCount.text = pairingsCount.toString()
    }

    private fun handleViewAllUsers() {
        // Navigate to all users screen
        val intent = Intent(this, SupervisorManagementActivity::class.java)
        intent.putExtra(SupervisorManagementActivity.EXTRA_VIEW_TYPE, SupervisorManagementActivity.VIEW_ALL_USERS)
        startActivity(intent)
    }

    private fun handleViewUnmatchedLearners() {
        // Navigate to unmatched learners screen
        val intent = Intent(this, SupervisorManagementActivity::class.java)
        intent.putExtra(SupervisorManagementActivity.EXTRA_VIEW_TYPE, SupervisorManagementActivity.VIEW_UNMATCHED_LEARNERS)
        startActivity(intent)
    }

    private fun handleViewAvailableTeachers() {
        // Navigate to available teachers screen
        val intent = Intent(this, SupervisorManagementActivity::class.java)
        intent.putExtra(SupervisorManagementActivity.EXTRA_VIEW_TYPE, SupervisorManagementActivity.VIEW_AVAILABLE_TEACHERS)
        startActivity(intent)
    }

    private fun handleSuggestedMatches() {
        // Navigate to suggested matches screen
        val intent = Intent(this, SupervisorManagementActivity::class.java)
        intent.putExtra(SupervisorManagementActivity.EXTRA_VIEW_TYPE, SupervisorManagementActivity.VIEW_SUGGESTED_MATCHES)
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
