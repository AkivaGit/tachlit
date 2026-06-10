package com.example.tachlit.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "food_volunteers")
data class FoodVolunteer(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val userId: Long,
    val physicalCapabilities: String, // Can lift heavy boxes, standing for long periods, etc.
    val experience: String, // Previous packaging/warehouse experience
    val availableSchedule: String, // e.g., "Sunday 08:00-12:00, Tuesday 14:00-18:00"
    val transportationMethod: String, // Car, public transport, walking distance
    val dietaryRestrictions: String, // Any dietary restrictions for handling food
    val additionalNotes: String = "",
    val isActive: Boolean = true,
    val createdAt: Long = System.currentTimeMillis()
)