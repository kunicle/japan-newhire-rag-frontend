import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '../../shared/api/httpClient'
import {
  assignManagedOnboardingTask,
  completeManagedOnboarding,
  fetchManagedOnboardingProgress,
  fetchManagedOnboardingTasks,
  startManagedOnboarding,
} from './onboardingManagementApi'

vi.mock('../../shared/api/httpClient', () => ({ request: vi.fn() }))

const requestMock = vi.mocked(request)

describe('onboardingManagementApi', () => {
  beforeEach(() => requestMock.mockReset())

  it('fetches scoped employee progress', async () => {
    requestMock.mockResolvedValueOnce({})
    await fetchManagedOnboardingProgress(1, 20, 101)

    expect(requestMock).toHaveBeenCalledWith(
      '/onboarding-management/progress?page=1&size=20&employeeId=101',
    )
  })

  it('fetches the active manager task catalog', async () => {
    requestMock.mockResolvedValueOnce({})
    await fetchManagedOnboardingTasks(0, 100)

    expect(requestMock).toHaveBeenCalledWith(
      '/onboarding-management/tasks?page=0&size=100',
    )
  })

  it('assigns a task to selected employees', async () => {
    requestMock.mockResolvedValueOnce({})
    await assignManagedOnboardingTask(10, [101, 102])

    expect(requestMock).toHaveBeenCalledWith(
      '/onboarding-management/tasks/10/assignments',
      {
        method: 'POST',
        body: JSON.stringify({ employeeIds: [101, 102] }),
      },
    )
  })

  it('moves an assignment to in progress', async () => {
    requestMock.mockResolvedValueOnce({})
    await startManagedOnboarding(20)

    expect(requestMock).toHaveBeenCalledWith(
      '/onboarding-management/assignments/20/start',
      { method: 'PATCH' },
    )
  })

  it('completes an assignment with an optional note', async () => {
    requestMock.mockResolvedValueOnce({})
    await completeManagedOnboarding(20, '확인 완료')

    expect(requestMock).toHaveBeenCalledWith(
      '/onboarding-management/assignments/20/complete',
      {
        method: 'PATCH',
        body: JSON.stringify({ completionNote: '확인 완료' }),
      },
    )
  })
})
