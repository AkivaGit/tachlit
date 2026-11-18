import { request } from './client'
import type {
  AuthResponse,
  GenericResponse,
  LogoutResponse,
  RegisterRequest,
  SendPushResponse,
  StatisticsResponse,
  UsersResponse,
} from './types'

/** The server calls of the Android app's ApiService, one function each. */

export const register = (body: RegisterRequest) =>
  request<AuthResponse>('POST', '/api/auth/register', { body })

export const login = (email: string, password: string) =>
  request<AuthResponse>('POST', '/api/auth/login', { body: { email, password } })

/** For every role except supervisor, the server deletes the registration. */
export const logout = (token: string) =>
  request<LogoutResponse>('POST', '/api/auth/logout', { token })

export const getAllUsers = (token: string) =>
  request<UsersResponse>('GET', '/api/admin/users?page=1&pageSize=100', { token })

export const deleteUser = (token: string, id: number) =>
  request<GenericResponse>('DELETE', `/api/admin/users/${id}`, { token })

export const getStatistics = (token: string) =>
  request<StatisticsResponse>('GET', '/api/admin/stats', { token })

export const registerDeviceToken = (token: string, pushToken: string) =>
  request<GenericResponse>('POST', '/api/notifications/register-token', { token, body: { token: pushToken, platform: 'web' } })

export const deleteDeviceToken = (token: string, pushToken: string) =>
  request<GenericResponse>('DELETE', '/api/notifications/token', { token, body: { token: pushToken, platform: 'web' } })

export const sendPushToRoles = (token: string, roles: string[], title: string, body: string) =>
  request<SendPushResponse>('POST', '/api/notifications/send-to-role', { token, body: { roles, title, body } })
