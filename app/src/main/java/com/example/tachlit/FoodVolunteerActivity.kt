package com.example.tachlit

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.databinding.DataBindingUtil
import androidx.lifecycle.lifecycleScope
import com.example.tachlit.data.*
import com.example.tachlit.databinding.ActivityFoodVolunteerBinding
import com.example.tachlit.repository.TachlitRepository
import kotlinx.coroutines.launch

class FoodVolunteerActivity : BaseActivity() {

    private lateinit var binding: ActivityFoodVolunteerBinding
    private lateinit var repository: TachlitRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = DataBindingUtil.setContentView(this, R.layout.activity_food_volunteer)

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
        supportActionBar?.title = getString(R.string.food_volunteer_title)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
    }

    private fun setupClickListeners() {
        binding.btnRegister.setOnClickListener {
            registerFoodVolunteer()
        }

        binding.btnCancel.setOnClickListener {
            finish()
        }
    }

    private fun registerFoodVolunteer() {
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
                    userType = UserType.FOOD_VOLUNTEER.name
                )

                val result = repository.registerUser(user, this@FoodVolunteerActivity)
                hideLoading()
                if (result.isSuccess) {
                    val registeredUser = result.getOrNull()!!

                    // Create FoodVolunteer record
                    val foodVolunteer = FoodVolunteer(
                        userId = registeredUser.id,
                        physicalCapabilities = binding.etPhysicalCapabilities.text.toString().trim(),
                        experience = binding.etExperience.text.toString().trim(),
                        availableSchedule = binding.etAvailableSchedule.text.toString().trim(),
                        transportationMethod = binding.etTransportationMethod.text.toString().trim(),
                        dietaryRestrictions = binding.etDietaryRestrictions.text.toString().trim(),
                        additionalNotes = binding.etAdditionalNotes.text.toString().trim()
                    )

                    repository.insertFoodVolunteer(foodVolunteer)

                    Toast.makeText(this@FoodVolunteerActivity, "Registration successful!", Toast.LENGTH_SHORT).show()
                    startActivity(
                        Intent(this@FoodVolunteerActivity, RoleHomeActivity::class.java)
                            .putExtra(RoleHomeActivity.EXTRA_ROLE, UserType.FOOD_VOLUNTEER.name)
                            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
                    )
                    finish()
                } else {
                    Toast.makeText(this@FoodVolunteerActivity, "Registration failed: ${result.exceptionOrNull()?.message}", Toast.LENGTH_LONG).show()
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

        if (binding.etPhysicalCapabilities.text.toString().trim().isEmpty()) {
            binding.etPhysicalCapabilities.error = getString(R.string.please_fill_all_fields)
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
