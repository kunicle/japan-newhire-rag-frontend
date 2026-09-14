import {
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button, Input } from '../../shared/ui'
import type {
  HrQuizCreateInput,
  OxAnswer,
} from './hrQuizTypes'
import styles from './HrQuizForm.module.css'

interface HrQuizFormProps {
  submitting: boolean
  onSubmit: (input: HrQuizCreateInput) => void
  onCancel?: () => void
}

interface QuestionDraft {
  clientId: number
  questionContent: string
  score: number
  correctAnswer: OxAnswer
}

interface QuizDraft {
  quizTitle: string
  passingScore: number
  maxAttemptCount: number
  required: boolean
  questions: QuestionDraft[]
}

const INITIAL_VALUE: QuizDraft = {
  quizTitle: '',
  passingScore: 80,
  maxAttemptCount: 3,
  required: true,
  questions: [
    {
      clientId: 1,
      questionContent: '',
      score: 100,
      correctAnswer: 'O',
    },
  ],
}

export function HrQuizForm({
  submitting,
  onSubmit,
  onCancel,
}: HrQuizFormProps) {
  const [value, setValue] = useState<QuizDraft>(INITIAL_VALUE)
  const [validationError, setValidationError] =
    useState<string | null>(null)
  const nextQuestionIdRef = useRef(2)

  function updateQuestion(
    clientId: number,
    patch: Partial<Omit<QuestionDraft, 'clientId'>>,
  ) {
    setValue((current) => ({
      ...current,
      questions: current.questions.map((question) =>
        question.clientId === clientId
          ? { ...question, ...patch }
          : question,
      ),
    }))
  }

  function addQuestion() {
    const clientId = nextQuestionIdRef.current
    nextQuestionIdRef.current += 1

    setValue((current) => ({
      ...current,
      questions: [
        ...current.questions,
        {
          clientId,
          questionContent: '',
          score: 0,
          correctAnswer: 'O',
        },
      ],
    }))
  }

  function removeQuestion(clientId: number) {
    setValue((current) => {
      if (current.questions.length === 1) {
        return current
      }

      return {
        ...current,
        questions: current.questions.filter(
          (question) => question.clientId !== clientId,
        ),
      }
    })
  }

  function validate(): string | null {
    if (!value.quizTitle.trim()) {
      return '퀴즈 제목을 입력해 주세요.'
    }

    if (
      !Number.isFinite(value.passingScore) ||
      value.passingScore < 0 ||
      value.passingScore > 100
    ) {
      return '합격 점수는 0점 이상 100점 이하로 입력해 주세요.'
    }

    if (
      !Number.isInteger(value.maxAttemptCount) ||
      value.maxAttemptCount < 1
    ) {
      return '최대 응시 횟수는 1 이상의 정수로 입력해 주세요.'
    }

    if (value.questions.length === 0) {
      return '문제를 한 개 이상 등록해 주세요.'
    }

    for (const [index, question] of value.questions.entries()) {
      if (!question.questionContent.trim()) {
        return `${index + 1}번 문제의 내용을 입력해 주세요.`
      }

      if (
        !Number.isFinite(question.score) ||
        question.score <= 0 ||
        question.score > 100
      ) {
        return `${index + 1}번 문제의 배점은 0점 초과 100점 이하로 입력해 주세요.`
      }

      const scoreWithTwoDecimalPlaces =
        Math.round(question.score * 100) / 100

      if (scoreWithTwoDecimalPlaces !== question.score) {
        return `${index + 1}번 문제의 배점은 소수점 둘째 자리까지만 입력할 수 있습니다.`
      }
    }

    const totalScoreInCents = value.questions.reduce(
      (sum, question) => sum + Math.round(question.score * 100),
      0,
    )

    if (totalScoreInCents !== 10000) {
      return '전체 문제의 배점 합계는 100점이어야 합니다.'
    }

    return null
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submitting) {
      return
    }

    const error = validate()

    if (error) {
      setValidationError(error)
      return
    }

    setValidationError(null)

    onSubmit({
      quizTitle: value.quizTitle.trim(),
      passingScore: value.passingScore,
      maxAttemptCount: value.maxAttemptCount,
      required: value.required,
      questions: value.questions.map((question) => ({
        questionContent: question.questionContent.trim(),
        score: question.score,
        correctAnswer: question.correctAnswer,
      })),
    })
  }

  const totalScore = value.questions.reduce(
    (sum, question) => sum + (Number.isFinite(question.score)
      ? question.score
      : 0),
    0,
  )

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit}
    >
      <Input
        id="quiz-title"
        label="퀴즈 제목"
        required
        maxLength={200}
        value={value.quizTitle}
        disabled={submitting}
        onChange={(event) => {
          setValue((current) => ({
            ...current,
            quizTitle: event.target.value,
          }))
        }}
      />

      <div className={styles.settingGrid}>
        <Input
          id="quiz-passing-score"
          label="합격 점수"
          type="number"
          required
          min={0}
          max={100}
          step={0.01}
          value={value.passingScore}
          disabled={submitting}
          onChange={(event) => {
            setValue((current) => ({
              ...current,
              passingScore: Number(event.target.value),
            }))
          }}
        />

        <Input
          id="quiz-max-attempt-count"
          label="최대 응시 횟수"
          type="number"
          required
          min={1}
          step={1}
          value={value.maxAttemptCount}
          disabled={submitting}
          onChange={(event) => {
            setValue((current) => ({
              ...current,
              maxAttemptCount: Number(event.target.value),
            }))
          }}
        />
      </div>

      <label className={styles.requiredToggle}>
        <input
          id="quiz-required"
          type="checkbox"
          checked={value.required}
          disabled={submitting}
          onChange={(event) => {
            setValue((current) => ({
              ...current,
              required: event.target.checked,
            }))
          }}
        />
        필수 퀴즈
      </label>

      <section className={styles.questionSection}>
        <div className={styles.questionSectionHeader}>
          <div>
            <h3>O/X 문제</h3>
            <p>
              모든 문제의 배점 합계가 100점이 되도록 입력해 주세요.
            </p>
          </div>

          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={submitting}
            onClick={addQuestion}
          >
            <Plus size={16} aria-hidden="true" />
            문제 추가
          </Button>
        </div>

        <ol className={styles.questionList}>
          {value.questions.map((question, index) => (
            <li
              key={question.clientId}
              className={styles.questionItem}
            >
              <div className={styles.questionHeader}>
                <h4>{index + 1}번 문제</h4>

                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  disabled={
                    submitting ||
                    value.questions.length === 1
                  }
                  onClick={() =>
                    removeQuestion(question.clientId)
                  }
                >
                  <Trash2 size={16} aria-hidden="true" />
                  삭제
                </Button>
              </div>

              <div className={styles.field}>
                <label
                  htmlFor={`quiz-question-${question.clientId}`}
                >
                  문제 내용
                </label>

                <textarea
                  id={`quiz-question-${question.clientId}`}
                  required
                  maxLength={2000}
                  value={question.questionContent}
                  disabled={submitting}
                  onChange={(event) =>
                    updateQuestion(question.clientId, {
                      questionContent: event.target.value,
                    })
                  }
                />
              </div>

              <div className={styles.questionSettingGrid}>
                <Input
                  id={`quiz-question-score-${question.clientId}`}
                  label="배점"
                  type="number"
                  required
                  min={0.01}
                  max={100}
                  step={0.01}
                  value={question.score}
                  disabled={submitting}
                  onChange={(event) =>
                    updateQuestion(question.clientId, {
                      score: Number(event.target.value),
                    })
                  }
                />

                <div className={styles.field}>
                  <label
                    htmlFor={`quiz-question-answer-${question.clientId}`}
                  >
                    정답
                  </label>

                  <select
                    id={`quiz-question-answer-${question.clientId}`}
                    value={question.correctAnswer}
                    disabled={submitting}
                    onChange={(event) =>
                      updateQuestion(question.clientId, {
                        correctAnswer:
                          event.target.value as OxAnswer,
                      })
                    }
                  >
                    <option value="O">O</option>
                    <option value="X">X</option>
                  </select>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <p
          className={
            totalScore === 100
              ? styles.validTotal
              : styles.invalidTotal
          }
        >
          현재 배점 합계: {totalScore}점
        </p>
      </section>

      {validationError && (
        <p className={styles.error} role="alert">
          {validationError}
        </p>
      )}

      <div className={styles.actions}>
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            disabled={submitting}
            onClick={onCancel}
          >
            취소
          </Button>
        )}

        <Button
          type="submit"
          loading={submitting}
          disabled={submitting}
        >
          퀴즈 저장
        </Button>
      </div>
    </form>
  )
}