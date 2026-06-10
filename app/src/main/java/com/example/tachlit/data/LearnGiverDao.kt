package com.example.tachlit.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface LearnGiverDao {
    @Query("SELECT * FROM learn_givers WHERE id = :id")
    fun getLearnGiverById(id: Long): LearnGiver?

    @Query("SELECT * FROM learn_givers WHERE userId = :userId")
    fun getLearnGiverByUserId(userId: Long): LearnGiver?

    @Query("SELECT * FROM learn_givers")
    fun getAllLearnGivers(): Flow<List<LearnGiver>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun insertLearnGiver(learnGiver: LearnGiver): Long

    @Update
    fun updateLearnGiver(learnGiver: LearnGiver)

    @Delete
    fun deleteLearnGiver(learnGiver: LearnGiver)
}
