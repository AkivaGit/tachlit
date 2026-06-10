package com.example.tachlit.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface OfficeVolunteerDao {
    @Query("SELECT * FROM office_volunteers WHERE id = :id")
    fun getOfficeVolunteerById(id: Long): OfficeVolunteer?

    @Query("SELECT * FROM office_volunteers WHERE userId = :userId")
    fun getOfficeVolunteerByUserId(userId: Long): OfficeVolunteer?

    @Query("SELECT * FROM office_volunteers WHERE isActive = 1")
    fun getActiveOfficeVolunteers(): Flow<List<OfficeVolunteer>>

    @Query("SELECT * FROM office_volunteers")
    fun getAllOfficeVolunteers(): Flow<List<OfficeVolunteer>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun insertOfficeVolunteer(officeVolunteer: OfficeVolunteer): Long

    @Update
    fun updateOfficeVolunteer(officeVolunteer: OfficeVolunteer)

    @Delete
    fun deleteOfficeVolunteer(officeVolunteer: OfficeVolunteer)
}