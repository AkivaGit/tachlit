package com.example.tachlit.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "learn_askers")
data class LearnAsker(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val userId: Long,
    val subjects: String, // Comma-separated subjects they want to learn
    val learningGoals: String,
    val preferredSchedule: String, // e.g., "Monday 18:00-20:00, Wednesday 19:00-21:00"
    val experienceLevel: String, // Beginner, Intermediate, Advanced
    val additionalNotes: String = "",
    val assignedTeacherId: Long? = null,
    val isMatched: Boolean = false,
    val createdAt: Long = System.currentTimeMillis()
)
