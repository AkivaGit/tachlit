package com.example.tachlit.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "learn_givers")
data class LearnGiver(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val userId: Long,
    val subjectsCanTeach: String, // Comma-separated subjects they can teach
    val teachingExperience: String,
    val availableSchedule: String, // e.g., "Monday 18:00-22:00, Wednesday 19:00-21:00"
    val maxStudents: Int = 3,
    val teachingStyle: String,
    val additionalNotes: String = "",
    val currentStudentIds: String = "", // Comma-separated student IDs
    val createdAt: Long = System.currentTimeMillis()
)