import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '../../shared/api/httpClient'
import {
  completeLearningProgress,
  fetchMyCourseDetail,
  fetchMyCourses,
  startLearningProgress,
} from './educationApi'

vi.mock('../../shared/api/httpClient', () => ({ request: vi.fn() }))

const requestMock = vi.mocked(request)

describe('educationApi', () => {
  beforeEach(() => requestMock.mockReset())

  it('fetches the default course page', async () => {
    requestMock.mockResolvedValueOnce({})
    await fetchMyCourses()
    expect(requestMock).toHaveBeenCalledWith('/me/courses?page=0&size=20')
  })

  it('fetches a requested course page and size', async () => {
    requestMock.mockResolvedValueOnce({})
    await fetchMyCourses(2, 10)
    expect(requestMock).toHaveBeenCalledWith('/me/courses?page=2&size=10')
  })

  it('fetches one enrollment detail', async () => {
    requestMock.mockResolvedValueOnce({})
    await fetchMyCourseDetail(100)
    expect(requestMock).toHaveBeenCalledWith('/me/courses/100')
  })

  it('starts progress with an empty PATCH', async () => {
    requestMock.mockResolvedValueOnce({})
    await startLearningProgress(1000)
    expect(requestMock).toHaveBeenCalledWith(
      '/me/learning-progress/1000/start',
      { method: 'PATCH' },
    )
    expect(requestMock.mock.calls[0]?.[1]).not.toHaveProperty('body')
  })

  it('completes progress with an empty PATCH', async () => {
    requestMock.mockResolvedValueOnce({})
    await completeLearningProgress(1000)
    expect(requestMock).toHaveBeenCalledWith(
      '/me/learning-progress/1000/complete',
      { method: 'PATCH' },
    )
    expect(requestMock.mock.calls[0]?.[1]).not.toHaveProperty('body')
  })
})
