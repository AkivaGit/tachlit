import { apiBaseUrl } from '../config'

/** The server could not be reached, or did not answer in time. */
export class NetworkError extends Error {
  constructor(message = 'Network error') {
    super(message)
    this.name = 'NetworkError'
  }
}

export interface ApiResponse<T> {
  /** HTTP 2xx */
  ok: boolean
  status: number
  /** Parsed JSON reply, or null when the reply is not JSON. */
  data: T | null
  /** The reply as text (used to show the server's error cause). */
  raw: string | null
}

export interface RequestOptions {
  body?: unknown
  /** Login token (JWT); sent as "Authorization: Bearer <token>". */
  token?: string | null
  /** Like the Android app's 30 second OkHttp timeouts. */
  timeoutMs?: number
}

export async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  { body, token, timeoutMs = 30_000 }: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  let response: Response
  let raw: string
  try {
    response = await fetch(apiBaseUrl + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    })
    raw = await response.text()
  } catch (error) {
    throw new NetworkError(error instanceof Error ? error.message : String(error))
  } finally {
    clearTimeout(timer)
  }

  let data: T | null = null
  try {
    data = raw ? (JSON.parse(raw) as T) : null
  } catch {
    data = null
  }
  return { ok: response.ok, status: response.status, data, raw: raw || null }
}
