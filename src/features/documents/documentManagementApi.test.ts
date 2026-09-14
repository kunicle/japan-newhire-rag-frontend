import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '../../shared/api/httpClient'
import {
  deleteDocument,
  fetchDocument,
  fetchDocuments,
  fetchDocumentVersionAuditEvents,
  retractDocumentVersion,
} from './documentManagementApi'

vi.mock('../../shared/api/httpClient', () => ({ request: vi.fn() }))

const requestMock = vi.mocked(request)
const emptyPage = { content: [], page: 0, size: 10, totalElements: 0, totalPages: 0 }

describe('documentManagementApi', () => {
  beforeEach(() => requestMock.mockReset())

  it('fetches the document list with page and size', async () => {
    requestMock.mockResolvedValueOnce(emptyPage)
    await fetchDocuments({ page: 0, size: 10 })
    expect(requestMock).toHaveBeenCalledWith('/documents?page=0&size=10')
  })

  it('includes a non-blank keyword in the document list query', async () => {
    requestMock.mockResolvedValueOnce(emptyPage)
    await fetchDocuments({ keyword: '취업규칙', page: 0, size: 10 })
    expect(requestMock).toHaveBeenCalledWith(
      `/documents?keyword=${encodeURIComponent('취업규칙')}&page=0&size=10`,
    )
  })

  it('omits the keyword query parameter when blank', async () => {
    requestMock.mockResolvedValueOnce(emptyPage)
    await fetchDocuments({ keyword: '', page: 1, size: 10 })
    expect(requestMock).toHaveBeenCalledWith('/documents?page=1&size=10')
  })

  it('deletes a document', async () => {
    requestMock.mockResolvedValueOnce(undefined)
    await deleteDocument(5)
    expect(requestMock).toHaveBeenCalledWith('/documents/5', { method: 'DELETE' })
  })

  it('fetches one document without a body', async () => {
    requestMock.mockResolvedValueOnce({})
    await fetchDocument(5)
    expect(requestMock).toHaveBeenCalledWith('/documents/5')
  })

  it('retracts one document version without a request body', async () => {
    requestMock.mockResolvedValueOnce({})
    await retractDocumentVersion(5, 12)
    expect(requestMock).toHaveBeenCalledWith(
      '/documents/5/versions/12/retract',
      { method: 'PATCH' },
    )
  })

  it('fetches scoped document version audit events with pagination', async () => {
    requestMock.mockResolvedValueOnce({})
    await fetchDocumentVersionAuditEvents(5, 12, 2, 20)
    expect(requestMock).toHaveBeenCalledWith(
      '/documents/5/versions/12/audit-events?page=2&size=20',
    )
  })
})
