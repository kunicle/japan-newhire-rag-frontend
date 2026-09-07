import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Badge, Button, Skeleton } from '../../shared/ui'
import {
  fetchMyEvaluationResult,
  fetchMyEvaluations,
  fetchSelfEvaluation,
  saveSelfEvaluationDraft,
  submitSelfEvaluation,
} from './evaluationApi'
import {
  buildSelfEvaluationDraftInput,
  evaluationCycleStatusBadgeVariant,
  evaluationCycleStatusLabel,
  evaluationStatusBadgeVariant,
  evaluationStatusLabel,
  isEvaluationWritable,
  mapEvaluationErrorMessage,
  validateEvaluationScoreInput,
  type EvaluationFormItemInput,
} from './evaluationHelpers'
import type {
  EvaluationResult,
  EvaluationResultDetail,
  SelfEvaluationDetail,
} from './evaluationTypes'
import styles from './MyEvaluationDetailPage.module.css'

const DETAIL_ERROR = '평가 정보를 불러오지 못했습니다.'
const SCORE_ERROR = '입력한 점수는 1.0~5.0 범위에서 소수 첫째 자리까지 입력해 주세요.'
const REQUIRED_SCORE_ERROR = '필수 평가 항목의 점수를 입력해 주세요.'
const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeZone: 'UTC',
})

interface FormItemState extends EvaluationFormItemInput {
  isRequired: boolean
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? '날짜 정보 없음' : dateFormatter.format(date)
}

function toFormItems(detail: SelfEvaluationDetail): FormItemState[] {
  return detail.items.map((item) => ({
    evaluationItemId: item.evaluationItemId,
    scoreInput: item.score === null ? '' : String(item.score),
    itemFeedback: item.itemFeedback ?? '',
    isRequired: item.isRequired,
  }))
}

function ResultDetailSection({
  title,
  detail,
}: {
  title: string
  detail: EvaluationResultDetail
}) {
  return (
    <section className={styles.resultDetail} aria-label={title}>
      <h3 className={styles.resultTitle}>{title}</h3>
      <p className={styles.totalScore}>
        종합 점수: {detail.totalScore === null ? '점수 없음' : detail.totalScore}
      </p>
      <p className={styles.resultFeedback}>
        {detail.overallFeedback ?? '작성된 종합 의견이 없습니다.'}
      </p>
      <ul className={styles.resultItems}>
        {detail.items.map((item) => (
          <li key={item.evaluationItemId}>
            <strong>{item.itemName}</strong>
            <span>점수: {item.score === null ? '없음' : item.score}</span>
            {item.itemFeedback && <p>{item.itemFeedback}</p>}
          </li>
        ))}
      </ul>
    </section>
  )
}

function EvaluationDetailContent({
  evaluationId,
  cycleName,
}: {
  evaluationId: number
  cycleName: string | null
}) {
  const [resolvedCycleName, setResolvedCycleName] = useState(cycleName)
  const [detail, setDetail] = useState<SelfEvaluationDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(true)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [formItems, setFormItems] = useState<FormItemState[]>([])
  const [overallFeedbackInput, setOverallFeedbackInput] = useState('')
  const [validationErrorByItemId, setValidationErrorByItemId] =
    useState<Map<number, string>>(new Map())
  const [savingDraft, setSavingDraft] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submissionSucceededAwaitingRefresh, setSubmissionSucceededAwaitingRefresh] =
    useState(false)
  const [result, setResult] = useState<EvaluationResult | null>(null)
  const [resultLoading, setResultLoading] = useState(false)
  const [resultError, setResultError] = useState<string | null>(null)
  const latestFetchIdRef = useRef(0)
  const resultFetchIdRef = useRef(0)
  const mountedRef = useRef(false)
  const savingDraftRef = useRef(false)
  const submittingRef = useRef(false)

  const loadResult = useCallback(async (cycleId: number) => {
    const requestId = ++resultFetchIdRef.current
    setResultLoading(true)
    setResultError(null)
    setResult(null)
    try {
      const response = await fetchMyEvaluationResult(cycleId)
      if (!mountedRef.current || requestId !== resultFetchIdRef.current) return
      setResult(response)
    } catch (error) {
      if (!mountedRef.current || requestId !== resultFetchIdRef.current) return
      setResultError(mapEvaluationErrorMessage(
        error,
        '평가 결과를 불러오지 못했습니다.',
      ))
    } finally {
      if (mountedRef.current && requestId === resultFetchIdRef.current) {
        setResultLoading(false)
      }
    }
  }, [])

  const loadCycleName = useCallback(async () => {
    if (cycleName !== null) return
    try {
      const summaries = await fetchMyEvaluations()
      if (!mountedRef.current) return
      const summary = summaries.find((item) => item.evaluationId === evaluationId)
      if (summary) setResolvedCycleName(summary.cycleName)
    } catch {
      // The self-detail remains usable when optional heading context cannot be loaded.
    }
  }, [cycleName, evaluationId])

  const applyDetail = useCallback((response: SelfEvaluationDetail) => {
    setDetail(response)
    setFormItems(toFormItems(response))
    setOverallFeedbackInput(response.overallFeedback ?? '')
    setValidationErrorByItemId(new Map())
    setSubmissionSucceededAwaitingRefresh(false)
    if (response.evaluationStatus === 'PUBLISHED') {
      void loadResult(response.evaluationCycleId)
    } else {
      resultFetchIdRef.current += 1
      setResult(null)
      setResultError(null)
      setResultLoading(false)
    }
  }, [loadResult])

  const loadDetail = useCallback(async (
    fallback: string = DETAIL_ERROR,
    clearDetail: boolean = true,
  ) => {
    const requestId = ++latestFetchIdRef.current
    setDetailLoading(true)
    setDetailError(null)
    if (clearDetail) setDetail(null)
    try {
      const response = await fetchSelfEvaluation(evaluationId)
      if (!mountedRef.current || requestId !== latestFetchIdRef.current) return
      applyDetail(response)
    } catch (error) {
      if (!mountedRef.current || requestId !== latestFetchIdRef.current) return
      setDetailError(mapEvaluationErrorMessage(error, fallback))
    } finally {
      if (mountedRef.current && requestId === latestFetchIdRef.current) {
        setDetailLoading(false)
      }
    }
  }, [applyDetail, evaluationId])

  useEffect(() => {
    mountedRef.current = true
    queueMicrotask(() => {
      void loadDetail()
      void loadCycleName()
    })
    return () => {
      mountedRef.current = false
      latestFetchIdRef.current += 1
      resultFetchIdRef.current += 1
      savingDraftRef.current = false
      submittingRef.current = false
    }
  }, [loadCycleName, loadDetail])

  function validateScores(requireRequired: boolean): boolean {
    const errors = new Map<number, string>()
    for (const item of formItems) {
      if (validateEvaluationScoreInput(item.scoreInput)) {
        errors.set(item.evaluationItemId, SCORE_ERROR)
      } else if (requireRequired && item.isRequired && item.scoreInput.trim() === '') {
        errors.set(item.evaluationItemId, REQUIRED_SCORE_ERROR)
      }
    }
    setValidationErrorByItemId(errors)
    return errors.size === 0
  }

  async function handleSaveDraft() {
    if (savingDraftRef.current || submittingRef.current || !validateScores(false)) return
    savingDraftRef.current = true
    setSavingDraft(true)
    setSaveError(null)
    setSaveSuccess(null)
    try {
      const response = await saveSelfEvaluationDraft(
        evaluationId,
        buildSelfEvaluationDraftInput(formItems, overallFeedbackInput),
      )
      if (mountedRef.current) {
        applyDetail(response)
        setSaveSuccess('임시 저장되었습니다.')
      }
    } catch (error) {
      if (mountedRef.current) {
        setSaveError(mapEvaluationErrorMessage(error, '임시 저장에 실패했습니다.'))
      }
    } finally {
      savingDraftRef.current = false
      if (mountedRef.current) setSavingDraft(false)
    }
  }

  async function handleSubmit() {
    if (savingDraftRef.current || submittingRef.current) return
    if (!validateScores(true)) return
    if (!window.confirm('제출 후에는 수정할 수 없습니다. 제출하시겠습니까?')) return
    if (savingDraftRef.current || submittingRef.current) return

    submittingRef.current = true
    setSubmitting(true)
    setSubmitError(null)
    setSaveError(null)
    setSaveSuccess(null)
    try {
      let draftResponse: SelfEvaluationDetail
      try {
        draftResponse = await saveSelfEvaluationDraft(
          evaluationId,
          buildSelfEvaluationDraftInput(formItems, overallFeedbackInput),
        )
      } catch (error) {
        if (mountedRef.current) {
          setSubmitError(mapEvaluationErrorMessage(
            error,
            '평가 제출 준비에 실패했습니다.',
          ))
        }
        return
      }
      if (!mountedRef.current) return
      applyDetail(draftResponse)

      try {
        await submitSelfEvaluation(evaluationId)
      } catch (error) {
        if (mountedRef.current) {
          setSubmitError(mapEvaluationErrorMessage(error, '평가 제출에 실패했습니다.'))
        }
        return
      }
      if (!mountedRef.current) return
      setSubmissionSucceededAwaitingRefresh(true)
      await loadDetail('평가 정보를 다시 불러오지 못했습니다.', false)
    } finally {
      submittingRef.current = false
      if (mountedRef.current) setSubmitting(false)
    }
  }

  if (detailLoading && !detail) {
    return (
      <div className={styles.skeletons} role="status" aria-label="평가 정보를 불러오는 중">
        <Skeleton lines={3} /><Skeleton lines={6} /><Skeleton lines={6} />
      </div>
    )
  }

  if (detailError && !detail) {
    return (
      <div className={styles.errorState}>
        <p className={styles.error} role="alert">{detailError}</p>
        <Button variant="secondary" onClick={() => void loadDetail()}>다시 시도</Button>
      </div>
    )
  }

  if (!detail) return null

  const writable = isEvaluationWritable(
    detail.evaluationStatus,
    detail.currentCycleStatus,
  ) && !submissionSucceededAwaitingRefresh

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headingRow}>
          <h1 className={styles.title}>{resolvedCycleName ?? '자기 평가'}</h1>
          <Badge variant={evaluationStatusBadgeVariant(detail.evaluationStatus)}>
            {evaluationStatusLabel(detail.evaluationStatus)}
          </Badge>
          <Badge variant={evaluationCycleStatusBadgeVariant(detail.currentCycleStatus)}>
            {evaluationCycleStatusLabel(detail.currentCycleStatus)}
          </Badge>
        </div>
      </header>

      {detailError && (
        <div className={styles.refreshError}>
          <p className={styles.error} role="alert">{detailError}</p>
          <Button size="sm" variant="secondary" onClick={() => void loadDetail(
            '평가 정보를 다시 불러오지 못했습니다.',
            false,
          )}>
            다시 불러오기
          </Button>
        </div>
      )}

      <section aria-labelledby="evaluation-items-title">
        <h2 className={styles.sectionTitle} id="evaluation-items-title">평가 항목</h2>
        <ol className={styles.itemList}>
          {detail.items.map((item, index) => {
            const formItem = formItems[index]
            const itemError = validationErrorByItemId.get(item.evaluationItemId)
            return (
              <li className={styles.itemCard} key={item.evaluationItemId}>
                <div className={styles.itemHeading}>
                  <h3 className={styles.itemTitle}>{item.itemName}</h3>
                  {item.isRequired && <Badge variant="warning">필수</Badge>}
                </div>
                <p className={styles.itemDescription}>{item.itemDescription}</p>
                <p className={styles.itemMeta}>가중치 {item.weight} · 점수 범위 1.0~5.0</p>
                {writable && formItem ? (
                  <>
                    <div className={styles.field}>
                      <label htmlFor={`evaluation-score-${item.evaluationItemId}`}>점수</label>
                      <input
                        id={`evaluation-score-${item.evaluationItemId}`}
                        type="number"
                        min={1}
                        max={5}
                        step={0.1}
                        value={formItem.scoreInput}
                        disabled={savingDraft || submitting}
                        aria-invalid={itemError ? true : undefined}
                        onChange={(event) => setFormItems((current) => current.map(
                          (entry, entryIndex) => entryIndex === index
                            ? { ...entry, scoreInput: event.target.value }
                            : entry,
                        ))}
                      />
                    </div>
                    {itemError && <p className={styles.error} role="alert">{itemError}</p>}
                    <div className={styles.field}>
                      <label htmlFor={`evaluation-feedback-${item.evaluationItemId}`}>
                        항목 의견
                      </label>
                      <textarea
                        id={`evaluation-feedback-${item.evaluationItemId}`}
                        maxLength={1000}
                        value={formItem.itemFeedback}
                        disabled={savingDraft || submitting}
                        onChange={(event) => setFormItems((current) => current.map(
                          (entry, entryIndex) => entryIndex === index
                            ? { ...entry, itemFeedback: event.target.value }
                            : entry,
                        ))}
                      />
                    </div>
                  </>
                ) : (
                  <dl className={styles.readOnlyValues}>
                    <div><dt>점수</dt><dd>{item.score === null ? '입력 없음' : item.score}</dd></div>
                    <div><dt>항목 의견</dt><dd>{item.itemFeedback ?? '작성된 의견이 없습니다.'}</dd></div>
                  </dl>
                )}
              </li>
            )
          })}
        </ol>
      </section>

      <section className={styles.overallSection} aria-labelledby="overall-feedback-title">
        <h2 className={styles.sectionTitle} id="overall-feedback-title">종합 의견</h2>
        {writable ? (
          <div className={styles.field}>
            <label htmlFor="evaluation-overall-feedback">종합 의견</label>
            <textarea
              id="evaluation-overall-feedback"
              maxLength={2000}
              value={overallFeedbackInput}
              disabled={savingDraft || submitting}
              onChange={(event) => setOverallFeedbackInput(event.target.value)}
            />
          </div>
        ) : (
          <p className={styles.readOnlyFeedback}>
            {detail.overallFeedback ?? '작성된 종합 의견이 없습니다.'}
          </p>
        )}
        {writable && (
          <div className={styles.actions}>
            <Button
              variant="secondary"
              loading={savingDraft}
              disabled={savingDraft || submitting}
              onClick={() => void handleSaveDraft()}
            >
              임시 저장
            </Button>
            <Button
              loading={submitting}
              disabled={savingDraft || submitting}
              onClick={() => void handleSubmit()}
            >
              제출하기
            </Button>
          </div>
        )}
        {saveError && <p className={styles.error} role="alert">{saveError}</p>}
        {saveSuccess && <p className={styles.success} role="status">{saveSuccess}</p>}
        {submitError && <p className={styles.error} role="alert">{submitError}</p>}
      </section>

      {detail.evaluationStatus === 'PUBLISHED' && (
        <section className={styles.resultSection} aria-labelledby="result-title">
          <h2 className={styles.sectionTitle} id="result-title">최종 결과</h2>
          {resultLoading ? (
            <div role="status" aria-label="평가 결과를 불러오는 중"><Skeleton lines={5} /></div>
          ) : resultError ? (
            <div className={styles.errorState}>
              <p className={styles.error} role="alert">{resultError}</p>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void loadResult(detail.evaluationCycleId)}
              >
                결과 다시 불러오기
              </Button>
            </div>
          ) : result ? (
            <>
              <div className={styles.resultCycle}>
                <strong>{result.cycle.cycleName}</strong>
                <span>
                  {formatDate(result.cycle.startDate)} ~ {formatDate(result.cycle.endDate)}
                </span>
                <span>발행 예정일 {formatDate(result.cycle.plannedPublishDate)}</span>
              </div>
              <div className={styles.resultGrid}>
                <ResultDetailSection title="자기 평가" detail={result.self} />
                <ResultDetailSection title="Manager 평가" detail={result.manager} />
              </div>
            </>
          ) : null}
        </section>
      )}
    </>
  )
}

export function MyEvaluationDetailPage() {
  const { evaluationId: evaluationIdParam } = useParams()
  const location = useLocation()
  const evaluationId = Number(evaluationIdParam)
  const validEvaluationId = Number.isInteger(evaluationId) && evaluationId > 0
  const routeState = location.state as { cycleName?: unknown } | null
  const cycleName = typeof routeState?.cycleName === 'string' ? routeState.cycleName : null

  return (
    <div className={styles.page}>
      <Link className={styles.backLink} to="/me/evaluations">내 평가로 돌아가기</Link>
      {validEvaluationId ? (
        <EvaluationDetailContent
          key={evaluationId}
          evaluationId={evaluationId}
          cycleName={cycleName}
        />
      ) : (
        <p className={styles.error} role="alert">잘못된 평가 정보입니다.</p>
      )}
    </div>
  )
}
