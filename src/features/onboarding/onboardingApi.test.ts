import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '../../shared/api/httpClient'
import {
  completeOnboardingTask,
  fetchMyOnboarding,
  startOnboardingTask,
} from './onboardingApi'

vi.mock('../../shared/api/httpClient', () => ({ request: vi.fn() }))

const requestMock = vi.mocked(request)

describe('onboardingApi', () => {
  beforeEach(() => requestMock.mockReset())

  it('fetches the current employee onboarding assignments', async () => {
    requestMock.mockResolvedValueOnce([])
    await fetchMyOnboarding()
    expect(requestMock).toHaveBeenCalledWith('/me/onboarding')
  })

  it('starts an assignment with a bodyless PATCH', async () => {
    requestMock.mockResolvedValueOnce({})
    await startOnboardingTask(10)
    expect(requestMock).toHaveBeenCalledWith('/me/onboarding/10/start', {
      method: 'PATCH',
    })
    expect(requestMock.mock.calls[0]?.[1]).not.toHaveProperty('body')
  })

  it('completes an assignment with a null completion note', async () => {
    requestMock.mockResolvedValueOnce({})
    await completeOnboardingTask(10)
    expect(requestMock).toHaveBeenCalledWith('/me/onboarding/10/complete', {
      method: 'PATCH',
      body: JSON.stringify({ completionNote: null }),
    })
  })
})
