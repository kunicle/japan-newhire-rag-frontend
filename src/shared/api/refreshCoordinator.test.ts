import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fetchMock = vi.fn<typeof fetch>()

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function loadRefreshModules() {
  const refreshModule = await import('./refreshCoordinator')
  const tokenStore = await import('./tokenStore')
  const authEvents = await import('./authEvents')
  return { ...refreshModule, ...tokenStore, ...authEvents }
}

describe('refreshAccessToken', () => {
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
    vi.restoreAllMocks()
  })

  it('sends the current XSRF cookie in the refresh header', async () => {
    document.cookie = `XSRF-TOKEN=${encodeURIComponent('current-token+/=')}; Path=/`
    fetchMock.mockResolvedValueOnce(jsonResponse({ accessToken: 'new-token' }))
    const { refreshAccessToken } = await loadRefreshModules()

    await expect(refreshAccessToken()).resolves.toBe(true)

    const request = fetchMock.mock.calls[0]?.[1]
    const headers = new Headers(request?.headers)
    expect(headers.get('X-XSRF-TOKEN')).toBe('current-token+/=')
    expect(request?.credentials).toBe('include')
  })

  it('does not send a refresh request without an XSRF cookie', async () => {
    document.cookie = 'XSRF-TOKEN=; Max-Age=0; Path=/'
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { refreshAccessToken } = await loadRefreshModules()

    await expect(refreshAccessToken()).resolves.toBe(false)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(consoleError).toHaveBeenCalledWith(
      'Failed to refresh authentication',
      expect.objectContaining({
        message: 'XSRF-TOKEN cookie is required to refresh authentication',
      }),
    )
  })

  it('updates the stored access token after a successful refresh', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ accessToken: 'rotated-access-token' }))
    const { refreshAccessToken, getAccessToken, setAccessToken } =
      await loadRefreshModules()
    setAccessToken('expired-access-token')

    await expect(refreshAccessToken()).resolves.toBe(true)

    expect(getAccessToken()).toBe('rotated-access-token')
  })

  it('uses one in-flight request for concurrent callers', async () => {
    let resolveFetch!: (response: Response) => void
    fetchMock.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve
        }),
    )
    const { refreshAccessToken, getAccessToken } = await loadRefreshModules()

    const first = refreshAccessToken()
    const second = refreshAccessToken()
    const third = refreshAccessToken()

    expect(first).toBe(second)
    expect(second).toBe(third)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    resolveFetch(jsonResponse({ accessToken: 'new-token' }))
    await expect(Promise.all([first, second, third])).resolves.toEqual([
      true,
      true,
      true,
    ])
    expect(getAccessToken()).toBe('new-token')
  })

  it('clears the token and emits auth expiry after an HTTP failure', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ code: 'UNAUTHORIZED' }, 401))
    const {
      refreshAccessToken,
      getAccessToken,
      setAccessToken,
      onAuthExpired,
    } = await loadRefreshModules()
    const listener = vi.fn()
    const unsubscribe = onAuthExpired(listener)
    setAccessToken('old-token')

    await expect(refreshAccessToken()).resolves.toBe(false)
    expect(getAccessToken()).toBeNull()
    expect(listener).toHaveBeenCalledOnce()
    unsubscribe()
  })

  it.each([
    ['invalid JSON', 'not-json'],
    ['missing accessToken', JSON.stringify({})],
    ['null accessToken', JSON.stringify({ accessToken: null })],
    ['empty accessToken', JSON.stringify({ accessToken: '' })],
    ['blank accessToken', JSON.stringify({ accessToken: '   ' })],
  ])('rejects a malformed 200 response: %s', async (_label, body) => {
    fetchMock.mockResolvedValueOnce(
      new Response(body, {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    const {
      refreshAccessToken,
      getAccessToken,
      setAccessToken,
      onAuthExpired,
    } = await loadRefreshModules()
    const listener = vi.fn()
    const unsubscribe = onAuthExpired(listener)
    setAccessToken('old-token')

    await expect(refreshAccessToken()).resolves.toBe(false)
    expect(getAccessToken()).toBeNull()
    expect(listener).toHaveBeenCalledOnce()
    unsubscribe()
  })

  it('starts a new fetch after a successful refresh completes', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ accessToken: 'first-token' }))
      .mockResolvedValueOnce(jsonResponse({ accessToken: 'second-token' }))
    const { refreshAccessToken } = await loadRefreshModules()

    await refreshAccessToken()
    await refreshAccessToken()

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('starts a new fetch after a failed refresh completes', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({}, 401))
      .mockResolvedValueOnce(jsonResponse({}, 401))
    const { refreshAccessToken } = await loadRefreshModules()

    await refreshAccessToken()
    await refreshAccessToken()

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('does not call a listener after it is unsubscribed', async () => {
    const { emitAuthExpired, onAuthExpired } = await loadRefreshModules()
    const listener = vi.fn()
    const unsubscribe = onAuthExpired(listener)

    unsubscribe()
    emitAuthExpired()

    expect(listener).not.toHaveBeenCalled()
  })
})
