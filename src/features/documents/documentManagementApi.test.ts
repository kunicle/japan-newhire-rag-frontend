import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '../../shared/api/httpClient'
import { fetchDocument, fetchDocuments } from './documentManagementApi'

vi.mock('../../shared/api/httpClient', () => ({ request: vi.fn() }))

const requestMock = vi.mocked(request)

describe('documentManagementApi', () => {
  beforeEach(() => requestMock.mockReset())

  it('fetches the document list', async () => {
    requestMock.mockResolvedValueOnce([])
    await fetchDocuments()
    expect(requestMock).toHaveBeenCalledWith('/documents')
  })

  it('fetches one document without a body', async () => {
    requestMock.mockResolvedValueOnce({})
    await fetchDocument(5)
    expect(requestMock).toHaveBeenCalledWith('/documents/5')
  })
})
