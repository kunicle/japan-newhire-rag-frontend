import { request } from '../../shared/api/httpClient'
import type {
  DocumentManagementDetail,
  DocumentManagementListItem,
} from './documentManagementTypes'

export function fetchDocuments(): Promise<DocumentManagementListItem[]> {
  return request<DocumentManagementListItem[]>('/documents')
}

export function fetchDocument(documentId: number): Promise<DocumentManagementDetail> {
  return request<DocumentManagementDetail>(`/documents/${documentId}`)
}
