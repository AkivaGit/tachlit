package org.tachlit.app

import android.content.Intent
import android.os.Bundle
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.databinding.DataBindingUtil
import androidx.lifecycle.lifecycleScope
import org.tachlit.app.data.*
import org.tachlit.app.databinding.ActivityGroupCoordinatorBinding
import org.tachlit.app.repository.TachlitRepository
import kotlinx.coroutines.launch

class GroupCoordinatorActivity : BaseActivity() {

    private lateinit var binding: ActivityGroupCoordinatorBinding
    private lateinit var repository: TachlitRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = DataBindingUtil.setContentView(this, R.layout.activity_group_coordinator)

        // Initialize repository (using a simplified initialization for now if possible)
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
        val groupTypes = resources.getStringArray(R.array.group_types)
        val adapter = ArrayAdapter(this, android.R.layout.simple_dropdown_item_1line, groupTypes)
        binding.actvGroupType.setAdapter(adapter)
    }

    private fun setupClickListeners() {
        binding.btnRegister.setOnClickListener {
            registerGroupCoordinator()
        }

        binding.btnCancel.setOnClickListener {
            finish()
        }
    }

    private fun registerGroupCoordinator() {
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
                    userType = UserType.GROUP_COORDINATOR.name
                )

                val result = repository.registerUser(user, this@GroupCoordinatorActivity)
                hideLoading()
                if (result.isSuccess) {
                    Toast.makeText(this@GroupCoordinatorActivity, getString(R.string.registration_successful), Toast.LENGTH_SHORT).show()
                    startActivity(
                        Intent(this@GroupCoordinatorActivity, RoleHomeActivity::class.java)
                            .putExtra(RoleHomeActivity.EXTRA_ROLE, UserType.GROUP_COORDINATOR.name)
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
            RequiredField(binding.etGroupName, R.string.field_group_name_he, R.string.field_group_name_en),
            RequiredField(binding.actvGroupType, R.string.field_group_type_he, R.string.field_group_type_en),
            RequiredField(binding.etParticipantsCount, R.string.field_participants_count_he, R.string.field_participants_count_en)
        )
    )
}
