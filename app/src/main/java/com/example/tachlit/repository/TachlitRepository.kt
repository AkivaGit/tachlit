package com.example.tachlit.repository

import com.example.tachlit.data.*
import kotlinx.coroutines.flow.Flow

class TachlitRepository(
    private val userDao: UserDao,
    private val learnAskerDao: LearnAskerDao,
    private val learnGiverDao: LearnGiverDao,
    private val pairingDao: PairingDao
) {
    // User operations
    fun registerUser(user: User): Long {
        return userDao.insertUser(user)
    }

    fun getAllUsers(): Flow<List<User>> {
        return userDao.getAllUsers()
    }

    fun getUserById(id: Long): User? {
        return userDao.getUserById(id)
    }

    // LearnAsker operations
    fun insertLearnAsker(learnAsker: LearnAsker): Long {
        return learnAskerDao.insertLearnAsker(learnAsker)
    }

    fun getAllLearnAskers(): Flow<List<LearnAsker>> {
        return learnAskerDao.getAllLearnAskers()
    }

    fun getUnmatchedLearnAskers(): Flow<List<LearnAsker>> {
        return learnAskerDao.getUnmatchedLearnAskers()
    }

    // LearnGiver operations
    fun insertLearnGiver(learnGiver: LearnGiver): Long {
        return learnGiverDao.insertLearnGiver(learnGiver)
    }

    fun getAllLearnGivers(): Flow<List<LearnGiver>> {
        return learnGiverDao.getAllLearnGivers()
    }

    // Pairing operations
    fun insertPairing(pairing: Pairing): Long {
        return pairingDao.insertPairing(pairing)
    }

    fun getAllPairings(): Flow<List<Pairing>> {
        return pairingDao.getAllPairings()
    }
}
