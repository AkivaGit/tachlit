package com.example.tachlit.network

import com.example.tachlit.data.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    // Auth endpoints
    @POST("api/auth/register")
    suspend fun registerUser(@Body request: RegisterRequest): Response<RegisterResponse>

    @POST("api/auth/login")
    suspend fun loginUser(@Body request: LoginRequest): Response<LoginResponse>

    // Admin endpoints (for supervisor)
    @GET("api/admin/users")
    suspend fun getAllUsers(
        @Header("Authorization") token: String,
        @Query("page") page: Int = 1,
        @Query("pageSize") pageSize: Int = 100
    ): Response<UsersResponse>

    @GET("api/admin/users/{id}")
    suspend fun getUserById(
        @Header("Authorization") token: String,
        @Path("id") id: Long
    ): Response<UserResponse>

    @DELETE("api/admin/users/{id}")
    suspend fun deleteUser(
        @Header("Authorization") token: String,
        @Path("id") id: Long
    ): Response<DeleteUserResponse>

    @GET("api/admin/stats")
    suspend fun getStatistics(
        @Header("Authorization") token: String
    ): Response<StatisticsResponse>

    // Push-notification endpoints
    @POST("api/notifications/register-token")
    suspend fun registerDeviceToken(
        @Header("Authorization") token: String,
        @Body request: RegisterDeviceTokenRequest
    ): Response<GenericResponse>

    @HTTP(method = "DELETE", path = "api/notifications/token", hasBody = true)
    suspend fun deleteDeviceToken(
        @Header("Authorization") token: String,
        @Body request: RegisterDeviceTokenRequest
    ): Response<GenericResponse>

    @POST("api/notifications/send-to-role")
    suspend fun sendPushToRole(
        @Header("Authorization") token: String,
        @Body request: SendPushToRoleRequest
    ): Response<SendPushResponse>
}

// Request/Response data classes
data class RegisterRequest(
    val email: String,
    val password: String,
    val name: String,
    val family_name: String,
    val phone: String,
    val city: String,
    val userType: String
)

data class ValidationError(
    val field: String,
    val message: String,
    val value: String?
)

data class RegisterResponse(
    val success: Boolean,
    val message: String,
    val token: String?,
    val user: UserData?,
    val errors: List<ValidationError>?
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class LoginResponse(
    val success: Boolean,
    val message: String,
    val token: String?,
    val user: UserData?
)

data class UsersResponse(
    val success: Boolean,
    val message: String,
    val data: UsersData?
)

data class UsersData(
    val users: List<UserData>,
    val pagination: PaginationData
)

data class UserResponse(
    val success: Boolean,
    val message: String,
    val user: UserData?
)

data class UserData(
    val id: Long,
    val email: String,
    val name: String,
    val family_name: String?,
    val phone: String?,
    val city: String?,
    val userType: String,
    val is_active: Boolean,
    val created_at: String,
    val updated_at: String
)

data class PaginationData(
    val page: Int,
    val pageSize: Int,
    val total: Int,
    val totalPages: Int
)

data class StatisticsResponse(
    val success: Boolean,
    val message: String,
    val stats: StatisticsData?
)

data class DeleteUserResponse(
    val success: Boolean,
    val message: String
)

data class StatisticsData(
    val totalUsers: Int,
    val learnAskers: Int,
    val learnGivers: Int,
    val officeVolunteers: Int,
    val foodVolunteers: Int,
    val supervisors: Int,
    val groupCoordinators: Int = 0,
    val unmatchedLearners: Int,
    val availableTeachers: Int,
    val totalPairings: Int,
    val recentRegistrations: Int
)

// --- Push notifications DTOs ---
data class RegisterDeviceTokenRequest(
    val token: String,
    val platform: String = "android"
)

data class GenericResponse(
    val success: Boolean,
    val message: String?
)

data class SendPushToRoleRequest(
    val roles: List<String>,
    val title: String,
    val body: String,
    val data: Map<String, String>? = null
)

data class SendPushResponse(
    val success: Boolean,
    val message: String?,
    val sent: Int?,
    val failed: Int?,
    val cleanedInvalidTokens: Int?
)
