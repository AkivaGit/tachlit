package com.example.tachlit

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.cardview.widget.CardView
import com.example.tachlit.data.UserType

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        setupClickListeners()
    }

    private fun setupClickListeners() {
        findViewById<CardView>(R.id.cardLearnAsker).setOnClickListener {
            // TODO: Navigate to Learn Asker registration
            handleRoleSelection(UserType.LEARN_ASKER)
        }

        findViewById<CardView>(R.id.cardLearnGiver).setOnClickListener {
            // TODO: Navigate to Learn Giver registration
            handleRoleSelection(UserType.LEARN_GIVER)
        }

        findViewById<CardView>(R.id.cardOfficeVolunteer).setOnClickListener {
            // TODO: Navigate to Office Volunteer registration
            handleRoleSelection(UserType.OFFICE_VOLUNTEER)
        }

        findViewById<CardView>(R.id.cardFoodVolunteer).setOnClickListener {
            // TODO: Navigate to Food Volunteer registration
            handleRoleSelection(UserType.FOOD_VOLUNTEER)
        }

        findViewById<CardView>(R.id.cardSupervisor).setOnClickListener {
            // TODO: Navigate to Supervisor login
            handleRoleSelection(UserType.SUPERVISOR)
        }
    }

    private fun handleRoleSelection(userType: UserType) {
        when (userType) {
            UserType.LEARN_ASKER -> {
                val intent = Intent(this, LearnAskerActivity::class.java)
                startActivity(intent)
            }
            UserType.LEARN_GIVER -> {
                val intent = Intent(this, LearnGiverActivity::class.java)
                startActivity(intent)
            }
            UserType.OFFICE_VOLUNTEER -> {
                val intent = Intent(this, OfficeVolunteerActivity::class.java)
                startActivity(intent)
            }
            UserType.FOOD_VOLUNTEER -> {
                val intent = Intent(this, FoodVolunteerActivity::class.java)
                startActivity(intent)
            }
            UserType.SUPERVISOR -> {
                val intent = Intent(this, SupervisorActivity::class.java)
                startActivity(intent)
            }
        }
    }
}
