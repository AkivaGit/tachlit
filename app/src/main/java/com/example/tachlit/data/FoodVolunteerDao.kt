package com.example.tachlit.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface FoodVolunteerDao {
    @Query("SELECT * FROM food_volunteers WHERE id = :id")
    fun getFoodVolunteerById(id: Long): FoodVolunteer?

    @Query("SELECT * FROM food_volunteers WHERE userId = :userId")
    fun getFoodVolunteerByUserId(userId: Long): FoodVolunteer?

    @Query("SELECT * FROM food_volunteers WHERE isActive = 1")
    fun getActiveFoodVolunteers(): Flow<List<FoodVolunteer>>

    @Query("SELECT * FROM food_volunteers")
    fun getAllFoodVolunteers(): Flow<List<FoodVolunteer>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun insertFoodVolunteer(foodVolunteer: FoodVolunteer): Long

    @Update
    fun updateFoodVolunteer(foodVolunteer: FoodVolunteer)

    @Delete
    fun deleteFoodVolunteer(foodVolunteer: FoodVolunteer)
}