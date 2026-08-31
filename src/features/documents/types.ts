export interface DocumentCategory {
  documentCategoryId: number
  categoryCode: string
  categoryName: string
}

export interface DocumentUploadResult {
  documentId: number
  documentVersionId: number
  documentProcessingJobId: number
  processingStatus: string
}

export interface DocumentPublicationResult {
  documentId: number
  documentVersionId: number
  publicationStatus: string
  active: boolean
  publishedAt: string | null
  publishedBy: number | null
}
