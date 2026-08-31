import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '../../shared/api/httpClient'
import { fetchNotifications, markNotificationRead } from './notificationApi'

vi.mock('../../shared/api/httpClient', () => ({
  request: vi.fn(),
}))

const requestMock = vi.mocked(request)

describe('notificationApi', () => {
  beforeEach(() => {
    requestMock.mockReset()
  })

  it('omits read when the filter is unspecified', async () => {
    requestMock.mockResolvedValueOnce({})

    await fetchNotifications({ page: 2, size: 20 })

    expect(requestMock).toHaveBeenCalledWith('/notifications?page=2&size=20')
  })

  it('includes read=true with page and size', async () => {
    requestMock.mockResolvedValueOnce({})

    await fetchNotifications({ read: true, page: 1, size: 40 })

    expect(requestMock).toHaveBeenCalledWith(
      '/notifications?read=true&page=1&size=40',
    )
  })

  it('includes read=false', async () => {
    requestMock.mockResolvedValueOnce({})

    await fetchNotifications({ read: false, page: 0, size: 20 })

    expect(requestMock).toHaveBeenCalledWith(
      '/notifications?read=false&page=0&size=20',
    )
  })

  it('marks the exact notification as read without a request body', async () => {
    requestMock.mockResolvedValueOnce({})

    await markNotificationRead(42)

    expect(requestMock).toHaveBeenCalledWith('/notifications/42/read', {
      method: 'PATCH',
    })
  })
})
