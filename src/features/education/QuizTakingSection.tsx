import { useRef, useState, type FormEvent } from 'react'
import { Button, EmptyState, Skeleton } from '../../shared/ui'
import { mapEducationErrorMessage } from './educationHelpers'
import { fetchQuiz, submitQuizAttempt } from './quizApi'
import type { MyCourseQuizSummary } from './educationTypes'
import type {
  QuizAttemptResult,
  QuizDetail,
} from './quizTypes'
import styles from './QuizTakingSection.module.css'

interface QuizTakingSectionProps {
  enrollmentId: number
  quizzes: MyCourseQuizSummary[]
}

const LOAD_ERROR_MESSAGE = '퀴즈 정보를 불러오지 못했습니다.'
const SUBMIT_ERROR_MESSAGE = '퀴즈 답안을 제출하지 못했습니다.'

export function QuizTakingSection({
  enrollmentId,
  quizzes,
}: QuizTakingSectionProps) {
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null)
  const [quiz, setQuiz] = useState<QuizDetail | null>(null)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [result, setResult] = useState<QuizAttemptResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const latestRequestIdRef = useRef(0)
  const submittingRef = useRef(false)

  if (quizzes.length === 0) {
    return null
  }

  async function loadQuiz(quizId: number) {
    const requestId = ++latestRequestIdRef.current

    setSelectedQuizId(quizId)
    setQuiz(null)
    setAnswers({})
    setResult(null)
    setLoadError(null)
    setSubmitError(null)
    setValidationError(null)
    setLoading(true)

    try {
      const response = await fetchQuiz(quizId, enrollmentId)

      if (requestId !== latestRequestIdRef.current) return
      setQuiz(response)
    } catch (error) {
      if (requestId !== latestRequestIdRef.current) return
      setLoadError(mapEducationErrorMessage(error, LOAD_ERROR_MESSAGE))
    } finally {
      if (requestId === latestRequestIdRef.current) {
        setLoading(false)
      }
    }
  }

  function handleAnswer(questionId: number, optionId: number) {
    setAnswers((current) => ({
      ...current,
      [questionId]: optionId,
    }))
    setValidationError(null)
    setSubmitError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!quiz || submittingRef.current) return

    if (quiz.questions.length === 0) {
      setValidationError('등록된 문제가 없습니다.')
      return
    }

    const allAnswered = quiz.questions.every(
      (question) => answers[question.questionId] !== undefined,
    )

    if (!allAnswered) {
      setValidationError('모든 문제에 답해주세요.')
      return
    }

    submittingRef.current = true
    setSubmitting(true)
    setValidationError(null)
    setSubmitError(null)

    try {
      const response = await submitQuizAttempt(quiz.quizId, {
        enrollmentId,
        answers: quiz.questions.map((question) => ({
          questionId: question.questionId,
          optionId: answers[question.questionId],
        })),
      })

      setResult(response)
      setQuiz((current) => (
        current
          ? {
              ...current,
              attemptsUsed: response.attemptNumber,
            }
          : current
      ))
    } catch (error) {
      setSubmitError(
        mapEducationErrorMessage(error, SUBMIT_ERROR_MESSAGE),
      )
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const attemptLimitReached = Boolean(
    quiz
    && quiz.maxAttemptCount !== null
    && quiz.attemptsUsed >= quiz.maxAttemptCount,
  )

  const canRetry = Boolean(
    result
    && !result.passed
    && (
      result.remainingAttemptCount === null
      || result.remainingAttemptCount > 0
    ),
  )

  return (
    <section
      className={styles.section}
      aria-labelledby="course-quizzes-title"
    >
      <div className={styles.heading}>
        <div>
          <h2 className={styles.title} id="course-quizzes-title">
            교육 퀴즈
          </h2>
          <p className={styles.description}>
            학습 내용을 확인하고 답안을 제출해 보세요.
            결과와 응시 횟수는 저장됩니다.
          </p>
        </div>
      </div>

      <ul className={styles.quizList}>
        {quizzes.map((summary) => (
          <li key={summary.quizId}>
            <Button
              type="button"
              variant={
                selectedQuizId === summary.quizId
                  ? 'primary'
                  : 'secondary'
              }
              aria-pressed={selectedQuizId === summary.quizId}
              disabled={loading && selectedQuizId === summary.quizId}
              loading={loading && selectedQuizId === summary.quizId}
              onClick={() => void loadQuiz(summary.quizId)}
            >
              {summary.quizTitle}
            </Button>
          </li>
        ))}
      </ul>

      {loading && (
        <div
          className={styles.loading}
          role="status"
          aria-label="퀴즈 정보를 불러오는 중"
        >
          <Skeleton lines={5} />
        </div>
      )}

      {loadError && (
        <div className={styles.errorState}>
          <p className={styles.error} role="alert">
            {loadError}
          </p>
          {selectedQuizId !== null && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => void loadQuiz(selectedQuizId)}
            >
              다시 시도
            </Button>
          )}
        </div>
      )}

      {quiz && (
        <article className={styles.quiz}>
          <div className={styles.quizHeader}>
            <div>
              <h3 className={styles.quizTitle}>
                {quiz.quizTitle}
              </h3>
              <p className={styles.quizMeta}>
                합격 기준 {quiz.passingScore}점 · 응시 횟수{' '}
                {quiz.attemptsUsed}
                {quiz.maxAttemptCount === null
                  ? '회 / 제한 없음'
                  : `회 / 최대 ${quiz.maxAttemptCount}회`}
              </p>
            </div>
          </div>

          {quiz.questions.length === 0 ? (
            <EmptyState
              title="등록된 문제가 없습니다."
              description="담당자가 문제를 등록한 후 응시할 수 있습니다."
            />
          ) : attemptLimitReached && !result ? (
            <p className={styles.notice} role="status">
              최대 응시 횟수를 모두 사용했습니다.
            </p>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              {quiz.questions.map((question, index) => (
                <fieldset
                  className={styles.question}
                  disabled={submitting || result !== null}
                  key={question.questionId}
                >
                  <legend className={styles.legend}>
                    <span>
                      {index + 1}. {question.questionContent}
                    </span>
                    <span className={styles.score}>
                      {question.score}점
                    </span>
                  </legend>

                  <div className={styles.options}>
                    {question.options.map((option) => (
                      <label
                        className={styles.option}
                        key={option.optionId}
                      >
                        <input
                          type="radio"
                          name={`question-${question.questionId}`}
                          value={option.optionId}
                          checked={
                            answers[question.questionId]
                            === option.optionId
                          }
                          onChange={() => handleAnswer(
                            question.questionId,
                            option.optionId,
                          )}
                        />
                        <span>{option.optionContent}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}

              {validationError && (
                <p className={styles.error} role="alert">
                  {validationError}
                </p>
              )}

              {submitError && (
                <p className={styles.error} role="alert">
                  {submitError}
                </p>
              )}

              {!result && (
                <Button
                  type="submit"
                  loading={submitting}
                  disabled={submitting}
                >
                  답안 제출
                </Button>
              )}

              {result && (
                <div
                  className={
                    result.passed
                      ? styles.passedResult
                      : styles.failedResult
                  }
                  role="status"
                >
                  <strong>
                    {result.passed
                      ? '퀴즈에 합격했습니다.'
                      : '합격 점수에 도달하지 못했습니다.'}
                  </strong>

                  <dl className={styles.resultDetails}>
                    <div>
                      <dt>점수</dt>
                      <dd>{result.totalScore}점</dd>
                    </div>
                    <div>
                      <dt>응시 회차</dt>
                      <dd>{result.attemptNumber}회차</dd>
                    </div>
                    <div>
                      <dt>남은 횟수</dt>
                      <dd>
                        {result.remainingAttemptCount === null
                          ? '제한 없음'
                          : `${result.remainingAttemptCount}회`}
                      </dd>
                    </div>
                  </dl>

                  {canRetry && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => void loadQuiz(quiz.quizId)}
                    >
                      다시 응시
                    </Button>
                  )}
                </div>
              )}
            </form>
          )}
        </article>
      )}
    </section>
  )
}