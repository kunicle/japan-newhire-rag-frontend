import { describe, expect, it } from 'vitest'
import { getRagStatusLabel, getRagStatusVariant } from './ragPresentation'
import type { RagQuestionStatus } from './types'

const statuses: Array<
  [RagQuestionStatus, string, ReturnType<typeof getRagStatusVariant>]
> = [
  ['PENDING', '대기 중', 'neutral'],
  ['PROCESSING', '처리 중', 'info'],
  ['ANSWERED', '답변 완료', 'success'],
  ['REJECTED', '근거 부족', 'warning'],
  ['FAILED', '처리 실패', 'danger'],
]

describe('RAG status presentation', () => {
  it.each(statuses)('maps %s to its Korean label', (status, label) => {
    expect(getRagStatusLabel(status)).toBe(label)
  })

  it.each(statuses)('maps %s to a supported badge variant', (status, _label, variant) => {
    expect(getRagStatusVariant(status)).toBe(variant)
  })
})
