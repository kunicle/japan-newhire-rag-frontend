import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '../../shared/api/httpClient'
import {
  fetchManagerEvaluation,
  fetchManagerEvaluationProgress,
  fetchManagerEvaluations,
  saveManagerEvaluationDraft,
  submitManagerEvaluation,
} from './managerEvaluationApi'

vi.mock('../../shared/api/httpClient', () => ({ request: vi.fn() }))

const requestMock = vi.mocked(request)
const draft = {
  items: [{ evaluationItemId: 5, score: 4.5, itemFeedback: 'feedback' }],
  overallFeedback: 'overall',
}

describe('managerEvaluationApi', () => {
  beforeEach(() => requestMock.mockReset())

  it('fetches manager evaluations', async () => {
    requestMock.mockResolvedValueOnce([])
    await fetchManagerEvaluations()
    expect(requestMock).toHaveBeenCalledWith('/manager/evaluations')
  })

  it('fetches one manager evaluation', async () => {
    requestMock.mockResolvedValueOnce({})
    await fetchManagerEvaluation(10)
    expect(requestMock).toHaveBeenCalledWith('/manager/evaluations/10')
  })

  it('saves a manager draft', async () => {
    requestMock.mockResolvedValueOnce({})
    await saveManagerEvaluationDraft(10, draft)
    expect(requestMock).toHaveBeenCalledWith('/manager/evaluations/10/draft', {
      method: 'PUT',
      body: JSON.stringify(draft),
    })
  })

  it('submits with a bodyless POST', async () => {
    requestMock.mockResolvedValueOnce(undefined)
    await submitManagerEvaluation(10)
    expect(requestMock).toHaveBeenCalledWith('/manager/evaluations/10/submission', {
      method: 'POST',
    })
    expect(requestMock.mock.calls[0]?.[1]).not.toHaveProperty('body')
  })

  it('fetches one cycle progress summary', async () => {
    requestMock.mockResolvedValueOnce({})
    await fetchManagerEvaluationProgress(77)
    expect(requestMock).toHaveBeenCalledWith('/manager/evaluations/progress?cycleId=77')
  })
})
