import { request } from '../../shared/api/httpClient'
import type {
  RagHistoryDetail,
  RagHistoryPage,
  RagQueryResult,
} from './types'

export function askQuestion(question: string): Promise<RagQueryResult> {
  return request<RagQueryResult>('/rag/questions', {
    method: 'POST',
    body: JSON.stringify({ question }),
  })
}

export function fetchHistory(params: {
  keyword?: string
  page: number
  size: number
}): Promise<RagHistoryPage> {
  const query = new URLSearchParams()

  if (params.keyword) {
    query.set('keyword', params.keyword)
  }

  query.set('page', String(params.page))
  query.set('size', String(params.size))

  return request<RagHistoryPage>(`/rag/questions/me?${query.toString()}`)
}

export function fetchHistoryDetail(
  questionId: number,
): Promise<RagHistoryDetail> {
  return request<RagHistoryDetail>(`/rag/questions/${questionId}`)
}
