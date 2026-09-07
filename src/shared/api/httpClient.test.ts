import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./refreshCoordinator', () => ({
  refreshAccessToken: vi.fn(),
}))

const fetchMock = vi.fn<typeof fetch>()

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function loadModules() {
  const httpClient = await import('./httpClient')
  const tokenStore = await import('./tokenStore')
  const refreshCoordinator = await import('./refreshCoordinator')
  return {
    ...httpClient,
    ...tokenStore,
    refreshMock: vi.mocked(refreshCoordinator.refreshAccessToken),
  }
}

function requestHeaders(callIndex: number): Headers {
  return new Headers(fetchMock.mock.calls[callIndex]?.[1]?.headers)
}

describe('request', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080')
    vi.resetModules()
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    document.cookie = 'XSRF-TOKEN=csrf-token; Path=/'
  })

  afterEach(() => {
    document.cookie = 'XSRF-TOKEN=; Max-Age=0; Path=/'
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('parses a successful JSON response', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ name: 'tester' }))
    const { request } = await loadModules()

    await expect(request<{ name: string }>('/me')).resolves.toEqual({
      name: 'tester',
    })
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/me',
      expect.objectContaining({ credentials: 'include' }),
    )
  })

  it('returns undefined for a 204 response', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))
    const { request } = await loadModules()

    await expect(request('/me')).resolves.toBeUndefined()
  })

  it('retries the original request once after a successful refresh', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ status: 401 }, 401))
      .mockResolvedValueOnce(jsonResponse({ ok: true }))
    const { request, refreshMock, setAccessToken } = await loadModules()
    setAccessToken('old-token')
    refreshMock.mockImplementationOnce(async () => {
      setAccessToken('new-token')
      return true
    })

    await expect(request('/me')).resolves.toEqual({ ok: true })
    expect(refreshMock).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(requestHeaders(0).get('Authorization')).toBe('Bearer old-token')
    expect(requestHeaders(1).get('Authorization')).toBe('Bearer new-token')
  })

  it('throws the original 401 without retry when refresh fails', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ status: 401, code: 'UNAUTHORIZED', message: 'expired' }, 401),
    )
    const { request, refreshMock } = await loadModules()
    refreshMock.mockResolvedValueOnce(false)

    await expect(request('/me')).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
    })
    expect(refreshMock).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('throws a 403 without attempting refresh', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ status: 403, code: 'FORBIDDEN', message: 'forbidden' }, 403),
    )
    const { request, refreshMock } = await loadModules()

    await expect(request('/me')).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    })
    expect(refreshMock).not.toHaveBeenCalled()
  })

  it('adds the CSRF header only to the exact refresh and logout POST paths', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ ok: true }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }))
    const { request } = await loadModules()

    await request('/auth/refresh', { method: 'POST' })
    await request('/auth/logout', { method: 'POST' })
    await request('/me', { method: 'POST' })

    expect(requestHeaders(0).get('X-XSRF-TOKEN')).toBe('csrf-token')
    expect(requestHeaders(1).get('X-XSRF-TOKEN')).toBe('csrf-token')
    expect(requestHeaders(2).has('X-XSRF-TOKEN')).toBe(false)
  })

  it('does not set Content-Type for FormData', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }))
    const { request } = await loadModules()

    await request('/upload', { method: 'POST', body: new FormData() })

    expect(requestHeaders(0).has('Content-Type')).toBe(false)
  })

  it('preserves a caller-provided Content-Type', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }))
    const { request } = await loadModules()

    await request('/submit', {
      method: 'POST',
      body: 'plain text',
      headers: { 'Content-Type': 'text/plain' },
    })

    expect(requestHeaders(0).get('Content-Type')).toBe('text/plain')
  })

  it('adds JSON Content-Type only when a non-FormData body has none', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }))
    const { request } = await loadModules()

    await request('/submit', { method: 'POST', body: '{}' })

    expect(requestHeaders(0).get('Content-Type')).toBe('application/json')
  })

  it('preserves caller headers when adding Authorization', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }))
    const { request, setAccessToken } = await loadModules()
    setAccessToken('access-token')

    await request('/me', { headers: { 'X-Test-Header': 'value' } })

    expect(requestHeaders(0).get('X-Test-Header')).toBe('value')
    expect(requestHeaders(0).get('Authorization')).toBe('Bearer access-token')
  })
})
