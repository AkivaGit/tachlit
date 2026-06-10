package com.example.tachlit

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.databinding.DataBindingUtil
import com.example.tachlit.databinding.ActivityOfficeVolunteerBinding

class OfficeVolunteerActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityOfficeVolunteerBinding
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = DataBindingUtil.setContentView(this, R.layout.activity_office_volunteer)
        
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
            // TODO: Save to database and handle registration
            // For now, just show success message and finish
            // Toast.makeText(this, getString(R.string.registration_successful), Toast.LENGTH_SHORT).show()
            finish()
        }
    }
    
    private fun validateInput(): Boolean {
        var isValid = true
        
        if (binding.etName.text.toString().trim().isEmpty()) {
            binding.etName.error = getString(R.string.please_fill_all_fields)
            isValid = false
        }
        
        if (binding.etEmail.text.toString().trim().isEmpty()) {
            binding.etEmail.error = getString(R.string.please_fill_all_fields)
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