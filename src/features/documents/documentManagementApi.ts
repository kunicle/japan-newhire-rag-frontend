import { request } from '../../shared/api/httpClient'
import type {
  DocumentManagementDetail,
  DocumentManagementListItem,
  DocumentRetractionResult,
  DocumentVersionAuditEventPage,
} from './documentManagementTypes'

export function fetchDocuments(): Promise<DocumentManagementListItem[]> {
  return request<DocumentManagementListItem[]>('/documents')
}

export function fetchDocument(documentId: number): Promise<DocumentManagementDetail> {
  return request<DocumentManagementDetail>(`/documents/${documentId}`)
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
