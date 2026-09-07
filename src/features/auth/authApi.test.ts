import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '../../shared/api/httpClient'
import { fetchMe, login, logout } from './authApi'

vi.mock('../../shared/api/httpClient', () => ({
  request: vi.fn(),
}))

const requestMock = vi.mocked(request)

describe('authApi', () => {
  beforeEach(() => {
    requestMock.mockReset()
  })

  it('sends login credentials without auth retry', async () => {
    requestMock.mockResolvedValueOnce({ accessToken: 'access-token' })

    await login('employee@example.com', 'password')

    expect(requestMock).toHaveBeenCalledWith('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'employee@example.com',
        password: 'password',
      }),
      skipAuthRetry: true,
    })
  })

  it('fetches the current user without disabling auth retry', async () => {
    requestMock.mockResolvedValueOnce({})

    await fetchMe()

    expect(requestMock).toHaveBeenCalledWith('/me')
  })

  it('logs out without disabling auth retry', async () => {
    requestMock.mockResolvedValueOnce(undefined)

    await logout()

    expect(requestMock).toHaveBeenCalledWith('/auth/logout', {
      method: 'POST',
    })
  })
})
