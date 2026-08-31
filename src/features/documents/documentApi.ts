import { request } from '../../shared/api/httpClient'
import type {
  DocumentCategory,
  DocumentPublicationResult,
  DocumentUploadResult,
} from './types'

export function fetchDocumentCategories(): Promise<DocumentCategory[]> {
  return request<DocumentCategory[]>('/documents/categories')
}

export function uploadDocument(params: {
  file: File
  documentCategoryId: number
  title: string
  description?: string
}): Promise<DocumentUploadResult> {
  const formData = new FormData()
  formData.append('file', params.file)
  formData.append('documentCategoryId', String(params.documentCategoryId))
  formData.append('title', params.title)

  const description = params.description?.trim()
  if (description) {
    formData.append('description', description)
  }

  return request<DocumentUploadResult>('/documents', {
    method: 'POST',
    body: formData,
  })
}

export function publishDocumentVersion(
  documentId: number,
  documentVersionId: number,
): Promise<DocumentPublicationResult> {
  return request<DocumentPublicationResult>(
    `/documents/${documentId}/versions/${documentVersionId}/publish`,
    { method: 'PATCH' },
  )
}
