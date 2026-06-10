package com.example.tachlit.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "office_volunteers")
data class OfficeVolunteer(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val userId: Long,
    val skills: String, // Computer skills, languages, etc.
    val experience: String, // Previous office work experience
    val availableSchedule: String, // e.g., "Monday 09:00-17:00, Wednesday 10:00-14:00"
    val preferredTasks: String, // Data entry, phone calls, filing, etc.
    val additionalNotes: String = "",
    val isActive: Boolean = true,
    val createdAt: Long = System.currentTimeMillis()
)