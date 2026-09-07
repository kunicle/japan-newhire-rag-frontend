import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge, Button, Skeleton } from '../../shared/ui'
import {
  evaluationCycleStatusBadgeVariant,
  evaluationCycleStatusLabel,
  evaluationStatusBadgeVariant,
  evaluationStatusLabel,
  isEvaluationWritable,
  validateEvaluationScoreInput,
} from './evaluationHelpers'
import {
  fetchManagerEvaluation,
  saveManagerEvaluationDraft,
  submitManagerEvaluation,
} from './managerEvaluationApi'
import {
  buildManagerEvaluationDraftInput,
  mapManagerEvaluationErrorMessage,
  type ManagerEvaluationFormItemInput,
} from './managerEvaluationHelpers'
import type { ManagerEvaluationDetail } from './managerEvaluationTypes'
import styles from './ManagerEvaluationDetailPage.module.css'

const DETAIL_ERROR = '평가 정보를 불러오지 못했습니다.'
const SCORE_ERROR = '입력한 점수는 1.0~5.0 범위에서 소수 첫째 자리까지 입력해 주세요.'
const REQUIRED_SCORE_ERROR = '필수 평가 항목의 점수를 입력해 주세요.'
const OVERALL_REQUIRED_ERROR = '종합 의견을 입력해 주세요.'

interface FormItemState extends ManagerEvaluationFormItemInput {
  isRequired: boolean
}

function toFormItems(detail: ManagerEvaluationDetail): FormItemState[] {
  return detail.items.map((item) => ({
    evaluationItemId: item.evaluationItemId,
    scoreInput: item.score === null ? '' : String(item.score),
    itemFeedback: item.itemFeedback ?? '',
    isRequired: item.isRequired,
  }))
}

function ManagerEvaluationDetailContent({ evaluationId }: { evaluationId: number }) {
  const [detail, setDetail] = useState<ManagerEvaluationDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(true)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [formItems, setFormItems] = useState<FormItemState[]>([])
  const [overallFeedbackInput, setOverallFeedbackInput] = useState('')
  const [validationErrorByItemId, setValidationErrorByItemId] =
    useState<Map<number, string>>(new Map())
  const [overallFeedbackSubmitError, setOverallFeedbackSubmitError] =
    useState<string | null>(null)
  const [savingDraft, setSavingDraft] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submissionSucceededAwaitingRefresh, setSubmissionSucceededAwaitingRefresh] =
    useState(false)
  const latestFetchIdRef = useRef(0)
  const mountedRef = useRef(false)
  const savingDraftRef = useRef(false)
  const submittingRef = useRef(false)

  const applyDetail = useCallback((response: ManagerEvaluationDetail) => {
    setDetail(response)
    setFormItems(toFormItems(response))
    setOverallFeedbackInput(response.overallFeedback ?? '')
    setValidationErrorByItemId(new Map())
    setOverallFeedbackSubmitError(null)
    setSubmissionSucceededAwaitingRefresh(false)
  }, [])

  const loadDetail = useCallback(async (
    fallback: string = DETAIL_ERROR,
    clearDetail: boolean = true,
  ) => {
    const requestId = ++latestFetchIdRef.current
    setDetailLoading(true)
    setDetailError(null)
    if (clearDetail) setDetail(null)
    try {
      const response = await fetchManagerEvaluation(evaluationId)
      if (!mountedRef.current || requestId !== latestFetchIdRef.current) return
      applyDetail(response)
    } catch (error) {
      if (!mountedRef.current || requestId !== latestFetchIdRef.current) return
      setDetailError(mapManagerEvaluationErrorMessage(error, fallback))
    } finally {
      if (mountedRef.current && requestId === latestFetchIdRef.current) {
        setDetailLoading(false)
      }
    }
  }, [applyDetail, evaluationId])

  useEffect(() => {
    mountedRef.current = true
    queueMicrotask(() => void loadDetail())
    return () => {
      mountedRef.current = false
      latestFetchIdRef.current += 1
      savingDraftRef.current = false
      submittingRef.current = false
    }
  }, [loadDetail])

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
      const response = await saveManagerEvaluationDraft(
        evaluationId,
        buildManagerEvaluationDraftInput(formItems, overallFeedbackInput),
      )
      if (mountedRef.current) {
        applyDetail(response)
        setSaveSuccess('임시 저장되었습니다.')
      }
    } catch (error) {
      if (mountedRef.current) {
        setSaveError(mapManagerEvaluationErrorMessage(error, '임시 저장에 실패했습니다.'))
      }
    } finally {
      savingDraftRef.current = false
      if (mountedRef.current) setSavingDraft(false)
    }
  }

  async function handleSubmit() {
    if (savingDraftRef.current || submittingRef.current) return
    const scoresValid = validateScores(true)
    const overallValid = overallFeedbackInput.trim() !== ''
    setOverallFeedbackSubmitError(overallValid ? null : OVERALL_REQUIRED_ERROR)
    if (!scoresValid || !overallValid) return
    if (!window.confirm('제출 후에는 수정할 수 없습니다. 제출하시겠습니까?')) return
    if (savingDraftRef.current || submittingRef.current) return

    submittingRef.current = true
    setSubmitting(true)
    setSubmitError(null)
    setSaveError(null)
    setSaveSuccess(null)
    try {
      let draftResponse: ManagerEvaluationDetail
      try {
        draftResponse = await saveManagerEvaluationDraft(
          evaluationId,
          buildManagerEvaluationDraftInput(formItems, overallFeedbackInput),
        )
      } catch (error) {
        if (mountedRef.current) {
          setSubmitError(mapManagerEvaluationErrorMessage(
            error,
            '평가 제출 준비에 실패했습니다.',
          ))
        }
        return
      }
      if (!mountedRef.current) return
      applyDetail(draftResponse)

      try {
        await submitManagerEvaluation(evaluationId)
      } catch (error) {
        if (mountedRef.current) {
          setSubmitError(mapManagerEvaluationErrorMessage(
            error,
            '평가 제출에 실패했습니다.',
          ))
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
      <div className={styles.skeletons} role="status" aria-label="팀원 평가 정보를 불러오는 중">
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
          <h1 className={styles.title}>{detail.targetEmployee.employeeName}</h1>
          <Badge variant={evaluationStatusBadgeVariant(detail.evaluationStatus)}>
            {evaluationStatusLabel(detail.evaluationStatus)}
          </Badge>
          <Badge variant={evaluationCycleStatusBadgeVariant(detail.currentCycleStatus)}>
            {evaluationCycleStatusLabel(detail.currentCycleStatus)}
          </Badge>
        </div>
        <p className={styles.employeeInfo}>
          {detail.targetEmployee.departmentName} · {detail.targetEmployee.jobGradeName}
        </p>
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

      <section aria-labelledby="manager-evaluation-items-title">
        <h2 className={styles.sectionTitle} id="manager-evaluation-items-title">평가 항목</h2>
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
                      <label htmlFor={`manager-score-${item.evaluationItemId}`}>점수</label>
                      <input
                        id={`manager-score-${item.evaluationItemId}`}
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
                      <label htmlFor={`manager-feedback-${item.evaluationItemId}`}>
                        항목 의견
                      </label>
                      <textarea
                        id={`manager-feedback-${item.evaluationItemId}`}
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

      <section className={styles.overallSection} aria-labelledby="manager-overall-title">
        <h2 className={styles.sectionTitle} id="manager-overall-title">종합 의견</h2>
        {writable ? (
          <div className={styles.field}>
            <label htmlFor="manager-overall-feedback">종합 의견</label>
            <textarea
              id="manager-overall-feedback"
              maxLength={2000}
              value={overallFeedbackInput}
              disabled={savingDraft || submitting}
              aria-invalid={overallFeedbackSubmitError ? true : undefined}
              onChange={(event) => {
                setOverallFeedbackInput(event.target.value)
                setOverallFeedbackSubmitError(null)
              }}
            />
          </div>
        ) : (
          <p className={styles.readOnlyFeedback}>
            {detail.overallFeedback ?? '작성된 종합 의견이 없습니다.'}
          </p>
        )}
        {overallFeedbackSubmitError && (
          <p className={styles.error} role="alert">{overallFeedbackSubmitError}</p>
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
    </>
  )
}

export function ManagerEvaluationDetailPage() {
  const { evaluationId: evaluationIdParam } = useParams()
  const evaluationId = Number(evaluationIdParam)
  const validEvaluationId = Number.isInteger(evaluationId) && evaluationId > 0

  return (
    <div className={styles.page}>
      <Link className={styles.backLink} to="/manager/evaluations">팀 평가로 돌아가기</Link>
      {validEvaluationId ? (
        <ManagerEvaluationDetailContent key={evaluationId} evaluationId={evaluationId} />
      ) : (
        <p className={styles.error} role="alert">잘못된 평가 정보입니다.</p>
      )}
    </div>
  )
}
