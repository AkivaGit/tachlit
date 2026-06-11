package com.example.tachlit.repository

import com.example.tachlit.data.*
import com.example.tachlit.network.NetworkModule
import com.example.tachlit.network.RegisterRequest
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

class TachlitRepository(
    private val userDao: UserDao,
    private val learnAskerDao: LearnAskerDao,
    private val learnGiverDao: LearnGiverDao,
    private val officeVolunteerDao: OfficeVolunteerDao,
    private val foodVolunteerDao: FoodVolunteerDao,
    private val pairingDao: PairingDao
) {
    private val apiService = NetworkModule.apiService

    // Store supervisor token for admin operations
    private var supervisorToken: String? = null

    fun setSupervisorToken(token: String) {
        supervisorToken = token
    }

    fun getSupervisorToken(): String? {
        return supervisorToken
    }
    // User operations - Remote first, local fallback
    suspend fun registerUser(user: User): Result<User> {
        return try {
            val request = RegisterRequest(
                email = user.email,
                password = user.password,
                name = user.name,
                family_name = user.familyName,
                phone = user.phone,
                city = user.city,
                userType = user.userType
            )

            val response = apiService.registerUser(request)
            if (response.isSuccessful && response.body()?.success == true) {
                val userData = response.body()!!.user!!
                val registeredUser = User(
                    id = userData.id,
                    name = userData.name,
                    familyName = userData.family_name ?: "",
                    email = userData.email,
                    password = "", // Password not returned from server for security
                    phone = userData.phone ?: "",
                    city = userData.city ?: "",
                    userType = userData.userType
                )
                // Also save locally
                userDao.insertUser(registeredUser)
                Result.success(registeredUser)
            } else {
                Result.failure(Exception("Failed to register user: ${response.body()?.message ?: response.message()}"))
            }
        } catch (e: Exception) {
            // Fallback to local registration
            val localId = userDao.insertUser(user)
            Result.success(user.copy(id = localId))
        }
    }

    // Supervisor login
    suspend fun loginSupervisor(email: String, password: String): Result<String> {
        return try {
            val request = com.example.tachlit.network.LoginRequest(email, password)
            val response = apiService.loginUser(request)
            if (response.isSuccessful && response.body()?.success == true) {
                val token = response.body()!!.token!!
                supervisorToken = token
                Result.success(token)
            } else {
                Result.failure(Exception("Login failed: ${response.body()?.message ?: response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun getAllUsers(): Flow<List<User>> = flow {
        try {
            val token = supervisorToken
            println("[DEBUG_LOG] getAllUsers: supervisorToken = ${if (token != null) "present" else "null"}")
            if (token != null) {
                println("[DEBUG_LOG] getAllUsers: Making API call to get all users")
                val response = apiService.getAllUsers("Bearer $token")
                println("[DEBUG_LOG] getAllUsers: API response - isSuccessful: ${response.isSuccessful}, code: ${response.code()}")
                if (response.isSuccessful && response.body()?.success == true) {
                    val users = response.body()!!.data!!.users.map { userData ->
                        println("[DEBUG_LOG] getAllUsers: Server user - id=${userData.id}, name=${userData.name}, userType='${userData.userType}'")
                        User(
                            id = userData.id,
                            name = userData.name,
                            familyName = userData.family_name ?: "",
                            email = userData.email,
                            password = "", // Password not returned from server for security
                            phone = userData.phone ?: "",
                            city = userData.city ?: "",
                            userType = userData.userType
                        )
                    }
                    println("[DEBUG_LOG] getAllUsers: Emitting ${users.size} users from server")
                    emit(users)
                    return@flow
                } else {
                    println("[DEBUG_LOG] getAllUsers: API call failed - success: ${response.body()?.success}, message: ${response.body()?.message}")
                }
            }
            // Fallback to local data - collect from the Flow
            println("[DEBUG_LOG] getAllUsers: Falling back to local data")
            userDao.getAllUsers().collect { localUsers ->
                println("[DEBUG_LOG] getAllUsers: Emitting ${localUsers.size} users from local database")
                emit(localUsers)
            }
        } catch (e: Exception) {
            println("[DEBUG_LOG] getAllUsers: Exception occurred: ${e.message}")
            // Fallback to local data - collect from the Flow
            userDao.getAllUsers().collect { localUsers ->
                println("[DEBUG_LOG] getAllUsers: Exception fallback - Emitting ${localUsers.size} users from local database")
                emit(localUsers)
            }
        }
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

    // OfficeVolunteer operations
    fun insertOfficeVolunteer(officeVolunteer: OfficeVolunteer): Long {
        return officeVolunteerDao.insertOfficeVolunteer(officeVolunteer)
    }

    fun getAllOfficeVolunteers(): Flow<List<OfficeVolunteer>> {
        return officeVolunteerDao.getAllOfficeVolunteers()
    }

    // FoodVolunteer operations
    fun insertFoodVolunteer(foodVolunteer: FoodVolunteer): Long {
        return foodVolunteerDao.insertFoodVolunteer(foodVolunteer)
    }

    fun getAllFoodVolunteers(): Flow<List<FoodVolunteer>> {
        return foodVolunteerDao.getAllFoodVolunteers()
    }

    // Pairing operations
    fun insertPairing(pairing: Pairing): Long {
        return pairingDao.insertPairing(pairing)
    }

    fun getAllPairings(): Flow<List<Pairing>> {
        return pairingDao.getAllPairings()
    }

    // User deletion operations
    suspend fun deleteUser(userId: Long): Result<String> {
        return try {
            val token = supervisorToken
            if (token != null) {
                println("[DEBUG_LOG] deleteUser: Deleting user with id=$userId")
                val response = apiService.deleteUser("Bearer $token", userId)
                if (response.isSuccessful && response.body()?.success == true) {
                    // Also delete from local database
                    val localUser = userDao.getUserById(userId)
                    if (localUser != null) {
                        userDao.deleteUser(localUser)
                    }
                    Result.success(response.body()!!.message)
                } else {
                    Result.failure(Exception("Failed to delete user: ${response.body()?.message ?: response.message()}"))
                }
            } else {
                Result.failure(Exception("No supervisor token available"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Statistics operations
    suspend fun getStatistics(): Result<com.example.tachlit.network.StatisticsData> {
        return try {
            val token = supervisorToken
            if (token != null) {
                val response = apiService.getStatistics("Bearer $token")
                if (response.isSuccessful && response.body()?.success == true) {
                    val stats = response.body()!!.stats!!
                    Result.success(stats)
                } else {
                    Result.failure(Exception("Failed to fetch statistics: ${response.body()?.message ?: response.message()}"))
                }
            } else {
                Result.failure(Exception("No supervisor token available"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
