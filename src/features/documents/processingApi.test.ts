import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '../../shared/api/httpClient'
import {
  fetchDocumentProcessingJobs,
  retryDocumentProcessingJob,
} from './processingApi'

vi.mock('../../shared/api/httpClient', () => ({
  request: vi.fn(),
}))

const requestMock = vi.mocked(request)

describe('processingApi', () => {
  beforeEach(() => {
    requestMock.mockReset()
  })

  it('fetches document processing jobs from the exact path', async () => {
    requestMock.mockResolvedValueOnce([])

    await fetchDocumentProcessingJobs()

    expect(requestMock).toHaveBeenCalledWith('/hr/document-processing-jobs')
  })

  it('retries a job without a request body', async () => {
    requestMock.mockResolvedValueOnce({})

    await retryDocumentProcessingJob(7)

    expect(requestMock).toHaveBeenCalledWith(
      '/hr/document-processing-jobs/7/retry',
      { method: 'POST' },
    )
    expect(requestMock.mock.calls[0][1]).not.toHaveProperty('body')
  })
})
