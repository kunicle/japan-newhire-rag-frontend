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
const HISTORY_ERROR_MESSAGE = '질문 기록을 불러오지 못했습니다.'
const DETAIL_ERROR_MESSAGE = '질문 상세 내용을 불러오지 못했습니다.'
const NO_EVIDENCE_MESSAGE = '답변에 사용할 충분한 근거를 찾지 못했습니다.'
const NO_EVIDENCE_GUIDANCE =
  '질문을 조금 더 구체적으로 작성하거나, 관련 문서의 용어를 포함해 다시 질문해 주세요.'

type RagUiState =
  | { status: 'IDLE' }
  | { status: 'LOADING'; question: string }
  | { status: 'ANSWERED'; question: string; result: RagQueryResult }
  | {
      status: 'INSUFFICIENT_EVIDENCE'
      question: string
      result: RagQueryResult
    }
  | { status: 'ERROR'; question: string }
  | { status: 'HISTORY'; detail: RagHistoryDetail }

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
        근거 문서
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

function AnsweredResult({ question, result }: { question: string; result: RagQueryResult }) {
  return (
    <Card className={styles.resultCard}>
      <p className={styles.resultQuestion}>{question}</p>
      <p className={styles.answer}>{result.answer}</p>
      <Citations citations={result.citations} />
    </Card>
  )
}

function InsufficientEvidence({
  question,
  onEdit,
}: {
  question: string
  onEdit: () => void
}) {
  return (
    <Card className={styles.resultCard}>
      <p className={styles.resultQuestion}>{question}</p>
      <div className={styles.insufficientState} role="status">
        <p className={styles.statusTitle}>{NO_EVIDENCE_MESSAGE}</p>
        <p className={styles.statusDescription}>{NO_EVIDENCE_GUIDANCE}</p>
        <Button type="button" variant="secondary" size="sm" onClick={onEdit}>
          질문 수정하기
        </Button>
      </div>
    </Card>
  )
}

function SystemError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className={styles.resultCard}>
      <div className={styles.systemError} role="alert">
        <p className={styles.statusTitle}>AI 답변을 불러오지 못했습니다.</p>
        <p className={styles.statusDescription}>잠시 후 다시 시도해 주세요.</p>
        <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
          다시 시도
        </Button>
      </div>
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
    content = (
      <div className={styles.insufficientState} role="status">
        <p className={styles.statusTitle}>
          이 질문에 답변할 충분한 근거를 찾지 못했습니다.
        </p>
      </div>
    )
  } else if (detail.status === 'FAILED') {
    content = (
      <p className={styles.errorMessage}>질문 처리 중 오류가 발생했습니다.</p>
    )
  } else {
    content = (
      <div className={styles.processing}>
        <Spinner size="sm" label="질문을 처리하고 있습니다" decorative={false} />
        <span>사내 문서에서 근거를 찾고 있습니다.</span>
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
  const [validationError, setValidationError] = useState<string | null>(null)
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [uiState, setUiState] = useState<RagUiState>({ status: 'IDLE' })
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

  async function executeQuestion(trimmedQuestion: string) {
    const interactionId = latestInteractionId.current + 1
    latestInteractionId.current = interactionId
    setSelectedQuestionId(null)
    setDetailLoading(false)
    setDetailError(null)
    setSubmitting(true)
    setValidationError(null)
    setUiState({ status: 'LOADING', question: trimmedQuestion })

    try {
      const result = await askQuestion(trimmedQuestion)
      if (interactionId === latestInteractionId.current) {
        if (!result.hasSufficientEvidence) {
          setUiState({
            status: 'INSUFFICIENT_EVIDENCE',
            question: trimmedQuestion,
            result,
          })
        } else if (result.answer?.trim()) {
          setUiState({ status: 'ANSWERED', question: trimmedQuestion, result })
        } else {
          setUiState({ status: 'ERROR', question: trimmedQuestion })
        }
      }
      setQuestion('')
      await refreshHistory()
    } catch {
      if (interactionId === latestInteractionId.current) {
        setUiState({ status: 'ERROR', question: trimmedQuestion })
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    const trimmedQuestion = question.trim()
    if (trimmedQuestion.length < 2 || trimmedQuestion.length > 500) {
      setValidationError(VALIDATION_MESSAGE)
      return
    }

    await executeQuestion(trimmedQuestion)
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
      setUiState({ status: 'HISTORY', detail })
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
              {validationError && (
                <p className={styles.errorMessage} role="alert">
                  {validationError}
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
            {submitting || uiState.status === 'LOADING' ? (
              <Card className={styles.resultCard}>
                <div className={styles.processing} role="status">
                  <Spinner size="sm" label="근거 검색 중" decorative={false} />
                  <span>사내 문서에서 근거를 찾고 있습니다.</span>
                </div>
              </Card>
            ) : detailLoading ? (
              <Card>
                <Skeleton lines={4} />
              </Card>
            ) : detailError ? (
              <p className={styles.errorMessage} role="alert">
                {detailError}
              </p>
            ) : uiState.status === 'ANSWERED' ? (
              <AnsweredResult question={uiState.question} result={uiState.result} />
            ) : uiState.status === 'INSUFFICIENT_EVIDENCE' ? (
              <InsufficientEvidence
                question={uiState.question}
                onEdit={() => setQuestion(uiState.question)}
              />
            ) : uiState.status === 'ERROR' ? (
              <SystemError
                onRetry={() => {
                  void executeQuestion(uiState.question)
                }}
              />
            ) : uiState.status === 'HISTORY' ? (
              <HistoryResult detail={uiState.detail} />
            ) : (
              <EmptyState
                title="사내 문서를 기반으로 궁금한 내용을 질문해 보세요"
                description="질문을 입력하거나 이전 질문을 선택할 수 있습니다."
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
