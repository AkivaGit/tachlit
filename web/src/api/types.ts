/** Server request/response shapes, as in the Android app's ApiService.kt. */

export interface RegisterRequest {
  email: string
  password: string
  name: string
  family_name: string
  phone: string
  city: string
  userType: string
}

export interface UserData {
  id: number
  email: string
  name: string
  family_name: string | null
  phone: string | null
  city: string | null
  userType: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  success: boolean
  message: string
  message_he?: string
  token?: string
  user?: UserData
}

export interface LogoutResponse {
  success: boolean
  deleted?: boolean
  message?: string
  message_he?: string
}

export interface UsersResponse {
  success: boolean
  message: string
  data?: {
    users: UserData[]
    pagination: { page: number; pageSize: number; total: number; totalPages: number }
  }
}

export interface StatisticsData {
  totalUsers: number
  learnAskers: number
  learnGivers: number
  officeVolunteers: number
  foodVolunteers: number
  supervisors: number
  groupCoordinators: number
  unmatchedLearners: number
  availableTeachers: number
  totalPairings: number
  recentRegistrations: number
}

export interface StatisticsResponse {
  success: boolean
  message: string
  stats?: StatisticsData
}

export interface GenericResponse {
  success: boolean
  message?: string
}

export interface SendPushResponse {
  success: boolean
  message?: string
  sent?: number
  failed?: number
  cleanedInvalidTokens?: number
}
