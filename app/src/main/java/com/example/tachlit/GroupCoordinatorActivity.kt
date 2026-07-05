package com.example.tachlit

import android.content.Intent
import android.os.Bundle
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.databinding.DataBindingUtil
import androidx.lifecycle.lifecycleScope
import com.example.tachlit.data.*
import com.example.tachlit.databinding.ActivityGroupCoordinatorBinding
import com.example.tachlit.repository.TachlitRepository
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
        supportActionBar?.title = getString(R.string.group_coordinator_title)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

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
                    Toast.makeText(this@GroupCoordinatorActivity, "Registration failed: ${result.exceptionOrNull()?.message}", Toast.LENGTH_LONG).show()
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
        if (binding.etGroupName.text.toString().trim().isEmpty()) {
            binding.etGroupName.error = getString(R.string.please_fill_all_fields)
            isValid = false
        }
        if (binding.actvGroupType.text.toString().trim().isEmpty()) {
            binding.actvGroupType.error = getString(R.string.please_fill_all_fields)
            isValid = false
        }
        if (binding.etParticipantsCount.text.toString().trim().isEmpty()) {
            binding.etParticipantsCount.error = getString(R.string.please_fill_all_fields)
            isValid = false
        }

        return isValid
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}
