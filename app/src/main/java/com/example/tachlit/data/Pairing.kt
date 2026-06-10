package com.example.tachlit.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "pairings")
data class Pairing(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val learnAskerId: Long,
    val learnGiverId: Long,
    val subject: String,
    val status: String,
    val createdAt: Long = System.currentTimeMillis(),
    val supervisorId: Long,
    val notes: String = ""
)

enum class PairingStatus {
    PENDING,
    ACTIVE,
    COMPLETED,
    CANCELLED
}
