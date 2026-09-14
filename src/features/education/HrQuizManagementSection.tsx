import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Plus } from 'lucide-react'
import {
  Badge,
  Button,
  EmptyState,
  Skeleton,
} from '../../shared/ui'
import { HrQuizForm } from './HrQuizForm'
import {
  changeHrQuizActivation,
  createHrQuiz,
  fetchHrQuiz,
  fetchHrQuizzes,
} from './hrQuizApi'
import { mapHrCourseErrorMessage } from './hrCourseHelpers'
import type {
  HrQuiz,
  HrQuizCreateInput,
} from './hrQuizTypes'
import styles from './HrQuizManagementSection.module.css'

interface HrQuizManagementSectionProps {
  courseId: number
}

const QUIZ_LIST_ERROR =
  '퀴즈 목록을 불러오지 못했습니다.'
const QUIZ_DETAIL_ERROR =
  '퀴즈 상세 정보를 불러오지 못했습니다.'

function formatScore(score: number) {
  return Number.isInteger(score)
    ? `${score}점`
    : `${score.toFixed(2)}점`
}

function formatAttemptCount(count: number | null) {
  return count === null ? '제한 없음' : `${count}회`
}

export function HrQuizManagementSection({
  courseId,
}: HrQuizManagementSectionProps) {
  const [quizzes, setQuizzes] = useState<HrQuiz[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] =
    useState<string | null>(null)

  const [showCreateForm, setShowCreateForm] =
    useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] =
    useState<string | null>(null)

  const [detailQuizId, setDetailQuizId] =
    useState<number | null>(null)
  const [detailQuiz, setDetailQuiz] =
    useState<HrQuiz | null>(null)
  const [detailLoading, setDetailLoading] =
    useState(false)
  const [detailError, setDetailError] =
    useState<string | null>(null)

  const [pendingQuizIds, setPendingQuizIds] =
    useState<Set<number>>(new Set())
  const [actionErrorByQuizId, setActionErrorByQuizId] =
    useState<Map<number, string>>(new Map())

  const mountedRef = useRef(false)
  const listRequestIdRef = useRef(0)
  const detailRequestIdRef = useRef(0)
  const creatingRef = useRef(false)
  const pendingQuizIdsRef =
    useRef<Set<number>>(new Set())

  const loadQuizzes = useCallback(async () => {
    const requestId = ++listRequestIdRef.current

    setLoading(true)
    setListError(null)

    try {
      const response = await fetchHrQuizzes(courseId)

      if (
        !mountedRef.current ||
        requestId !== listRequestIdRef.current
      ) {
        return
      }

      setQuizzes(response)
    } catch (error) {
      if (
        !mountedRef.current ||
        requestId !== listRequestIdRef.current
      ) {
        return
      }

      setListError(
        mapHrCourseErrorMessage(
          error,
          QUIZ_LIST_ERROR,
        ),
      )
    } finally {
      if (
        mountedRef.current &&
        requestId === listRequestIdRef.current
      ) {
        setLoading(false)
      }
    }
  }, [courseId])

  useEffect(() => {
    const pendingIds = pendingQuizIdsRef.current

    mountedRef.current = true

    queueMicrotask(() => {
      void loadQuizzes()
    })

    return () => {
      mountedRef.current = false
      listRequestIdRef.current += 1
      detailRequestIdRef.current += 1
      pendingIds.clear()
    }
  }, [loadQuizzes])

  async function handleCreate(
    input: HrQuizCreateInput,
  ) {
    if (creatingRef.current) {
      return
    }

    creatingRef.current = true
    setCreating(true)
    setCreateError(null)

    try {
      const createdQuiz = await createHrQuiz(
        courseId,
        input,
      )

      if (!mountedRef.current) {
        return
      }

      setQuizzes((current) => [
        createdQuiz,
        ...current.filter(
          (quiz) => quiz.quizId !== createdQuiz.quizId,
        ),
      ])
      setShowCreateForm(false)
    } catch (error) {
      if (mountedRef.current) {
        setCreateError(
          mapHrCourseErrorMessage(
            error,
            '퀴즈 생성에 실패했습니다.',
          ),
        )
      }
    } finally {
      creatingRef.current = false

      if (mountedRef.current) {
        setCreating(false)
      }
    }
  }

  async function loadQuizDetail(quizId: number) {
    const requestId = ++detailRequestIdRef.current

    setDetailQuizId(quizId)
    setDetailQuiz(null)
    setDetailLoading(true)
    setDetailError(null)

    try {
      const response = await fetchHrQuiz(
        courseId,
        quizId,
      )

      if (
        !mountedRef.current ||
        requestId !== detailRequestIdRef.current
      ) {
        return
      }

      setDetailQuiz(response)
    } catch (error) {
      if (
        !mountedRef.current ||
        requestId !== detailRequestIdRef.current
      ) {
        return
      }

      setDetailError(
        mapHrCourseErrorMessage(
          error,
          QUIZ_DETAIL_ERROR,
        ),
      )
    } finally {
      if (
        mountedRef.current &&
        requestId === detailRequestIdRef.current
      ) {
        setDetailLoading(false)
      }
    }
  }

  function handleDetailToggle(quizId: number) {
    if (detailQuizId === quizId) {
      detailRequestIdRef.current += 1
      setDetailQuizId(null)
      setDetailQuiz(null)
      setDetailLoading(false)
      setDetailError(null)
      return
    }

    void loadQuizDetail(quizId)
  }

  function beginQuizWrite(quizId: number) {
    if (pendingQuizIdsRef.current.has(quizId)) {
      return false
    }

    pendingQuizIdsRef.current.add(quizId)
    setPendingQuizIds(
      new Set(pendingQuizIdsRef.current),
    )

    setActionErrorByQuizId((current) => {
      const next = new Map(current)
      next.delete(quizId)
      return next
    })

    return true
  }

  function finishQuizWrite(quizId: number) {
    pendingQuizIdsRef.current.delete(quizId)

    if (mountedRef.current) {
      setPendingQuizIds(
        new Set(pendingQuizIdsRef.current),
      )
    }
  }

  async function handleActivation(quiz: HrQuiz) {
    if (!beginQuizWrite(quiz.quizId)) {
      return
    }

    try {
      const updatedQuiz =
        await changeHrQuizActivation(
          courseId,
          quiz.quizId,
          !quiz.active,
        )

      if (!mountedRef.current) {
        return
      }

      setQuizzes((current) =>
        current.map((currentQuiz) =>
          currentQuiz.quizId === updatedQuiz.quizId
            ? updatedQuiz
            : currentQuiz,
        ),
      )

      if (detailQuizId === updatedQuiz.quizId) {
        setDetailQuiz(updatedQuiz)
      }
    } catch (error) {
      if (mountedRef.current) {
        setActionErrorByQuizId((current) => {
          const next = new Map(current)

          next.set(
            quiz.quizId,
            mapHrCourseErrorMessage(
              error,
              '퀴즈 활성 상태 변경에 실패했습니다.',
            ),
          )

          return next
        })
      }
    } finally {
      finishQuizWrite(quiz.quizId)
    }
  }

  return (
    <section
      className={styles.section}
      aria-labelledby="hr-quiz-section-title"
    >
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleGroup}>
          <h2
            id="hr-quiz-section-title"
            className={styles.sectionTitle}
          >
            O/X 퀴즈 관리
          </h2>

          <p>
            과정에 연결된 O/X 퀴즈를 생성하고 관리합니다.
          </p>
        </div>

        <Button
          size="sm"
          disabled={creating}
          onClick={() => {
            setCreateError(null)
            setShowCreateForm((current) => !current)
          }}
        >
          <Plus size={16} aria-hidden="true" />
          {showCreateForm
            ? '생성 취소'
            : '퀴즈 추가'}
        </Button>
      </div>

      {showCreateForm && (
        <div className={styles.formPanel}>
          <HrQuizForm
            submitting={creating}
            onSubmit={(input) => {
              void handleCreate(input)
            }}
            onCancel={() => {
              setShowCreateForm(false)
              setCreateError(null)
            }}
          />

          {createError && (
            <p className={styles.error} role="alert">
              {createError}
            </p>
          )}
        </div>
      )}

      {listError && (
        <div className={styles.errorState}>
          <p className={styles.error} role="alert">
            {listError}
          </p>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              void loadQuizzes()
            }}
          >
            다시 시도
          </Button>
        </div>
      )}

      {loading && quizzes.length === 0 ? (
        <div
          className={styles.skeletons}
          role="status"
          aria-label="퀴즈 목록을 불러오는 중"
        >
          <Skeleton lines={3} />
          <Skeleton lines={3} />
        </div>
      ) : quizzes.length === 0 && !listError ? (
        <EmptyState
          title="등록된 퀴즈가 없습니다."
          description="퀴즈를 추가해 교육 내용을 점검하세요."
        />
      ) : (
        <ol className={styles.quizList}>
          {quizzes.map((quiz) => {
            const pending = pendingQuizIds.has(
              quiz.quizId,
            )
            const actionError =
              actionErrorByQuizId.get(quiz.quizId)
            const detailOpened =
              detailQuizId === quiz.quizId

            return (
              <li
                key={quiz.quizId}
                className={styles.quizItem}
              >
                <div className={styles.quizHeader}>
                  <div className={styles.quizTitleGroup}>
                    <h3 className={styles.quizTitle}>
                      {quiz.quizTitle}
                    </h3>

                    <p>퀴즈 ID: {quiz.quizId}</p>
                  </div>

                  <Badge
                    variant={
                      quiz.active
                        ? 'success'
                        : 'neutral'
                    }
                  >
                    {quiz.active ? '활성' : '비활성'}
                  </Badge>
                </div>

                <dl className={styles.summaryGrid}>
                  <div>
                    <dt>합격 점수</dt>
                    <dd>
                      {formatScore(quiz.passingScore)}
                    </dd>
                  </div>

                  <div>
                    <dt>최대 응시 횟수</dt>
                    <dd>
                      {formatAttemptCount(
                        quiz.maxAttemptCount,
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>문제 수</dt>
                    <dd>{quiz.questions.length}개</dd>
                  </div>
                </dl>

                <div className={styles.actions}>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    onClick={() =>
                      handleDetailToggle(quiz.quizId)
                    }
                  >
                    {detailOpened
                      ? '상세 닫기'
                      : '상세 보기'}
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    loading={pending}
                    disabled={pending}
                    onClick={() => {
                      void handleActivation(quiz)
                    }}
                  >
                    {quiz.active
                      ? '비활성화'
                      : '활성화'}
                  </Button>
                </div>

                {actionError && (
                  <p
                    className={styles.error}
                    role="alert"
                  >
                    {actionError}
                  </p>
                )}

                {detailOpened && (
                  <div className={styles.detailPanel}>
                    {detailLoading ? (
                      <div
                        role="status"
                        aria-label="퀴즈 상세 정보를 불러오는 중"
                      >
                        <Skeleton lines={4} />
                      </div>
                    ) : detailError ? (
                      <div className={styles.errorState}>
                        <p
                          className={styles.error}
                          role="alert"
                        >
                          {detailError}
                        </p>

                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            void loadQuizDetail(
                              quiz.quizId,
                            )
                          }}
                        >
                          상세 다시 시도
                        </Button>
                      </div>
                    ) : detailQuiz ? (
                      <ol
                        className={styles.questionList}
                      >
                        {detailQuiz.questions.map(
                          (question) => (
                            <li
                              key={question.questionId}
                              className={
                                styles.questionItem
                              }
                            >
                              <div
                                className={
                                  styles.questionHeader
                                }
                              >
                                <strong>
                                  {question.questionOrder}
                                  번
                                </strong>

                                <span>
                                  {formatScore(
                                    question.score,
                                  )}
                                </span>
                              </div>

                              <p>
                                {
                                  question.questionContent
                                }
                              </p>

                              <Badge variant="success">
                                정답:{' '}
                                {question.correctAnswer}
                              </Badge>
                            </li>
                          ),
                        )}
                      </ol>
                    ) : null}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}