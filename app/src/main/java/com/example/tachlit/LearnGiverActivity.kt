package com.example.tachlit

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.databinding.DataBindingUtil
import com.example.tachlit.databinding.ActivityLearnGiverBinding

class LearnGiverActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityLearnGiverBinding
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = DataBindingUtil.setContentView(this, R.layout.activity_learn_giver)
        
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