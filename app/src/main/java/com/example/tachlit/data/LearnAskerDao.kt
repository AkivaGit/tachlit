package com.example.tachlit.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface LearnAskerDao {
    @Query("SELECT * FROM learn_askers WHERE id = :id")
    fun getLearnAskerById(id: Long): LearnAsker?

    @Query("SELECT * FROM learn_askers WHERE userId = :userId")
    fun getLearnAskerByUserId(userId: Long): LearnAsker?

    @Query("SELECT * FROM learn_askers WHERE isMatched = 0")
    fun getUnmatchedLearnAskers(): Flow<List<LearnAsker>>

    @Query("SELECT * FROM learn_askers WHERE assignedTeacherId = :teacherId")
    fun getLearnAskersByTeacher(teacherId: Long): Flow<List<LearnAsker>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun insertLearnAsker(learnAsker: LearnAsker): Long

    @Update
    fun updateLearnAsker(learnAsker: LearnAsker)

    @Delete
    fun deleteLearnAsker(learnAsker: LearnAsker)

    @Query("SELECT * FROM learn_askers")
    fun getAllLearnAskers(): Flow<List<LearnAsker>>
}
