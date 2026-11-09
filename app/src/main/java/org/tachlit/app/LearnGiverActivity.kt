package org.tachlit.app

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.databinding.DataBindingUtil
import androidx.lifecycle.lifecycleScope
import org.tachlit.app.data.*
import org.tachlit.app.databinding.ActivityLearnGiverBinding
import org.tachlit.app.repository.TachlitRepository
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

        setupClickListeners()
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

                val result = repository.registerUser(user, this@LearnGiverActivity)
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
                    startActivity(
                        Intent(this@LearnGiverActivity, RoleHomeActivity::class.java)
                            .putExtra(RoleHomeActivity.EXTRA_ROLE, UserType.LEARN_GIVER.name)
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
            RequiredField(binding.etSubjectsCanTeach, R.string.field_subjects_can_teach_he, R.string.field_subjects_can_teach_en),
            RequiredField(binding.etAvailableSchedule, R.string.field_available_schedule_he, R.string.field_available_schedule_en)
        )
    )
}
