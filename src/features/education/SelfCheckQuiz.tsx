import { useState, type FormEvent } from 'react'
import { Button } from '../../shared/ui'
import styles from './SelfCheckQuiz.module.css'

export type QuizAnswer = 'O' | 'X'

export interface SelfCheckQuestion {
  id: string
  statement: string
  correctAnswer: QuizAnswer
}

interface SelfCheckQuizProps {
  questions: SelfCheckQuestion[]
}

export function SelfCheckQuiz({ questions }: SelfCheckQuizProps) {
  const [answers, setAnswers] = useState<
    Partial<Record<string, QuizAnswer>>
  >({})
  const [correctCount, setCorrectCount] = useState<number | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  function handleAnswer(questionId: string, answer: QuizAnswer) {
    setAnswers((current) => ({
      ...current,
      [questionId]: answer,
    }))
    setValidationError(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const allAnswered = questions.every(
      (question) => answers[question.id] !== undefined,
    )

    if (!allAnswered) {
      setValidationError('모든 문제에 답해주세요.')
      return
    }

    const nextCorrectCount = questions.filter(
      (question) => answers[question.id] === question.correctAnswer,
    ).length

    setCorrectCount(nextCorrectCount)
    setValidationError(null)
  }

  function handleRetry() {
    setAnswers({})
    setCorrectCount(null)
    setValidationError(null)
  }

  return (
    <section className={styles.quiz} aria-labelledby="self-check-quiz-title">
      <h2 className={styles.title} id="self-check-quiz-title">
        교육 이수 확인 퀴즈
      </h2>
      <p className={styles.description}>
        학습한 내용을 O/X 문제로 확인해 보세요. 결과는 저장되지 않습니다.
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        {questions.map((question, index) => (
          <fieldset
            className={styles.question}
            disabled={correctCount !== null}
            key={question.id}
          >
            <legend>
              {index + 1}. {question.statement}
            </legend>

            <div className={styles.answers}>
              {(['O', 'X'] as const).map((answer) => (
                <label className={styles.answer} key={answer}>
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={answer}
                    checked={answers[question.id] === answer}
                    onChange={() => handleAnswer(question.id, answer)}
                  />
                  {answer}
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

        {correctCount === null ? (
          <Button type="submit">결과 확인</Button>
        ) : (
          <div className={styles.result} role="status">
            <strong>
              전체 {questions.length}개 중 {correctCount}개를 맞혔습니다.
            </strong>
            <Button variant="secondary" onClick={handleRetry}>
              다시 풀기
            </Button>
          </div>
        )}
      </form>
    </section>
  )
}