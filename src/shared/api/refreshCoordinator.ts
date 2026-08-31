import { buildApiUrl } from './apiBaseUrl'
import { emitAuthExpired } from './authEvents'
import { readCsrfToken } from './csrf'
import { setAccessToken } from './tokenStore'

let refreshPromise: Promise<boolean> | null = null

function failRefresh(): false {
  setAccessToken(null)
  emitAuthExpired()
  return false
}

async function performRefresh(): Promise<boolean> {
  try {
    const csrfToken = readCsrfToken()
    const response = await fetch(buildApiUrl('/auth/refresh'), {
      method: 'POST',
      credentials: 'include',
      headers: csrfToken ? { 'X-XSRF-TOKEN': csrfToken } : undefined,
    })

    if (response.status !== 200) return failRefresh()

    const body: unknown = await response.json()
    if (
      typeof body !== 'object' ||
      body === null ||
      !('accessToken' in body) ||
      typeof body.accessToken !== 'string' ||
      body.accessToken.trim().length === 0
    ) {
      return failRefresh()
    }

    setAccessToken(body.accessToken)
    return true
  } catch {
    return failRefresh()
  }
}

export function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise

  refreshPromise = performRefresh().finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}
