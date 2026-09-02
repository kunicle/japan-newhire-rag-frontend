import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '../../shared/api/httpClient'
import {
  fetchMyEvaluationResult,
  fetchMyEvaluations,
  fetchSelfEvaluation,
  saveSelfEvaluationDraft,
  submitSelfEvaluation,
} from './evaluationApi'

vi.mock('../../shared/api/httpClient', () => ({ request: vi.fn() }))

const requestMock = vi.mocked(request)
const draft = {
  items: [{ evaluationItemId: 5, score: 4.5, itemFeedback: 'feedback' }],
  overallFeedback: 'overall',
}

describe('evaluationApi', () => {
  beforeEach(() => requestMock.mockReset())

  it('fetches my evaluation list', async () => {
    requestMock.mockResolvedValueOnce([])
    await fetchMyEvaluations()
    expect(requestMock).toHaveBeenCalledWith('/me/evaluations')
  })

  it('fetches one self evaluation', async () => {
    requestMock.mockResolvedValueOnce({})
    await fetchSelfEvaluation(10)
    expect(requestMock).toHaveBeenCalledWith('/me/evaluations/10/self')
  })

  it('saves a self evaluation draft', async () => {
    requestMock.mockResolvedValueOnce({})
    await saveSelfEvaluationDraft(10, draft)
    expect(requestMock).toHaveBeenCalledWith('/me/evaluations/10/self/draft', {
      method: 'PUT',
      body: JSON.stringify(draft),
    })
  })

  it('submits with a bodyless POST', async () => {
    requestMock.mockResolvedValueOnce(undefined)
    await submitSelfEvaluation(10)
    expect(requestMock).toHaveBeenCalledWith('/me/evaluations/10/self/submission', {
      method: 'POST',
    })
    expect(requestMock.mock.calls[0]?.[1]).not.toHaveProperty('body')
  })

  it('fetches a published cycle result', async () => {
    requestMock.mockResolvedValueOnce({})
    await fetchMyEvaluationResult(77)
    expect(requestMock).toHaveBeenCalledWith('/me/evaluations/result?cycleId=77')
  })
})
