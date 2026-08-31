import type { BadgeProps } from '../../shared/ui'
import type { RagQuestionStatus } from './types'

export function getRagStatusLabel(status: RagQuestionStatus): string {
  const labels: Record<RagQuestionStatus, string> = {
    PENDING: '대기 중',
    PROCESSING: '처리 중',
    ANSWERED: '답변 완료',
    REJECTED: '근거 부족',
    FAILED: '처리 실패',
  }
  return labels[status]
}

export function getRagStatusVariant(
  status: RagQuestionStatus,
): NonNullable<BadgeProps['variant']> {
  const variants: Record<
    RagQuestionStatus,
    NonNullable<BadgeProps['variant']>
  > = {
    PENDING: 'neutral',
    PROCESSING: 'info',
    ANSWERED: 'success',
    REJECTED: 'warning',
    FAILED: 'danger',
  }
  return variants[status]
}
