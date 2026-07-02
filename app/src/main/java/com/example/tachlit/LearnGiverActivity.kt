package com.example.tachlit

import android.os.Bundle
import android.widget.Toast
import androidx.databinding.DataBindingUtil
import androidx.lifecycle.lifecycleScope
import com.example.tachlit.data.*
import com.example.tachlit.databinding.ActivityLearnGiverBinding
import com.example.tachlit.repository.TachlitRepository
import kotlinx.coroutines.launch

class LearnGiverActivity : BaseActivity() {

    private lateinit var binding: ActivityLearnGiverBinding
    private lateinit var repository: TachlitRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = DataBindingUtil.setContentView(this, R.layout.activity_learn_giver)

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
        supportActionBar?.title = getString(R.string.learn_giver_title)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
    }

    private fun setupClickListeners() {
        binding.btnRegister.setOnClickListener {
            registerLearnGiver()
        }

        binding.btnCancel.setOnClickListener {
            finish()
        }
    }

    private fun registerLearnGiver() {
        // Validate input fields
        if (validateInput()) {
            lifecycleScope.launch {
                showLoading()
                val user = User(
                    name = binding.etName.text.toString().trim(),
                    familyName = binding.etFamilyName.text.toString().trim(),
                    email = binding.etEmail.text.toString().trim(),
                    password = binding.etPassword.text.toString().trim(),
                    phone = binding.etPhone.text.toString().trim(),
                    city = binding.etCity.text.toString().trim(),
                    userType = UserType.LEARN_GIVER.name
                )

                val result = repository.registerUser(user)
                hideLoading()
                if (result.isSuccess) {
                    val registeredUser = result.getOrNull()!!

                    // Create LearnGiver record
                    val maxStudents = binding.etMaxStudents.text.toString().trim().toIntOrNull() ?: 3
                    val learnGiver = LearnGiver(
                        userId = registeredUser.id,
                        subjectsCanTeach = binding.etSubjectsCanTeach.text.toString().trim(),
                        teachingExperience = binding.etTeachingExperience.text.toString().trim(),
                        availableSchedule = binding.etAvailableSchedule.text.toString().trim(),
                        maxStudents = maxStudents,
                        teachingStyle = binding.etTeachingStyle.text.toString().trim()
                    )

                    repository.insertLearnGiver(learnGiver)

                    Toast.makeText(this@LearnGiverActivity, "Registration successful!", Toast.LENGTH_SHORT).show()
                    finish()
                } else {
                    Toast.makeText(this@LearnGiverActivity, "Registration failed: ${result.exceptionOrNull()?.message}", Toast.LENGTH_LONG).show()
                }
            }
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

        if (binding.etSubjectsCanTeach.text.toString().trim().isEmpty()) {
            binding.etSubjectsCanTeach.error = getString(R.string.please_fill_all_fields)
            isValid = false
        }

        if (binding.etAvailableSchedule.text.toString().trim().isEmpty()) {
            binding.etAvailableSchedule.error = getString(R.string.please_fill_all_fields)
            isValid = false
        }

        return isValid
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}
