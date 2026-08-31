import { request } from '../../shared/api/httpClient'
import type {
  RagHistoryDetail,
  RagHistoryItem,
  RagQueryResult,
} from './types'

export function askQuestion(question: string): Promise<RagQueryResult> {
  return request<RagQueryResult>('/rag/questions', {
    method: 'POST',
    body: JSON.stringify({ question }),
  })
}

export function fetchHistory(): Promise<RagHistoryItem[]> {
  return request<RagHistoryItem[]>('/rag/questions/me')
}

export function fetchHistoryDetail(
  questionId: number,
): Promise<RagHistoryDetail> {
  return request<RagHistoryDetail>(`/rag/questions/${questionId}`)
}
