import { buildApiUrl } from './apiBaseUrl'
import { readCsrfToken } from './csrf'
import { AppError } from './errors'
import { refreshAccessToken } from './refreshCoordinator'
import { getAccessToken } from './tokenStore'

interface RequestOptions extends RequestInit {
  skipAuthRetry?: boolean
}

interface ErrorBody {
  status?: unknown
  code?: unknown
  message?: unknown
}

const FALLBACK_ERROR_MESSAGE = '요청을 처리하지 못했습니다.'

async function toAppError(response: Response): Promise<AppError> {
  let body: ErrorBody = {}
  try {
    body = (await response.json()) as ErrorBody
  } catch {
    // Use the safe fallback below when the response is not JSON.
  }

  return new AppError(
    typeof body.status === 'number' ? body.status : response.status,
    typeof body.code === 'string' ? body.code : `HTTP_${response.status}`,
    typeof body.message === 'string' ? body.message : FALLBACK_ERROR_MESSAGE,
  )
}

export async function request<T>(
  path: string,
  options?: RequestOptions,
): Promise<T> {
  const { skipAuthRetry = false, ...requestOptions } = options ?? {}
  const headers = new Headers(requestOptions.headers)
  const accessToken = getAccessToken()

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  if (
    requestOptions.body !== undefined &&
    requestOptions.body !== null &&
    !(requestOptions.body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json')
  }

  const method = requestOptions.method?.toUpperCase() ?? 'GET'
  const requiresCsrf =
    method === 'POST' &&
    (path === '/auth/refresh' || path === '/auth/logout')
  if (requiresCsrf) {
    const csrfToken = readCsrfToken()
    if (csrfToken) headers.set('X-XSRF-TOKEN', csrfToken)
  }

  const response = await fetch(buildApiUrl(path), {
    ...requestOptions,
    method,
    headers,
    credentials: 'include',
  })

  if (response.status === 204) return undefined as T

  if (response.status === 401 && !skipAuthRetry) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      return request<T>(path, { ...options, skipAuthRetry: true })
    }
  }

  if (!response.ok) throw await toAppError(response)

  return (await response.json()) as T
}
