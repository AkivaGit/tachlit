package com.example.tachlit

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.databinding.DataBindingUtil
import androidx.lifecycle.lifecycleScope
import com.example.tachlit.data.*
import com.example.tachlit.databinding.ActivityOfficeVolunteerBinding
import com.example.tachlit.repository.TachlitRepository
import kotlinx.coroutines.launch

class OfficeVolunteerActivity : BaseActivity() {

    private lateinit var binding: ActivityOfficeVolunteerBinding
    private lateinit var repository: TachlitRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = DataBindingUtil.setContentView(this, R.layout.activity_office_volunteer)

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
        supportActionBar?.title = getString(R.string.office_volunteer_title)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
    }

    private fun setupClickListeners() {
        binding.btnRegister.setOnClickListener {
            registerOfficeVolunteer()
        }

        binding.btnCancel.setOnClickListener {
            finish()
        }
    }

    private fun registerOfficeVolunteer() {
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
                    userType = UserType.OFFICE_VOLUNTEER.name
                )

                val result = repository.registerUser(user, this@OfficeVolunteerActivity)
                hideLoading()
                if (result.isSuccess) {
                    val registeredUser = result.getOrNull()!!

                    // Create OfficeVolunteer record
                    val officeVolunteer = OfficeVolunteer(
                        userId = registeredUser.id,
                        skills = binding.etSkills.text.toString().trim(),
                        experience = binding.etExperience.text.toString().trim(),
                        availableSchedule = binding.etAvailableSchedule.text.toString().trim(),
                        preferredTasks = binding.etPreferredTasks.text.toString().trim(),
                        additionalNotes = binding.etAdditionalNotes.text.toString().trim()
                    )

                    repository.insertOfficeVolunteer(officeVolunteer)

                    Toast.makeText(this@OfficeVolunteerActivity, "Registration successful!", Toast.LENGTH_SHORT).show()
                    startActivity(
                        Intent(this@OfficeVolunteerActivity, RoleHomeActivity::class.java)
                            .putExtra(RoleHomeActivity.EXTRA_ROLE, UserType.OFFICE_VOLUNTEER.name)
                            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
                    )
                    finish()
                } else {
                    Toast.makeText(this@OfficeVolunteerActivity, "Registration failed: ${result.exceptionOrNull()?.message}", Toast.LENGTH_LONG).show()
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

        if (binding.etSkills.text.toString().trim().isEmpty()) {
            binding.etSkills.error = getString(R.string.please_fill_all_fields)
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
