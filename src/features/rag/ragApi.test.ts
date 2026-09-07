import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '../../shared/api/httpClient'
import { askQuestion, fetchHistory, fetchHistoryDetail } from './ragApi'

vi.mock('../../shared/api/httpClient', () => ({
  request: vi.fn(),
}))

const requestMock = vi.mocked(request)

describe('ragApi', () => {
  beforeEach(() => {
    requestMock.mockReset()
  })

  it('posts a question to the RAG endpoint', async () => {
    requestMock.mockResolvedValueOnce({})

    await askQuestion('휴가 규정이 궁금합니다')

    expect(requestMock).toHaveBeenCalledWith('/rag/questions', {
      method: 'POST',
      body: JSON.stringify({ question: '휴가 규정이 궁금합니다' }),
    })
  })

  it('fetches the current user history', async () => {
    requestMock.mockResolvedValueOnce([])

    await fetchHistory()

    expect(requestMock).toHaveBeenCalledWith('/rag/questions/me')
  })

  it('includes the question ID in the detail path', async () => {
    requestMock.mockResolvedValueOnce({})

    await fetchHistoryDetail(42)

    expect(requestMock).toHaveBeenCalledWith('/rag/questions/42')
  })
})
