import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '../../shared/api/httpClient'
import {
  fetchDocument,
  fetchDocuments,
  fetchDocumentVersionAuditEvents,
  retractDocumentVersion,
} from './documentManagementApi'

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
