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
    if (!csrfToken) {
      throw new Error('XSRF-TOKEN cookie is required to refresh authentication')
    }

    const headers = new Headers()
    headers.set('X-XSRF-TOKEN', csrfToken)

    const response = await fetch(buildApiUrl('/auth/refresh'), {
      method: 'POST',
      credentials: 'include',
      headers,
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
  } catch (error) {
    console.error('Failed to refresh authentication', error)
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
