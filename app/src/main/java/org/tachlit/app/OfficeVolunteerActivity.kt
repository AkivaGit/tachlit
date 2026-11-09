package org.tachlit.app

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.databinding.DataBindingUtil
import androidx.lifecycle.lifecycleScope
import org.tachlit.app.data.*
import org.tachlit.app.databinding.ActivityOfficeVolunteerBinding
import org.tachlit.app.repository.TachlitRepository
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

        setupClickListeners()
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
                    showErrorDialog(
                        getString(R.string.registration_failed_title),
                        result.exceptionOrNull()?.message ?: getString(R.string.registration_failed_unknown)
                    )
                }
            }
        }
    }

    /** Shows one Hebrew + English popup listing every empty required field. */
    private fun validateInput(): Boolean = checkRequiredFields(
        listOf(
            RequiredField(binding.etName, R.string.field_name_he, R.string.field_name_en),
            RequiredField(binding.etFamilyName, R.string.field_family_name_he, R.string.field_family_name_en),
            RequiredField(binding.etEmail, R.string.field_email_he, R.string.field_email_en),
            RequiredField(binding.etPassword, R.string.field_password_he, R.string.field_password_en),
            RequiredField(binding.etPhone, R.string.field_phone_he, R.string.field_phone_en),
            RequiredField(binding.etCity, R.string.field_city_he, R.string.field_city_en),
            RequiredField(binding.etSkills, R.string.field_skills_he, R.string.field_skills_en),
            RequiredField(binding.etAvailableSchedule, R.string.field_available_schedule_he, R.string.field_available_schedule_en)
        )
    )
}
