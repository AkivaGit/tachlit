package com.example.tachlit.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface PairingDao {
    @Query("SELECT * FROM pairings WHERE id = :id")
    fun getPairingById(id: Long): Pairing?

    @Query("SELECT * FROM pairings WHERE learnAskerId = :learnAskerId")
    fun getPairingsByLearnAsker(learnAskerId: Long): Flow<List<Pairing>>

    @Query("SELECT * FROM pairings WHERE learnGiverId = :learnGiverId")
    fun getPairingsByLearnGiver(learnGiverId: Long): Flow<List<Pairing>>

    @Query("SELECT * FROM pairings WHERE status = :status")
    fun getPairingsByStatus(status: String): Flow<List<Pairing>>

    @Query("SELECT * FROM pairings")
    fun getAllPairings(): Flow<List<Pairing>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun insertPairing(pairing: Pairing): Long

    @Update
    fun updatePairing(pairing: Pairing)

    @Delete
    fun deletePairing(pairing: Pairing)
}
