import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '../../shared/api/httpClient'
import {
  assignOnboardingTask,
  changeOnboardingTaskActivation,
  createOnboardingTask,
  updateOnboardingTask,
} from './hrOnboardingApi'
import type { OnboardingTaskFormInput } from './hrOnboardingTypes'

vi.mock('../../shared/api/httpClient', () => ({ request: vi.fn() }))

const requestMock = vi.mocked(request)
const input: OnboardingTaskFormInput = {
  departmentId: 3,
  taskTitle: '보안 교육',
  taskDescription: '입사자 보안 교육을 완료합니다.',
  defaultDueDays: 7,
}

describe('hrOnboardingApi', () => {
  beforeEach(() => requestMock.mockReset())

  it('creates an onboarding task', async () => {
    requestMock.mockResolvedValueOnce({})
    await createOnboardingTask(input)
    expect(requestMock).toHaveBeenCalledWith('/hr/onboarding-tasks', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  })

  it('updates an onboarding task', async () => {
    requestMock.mockResolvedValueOnce({})
    await updateOnboardingTask(10, input)
    expect(requestMock).toHaveBeenCalledWith('/hr/onboarding-tasks/10', {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  })

  it('changes task activation', async () => {
    requestMock.mockResolvedValueOnce({})
    await changeOnboardingTaskActivation(10, false)
    expect(requestMock).toHaveBeenCalledWith('/hr/onboarding-tasks/10/activation', {
      method: 'PATCH',
      body: JSON.stringify({ active: false }),
    })
  })

  it('assigns employees to a task', async () => {
    requestMock.mockResolvedValueOnce({})
    await assignOnboardingTask(10, [1, 2, 3])
    expect(requestMock).toHaveBeenCalledWith('/hr/onboarding-tasks/10/assignments', {
      method: 'POST',
      body: JSON.stringify({ employeeIds: [1, 2, 3] }),
    })
  })
})
