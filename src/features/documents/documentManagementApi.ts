import { request } from '../../shared/api/httpClient'
import type {
  DocumentManagementDetail,
  DocumentManagementListPage,
  DocumentRetractionResult,
  DocumentVersionAuditEventPage,
} from './documentManagementTypes'

export function fetchDocuments(params: {
  keyword?: string
  page: number
  size: number
}): Promise<DocumentManagementListPage> {
  const query = new URLSearchParams()
  if (params.keyword) {
    query.set('keyword', params.keyword)
  }
  query.set('page', String(params.page))
  query.set('size', String(params.size))
  return request<DocumentManagementListPage>(`/documents?${query.toString()}`)
}

export function fetchDocument(documentId: number): Promise<DocumentManagementDetail> {
  return request<DocumentManagementDetail>(`/documents/${documentId}`)
}

export function deleteDocument(documentId: number): Promise<void> {
  return request<void>(`/documents/${documentId}`, { method: 'DELETE' })
}

export function retractDocumentVersion(
  documentId: number,
  documentVersionId: number,
): Promise<DocumentRetractionResult> {
  return request<DocumentRetractionResult>(
    `/documents/${documentId}/versions/${documentVersionId}/retract`,
    { method: 'PATCH' },
  )
}

export function fetchDocumentVersionAuditEvents(
  documentId: number,
  documentVersionId: number,
  page = 0,
  size = 20,
): Promise<DocumentVersionAuditEventPage> {
  const query = new URLSearchParams({ page: String(page), size: String(size) })
  return request<DocumentVersionAuditEventPage>(
    `/documents/${documentId}/versions/${documentVersionId}/audit-events?${query.toString()}`,
  )
}
