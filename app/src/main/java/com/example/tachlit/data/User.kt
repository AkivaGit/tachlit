package com.example.tachlit.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "users")
data class User(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val name: String,
    val familyName: String,
    val email: String,
    val password: String,
    val phone: String,
    val city: String,
    val userType: String
)

enum class UserType {
    LEARN_ASKER,
    LEARN_GIVER,
    OFFICE_VOLUNTEER,
    FOOD_VOLUNTEER,
    SUPERVISOR
}
