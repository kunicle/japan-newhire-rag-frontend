import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Badge, Button, Card, EmptyState, Input, Skeleton, Spinner } from '../../shared/ui'
import { askQuestion, fetchHistory, fetchHistoryDetail } from './ragApi'
import { getRagStatusLabel, getRagStatusVariant } from './ragPresentation'
import type {
  RagCitation,
  RagHistoryDetail,
  RagHistoryItem,
  RagQueryResult,
} from './types'
import styles from './RagPage.module.css'

const VALIDATION_MESSAGE = '질문은 2자 이상 500자 이하로 입력해 주세요.'
const GENERAL_ERROR_MESSAGE =
  '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
const HISTORY_ERROR_MESSAGE = '질문 기록을 불러오지 못했습니다.'
const DETAIL_ERROR_MESSAGE = '질문 상세 내용을 불러오지 못했습니다.'
const NO_EVIDENCE_MESSAGE =
  '답변을 생성할 충분한 근거를 찾지 못했습니다.'

type ActiveResult =
  | { source: 'query'; question: string; result: RagQueryResult }
  | { source: 'history'; detail: RagHistoryDetail }
  | null

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function formatAskedAt(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '날짜 정보 없음' : dateFormatter.format(date)
}

function Citations({ citations }: { citations: RagCitation[] }) {
  if (citations.length === 0) return null

  return (
    <section className={styles.citations} aria-labelledby="citations-title">
      <h3 className={styles.sectionTitle} id="citations-title">
        참고 문서
      </h3>
      <ul className={styles.citationList}>
        {citations.map((citation) => (
          <li key={citation.documentChunkId}>
            <Card padding="sm" className={styles.citationCard}>
              <p className={styles.citationDocument}>{citation.documentName}</p>
              <p className={styles.citationMeta}>
                <span>{citation.versionName}</span>
                {citation.articleNumber && <span>{citation.articleNumber}</span>}
              </p>
              <p className={styles.citedText}>{citation.citedText}</p>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  )
}

function QueryResult({
  question,
  result,
}: {
  question: string
  result: RagQueryResult
}) {
  return (
    <Card className={styles.resultCard}>
      <p className={styles.resultQuestion}>{question}</p>
      {result.hasSufficientEvidence ? (
        <>
          <p className={styles.answer}>
            {result.answer ?? '답변 내용을 표시할 수 없습니다.'}
          </p>
          <Citations citations={result.citations} />
        </>
      ) : (
        <p className={styles.neutralMessage}>{NO_EVIDENCE_MESSAGE}</p>
      )}
    </Card>
  )
}

function HistoryResult({ detail }: { detail: RagHistoryDetail }) {
  let content

  if (detail.status === 'ANSWERED') {
    content = (
      <>
        <p className={styles.answer}>
          {detail.answer ?? '답변 내용을 표시할 수 없습니다.'}
        </p>
        <Citations citations={detail.citations} />
      </>
    )
  } else if (detail.status === 'REJECTED') {
    content = <p className={styles.neutralMessage}>{NO_EVIDENCE_MESSAGE}</p>
  } else if (detail.status === 'FAILED') {
    content = (
      <p className={styles.errorMessage}>질문 처리 중 오류가 발생했습니다.</p>
    )
  } else {
    content = (
      <div className={styles.processing}>
        <Spinner size="sm" label="질문을 처리하고 있습니다" decorative={false} />
        <span>질문을 처리하고 있습니다.</span>
      </div>
    )
  }

  return (
    <Card className={styles.resultCard}>
      <div className={styles.resultHeading}>
        <p className={styles.resultQuestion}>{detail.question}</p>
        <Badge variant={getRagStatusVariant(detail.status)}>
          {getRagStatusLabel(detail.status)}
        </Badge>
      </div>
      {content}
    </Card>
  )
}

export function RagPage() {
  const [history, setHistory] = useState<RagHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [question, setQuestion] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [activeResult, setActiveResult] = useState<ActiveResult>(null)
  const latestInteractionId = useRef(0)
  const latestHistoryFetchId = useRef(0)

  useEffect(() => {
    let cancelled = false

    async function loadInitialHistory() {
      const requestId = ++latestHistoryFetchId.current
      setHistoryLoading(true)

      try {
        const response = await fetchHistory()
        if (cancelled || requestId !== latestHistoryFetchId.current) return
        setHistory(response)
        setHistoryError(null)
      } catch {
        if (cancelled || requestId !== latestHistoryFetchId.current) return
        setHistoryError(HISTORY_ERROR_MESSAGE)
      } finally {
        if (!cancelled && requestId === latestHistoryFetchId.current) {
          setHistoryLoading(false)
        }
      }
    }

    void loadInitialHistory()
    return () => {
      cancelled = true
    }
  }, [])

  async function refreshHistory() {
    const requestId = ++latestHistoryFetchId.current
    setHistoryLoading(true)
    setHistoryError(null)

    try {
      const response = await fetchHistory()
      if (requestId !== latestHistoryFetchId.current) return
      setHistory(response)
      setHistoryError(null)
    } catch {
      if (requestId !== latestHistoryFetchId.current) return
      setHistoryError(HISTORY_ERROR_MESSAGE)
    } finally {
      if (requestId === latestHistoryFetchId.current) {
        setHistoryLoading(false)
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    const trimmedQuestion = question.trim()
    if (trimmedQuestion.length < 2 || trimmedQuestion.length > 500) {
      setSubmitError(VALIDATION_MESSAGE)
      return
    }

    const interactionId = latestInteractionId.current + 1
    latestInteractionId.current = interactionId
    setSelectedQuestionId(null)
    setDetailLoading(false)
    setDetailError(null)
    setSubmitting(true)
    setSubmitError(null)

    try {
      const result = await askQuestion(trimmedQuestion)
      if (interactionId === latestInteractionId.current) {
        setActiveResult({ source: 'query', question: trimmedQuestion, result })
      }
      setQuestion('')
      await refreshHistory()
    } catch {
      setSubmitError(GENERAL_ERROR_MESSAGE)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleHistorySelect(item: RagHistoryItem) {
    const interactionId = latestInteractionId.current + 1
    latestInteractionId.current = interactionId
    setSelectedQuestionId(item.questionId)
    setDetailLoading(true)
    setDetailError(null)

    try {
      const detail = await fetchHistoryDetail(item.questionId)
      if (interactionId !== latestInteractionId.current) return
      setActiveResult({ source: 'history', detail })
    } catch {
      if (interactionId !== latestInteractionId.current) return
      setDetailError(DETAIL_ERROR_MESSAGE)
    } finally {
      if (interactionId === latestInteractionId.current) {
        setDetailLoading(false)
      }
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>AI 질문</h1>
        <p className={styles.pageDescription}>
          사내 문서를 기반으로 필요한 정보를 찾아보세요.
        </p>
      </header>

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <Card>
            <form className={styles.questionForm} onSubmit={handleSubmit}>
              <Input
                label="질문"
                required
                maxLength={500}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="궁금한 내용을 입력해 주세요"
              />
              {submitError && (
                <p className={styles.errorMessage} role="alert">
                  {submitError}
                </p>
              )}
              <div className={styles.submitRow}>
                <Button type="submit" loading={submitting}>
                  질문하기
                </Button>
              </div>
            </form>
          </Card>

          <section className={styles.resultSection} aria-live="polite">
            <h2 className={styles.sectionTitle}>답변</h2>
            {detailLoading ? (
              <Card>
                <Skeleton lines={4} />
              </Card>
            ) : detailError ? (
              <p className={styles.errorMessage} role="alert">
                {detailError}
              </p>
            ) : activeResult?.source === 'query' ? (
              <QueryResult
                question={activeResult.question}
                result={activeResult.result}
              />
            ) : activeResult?.source === 'history' ? (
              <HistoryResult detail={activeResult.detail} />
            ) : (
              <EmptyState
                title="아직 표시할 답변이 없습니다"
                description="질문을 입력하거나 이전 질문을 선택해 주세요."
              />
            )}
          </section>
        </div>

        <aside className={styles.historyPanel} aria-labelledby="history-title">
          <h2 className={styles.sectionTitle} id="history-title">
            이전 질문
          </h2>
          {historyLoading ? (
            <div className={styles.historySkeleton}>
              <Skeleton lines={3} />
              <Skeleton lines={3} />
              <Skeleton lines={3} />
            </div>
          ) : historyError ? (
            <p className={styles.errorMessage} role="alert">
              {historyError}
            </p>
          ) : history.length === 0 ? (
            <EmptyState
              title="질문 기록이 없습니다"
              description="첫 질문을 남겨보세요."
            />
          ) : (
            <ul className={styles.historyList}>
              {history.map((item) => (
                <li key={item.questionId}>
                  <button
                    type="button"
                    className={styles.historyButton}
                    aria-pressed={selectedQuestionId === item.questionId}
                    onClick={() => {
                      void handleHistorySelect(item)
                    }}
                  >
                    <span className={styles.historyQuestion}>{item.question}</span>
                    <span className={styles.historyMeta}>
                      <Badge variant={getRagStatusVariant(item.status)}>
                        {getRagStatusLabel(item.status)}
                      </Badge>
                      <time dateTime={item.askedAt}>{formatAskedAt(item.askedAt)}</time>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  )
}
