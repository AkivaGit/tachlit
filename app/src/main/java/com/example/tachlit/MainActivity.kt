package com.example.tachlit

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.cardview.widget.CardView
import androidx.core.content.ContextCompat
import com.example.tachlit.data.UserType
import com.example.tachlit.notifications.TachlitFirebaseMessagingService

class MainActivity : AppCompatActivity() {

    private val notificationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { /* result ignored — user will simply not receive pushes if denied */ }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Make sure the notification channel exists and request runtime permission
        // (only relevant on Android 13+).
        TachlitFirebaseMessagingService.ensureChannel(this)
        maybeRequestNotificationPermission()

        setupClickListeners()
    }

    private fun maybeRequestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val granted = ContextCompat.checkSelfPermission(
                this, Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
            if (!granted) {
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
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

        findViewById<CardView>(R.id.cardGroupCoordinator).setOnClickListener {
            handleRoleSelection(UserType.GROUP_COORDINATOR)
        }

        findViewById<CardView>(R.id.cardDonations).setOnClickListener {
            startActivity(Intent(this, DonationsActivity::class.java))
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
            UserType.GROUP_COORDINATOR -> {
                val intent = Intent(this, GroupCoordinatorActivity::class.java)
                startActivity(intent)
            }
        }
    }
}
