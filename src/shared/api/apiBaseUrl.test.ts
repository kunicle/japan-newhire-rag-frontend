import { afterEach, describe, expect, it, vi } from 'vitest'

describe('buildApiUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it.each([
    ['http://localhost:8080', '/auth/login'],
    ['http://localhost:8080/', '/auth/login'],
    ['http://localhost:8080///', 'auth/login'],
  ])('normalizes base %s and path %s', async (baseUrl, path) => {
    vi.stubEnv('VITE_API_BASE_URL', baseUrl)
    vi.resetModules()

    const { buildApiUrl } = await import('./apiBaseUrl')

    expect(buildApiUrl(path)).toBe('http://localhost:8080/api/auth/login')
  })

  it('throws during module evaluation when the base URL is missing', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    vi.resetModules()

    await expect(import('./apiBaseUrl')).rejects.toThrow(
      'VITE_API_BASE_URL is required',
    )
  })
})
