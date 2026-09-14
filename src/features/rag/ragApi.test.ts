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

  it('fetches the current user history with page and size', async () => {
    requestMock.mockResolvedValueOnce({ content: [], page: 0, size: 10, totalElements: 0, totalPages: 0 })

    await fetchHistory({ page: 0, size: 10 })

    expect(requestMock).toHaveBeenCalledWith('/rag/questions/me?page=0&size=10')
  })

  it('includes a non-blank keyword in the history query', async () => {
    requestMock.mockResolvedValueOnce({ content: [], page: 0, size: 10, totalElements: 0, totalPages: 0 })

    await fetchHistory({ keyword: '연차', page: 0, size: 10 })

    expect(requestMock).toHaveBeenCalledWith('/rag/questions/me?keyword=%EC%97%B0%EC%B0%A8&page=0&size=10')
  })

  it('omits the keyword query parameter when blank', async () => {
    requestMock.mockResolvedValueOnce({ content: [], page: 0, size: 10, totalElements: 0, totalPages: 0 })

    await fetchHistory({ keyword: '', page: 1, size: 10 })

    expect(requestMock).toHaveBeenCalledWith('/rag/questions/me?page=1&size=10')
  })

  it('includes the question ID in the detail path', async () => {
    requestMock.mockResolvedValueOnce({})

    await fetchHistoryDetail(42)

    expect(requestMock).toHaveBeenCalledWith('/rag/questions/42')
  })
})
