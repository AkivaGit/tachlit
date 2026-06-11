package com.example.tachlit

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.databinding.DataBindingUtil
import androidx.lifecycle.lifecycleScope
import com.example.tachlit.data.*
import com.example.tachlit.databinding.ActivityLearnAskerBinding
import com.example.tachlit.repository.TachlitRepository
import kotlinx.coroutines.launch

class LearnAskerActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLearnAskerBinding
    private lateinit var repository: TachlitRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = DataBindingUtil.setContentView(this, R.layout.activity_learn_asker)

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
        supportActionBar?.title = getString(R.string.learn_asker_title)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
    }

    private fun setupClickListeners() {
        binding.btnRegister.setOnClickListener {
            registerLearnAsker()
        }

        binding.btnCancel.setOnClickListener {
            finish()
        }
    }

    private fun registerLearnAsker() {
        // Validate input fields
        if (validateInput()) {
            lifecycleScope.launch {
                val user = User(
                    name = binding.etName.text.toString().trim(),
                    familyName = binding.etFamilyName.text.toString().trim(),
                    email = binding.etEmail.text.toString().trim(),
                    password = binding.etPassword.text.toString().trim(),
                    phone = binding.etPhone.text.toString().trim(),
                    city = binding.etCity.text.toString().trim(),
                    userType = UserType.LEARN_ASKER.name
                )

                val result = repository.registerUser(user)
                if (result.isSuccess) {
                    val registeredUser = result.getOrNull()!!

                    // Create LearnAsker record
                    val learnAsker = LearnAsker(
                        userId = registeredUser.id,
                        subjects = binding.etSubjectsToLearn.text.toString().trim(),
                        learningGoals = binding.etLearningGoals.text.toString().trim(),
                        preferredSchedule = binding.etPreferredSchedule.text.toString().trim(),
                        experienceLevel = getSelectedExperienceLevel(),
                        additionalNotes = binding.etAdditionalNotes.text.toString().trim()
                    )

                    repository.insertLearnAsker(learnAsker)

                    Toast.makeText(this@LearnAskerActivity, "Registration successful!", Toast.LENGTH_SHORT).show()
                    finish()
                } else {
                    Toast.makeText(this@LearnAskerActivity, "Registration failed: ${result.exceptionOrNull()?.message}", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    private fun getSelectedExperienceLevel(): String {
        val selectedPosition = binding.spinnerExperienceLevel.selectedItemPosition
        return when (selectedPosition) {
            0 -> "Beginner"
            1 -> "Intermediate"
            2 -> "Advanced"
            else -> "Beginner"
        }
    }

    private fun validateInput(): Boolean {
        var isValid = true

        if (binding.etName.text.toString().trim().isEmpty()) {
            binding.etName.error = getString(R.string.please_fill_all_fields)
            isValid = false
        }

        if (binding.etFamilyName.text.toString().trim().isEmpty()) {
            binding.etFamilyName.error = getString(R.string.please_fill_all_fields)
            isValid = false
        }

        if (binding.etEmail.text.toString().trim().isEmpty()) {
            binding.etEmail.error = getString(R.string.please_fill_all_fields)
            isValid = false
        }

        if (binding.etPassword.text.toString().trim().isEmpty()) {
            binding.etPassword.error = getString(R.string.please_fill_all_fields)
            isValid = false
        }

        if (binding.etPhone.text.toString().trim().isEmpty()) {
            binding.etPhone.error = getString(R.string.please_fill_all_fields)
            isValid = false
        }

        if (binding.etCity.text.toString().trim().isEmpty()) {
            binding.etCity.error = getString(R.string.please_fill_all_fields)
            isValid = false
        }

        return isValid
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}
