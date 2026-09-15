import type {
  QuizAttemptReview as QuizAttemptReviewData,
} from './quizTypes'
import styles from './QuizTakingSection.module.css'

interface QuizAttemptReviewProps {
  review: QuizAttemptReviewData
  attemptLimitReached: boolean
}

export function QuizAttemptReview({
  review,
  attemptLimitReached,
}: QuizAttemptReviewProps) {
  return (
    <div className={styles.review} role="status">
      <div
        className={
          review.passed
            ? styles.passedResult
            : styles.failedResult
        }
      >
        <strong>
          {review.passed
            ? '퀴즈에 합격했습니다.'
            : '최종 응시에서 합격 점수에 도달하지 못했습니다.'}
        </strong>

        <dl className={styles.resultDetails}>
          <div>
            <dt>최종 점수</dt>
            <dd>{review.totalScore}점</dd>
          </div>
          <div>
            <dt>응시 회차</dt>
            <dd>{review.attemptNumber}회차</dd>
          </div>
          <div>
            <dt>남은 횟수</dt>
            <dd>
              {review.remainingAttemptCount === null
                ? '제한 없음'
                : `${review.remainingAttemptCount}회`}
            </dd>
          </div>
        </dl>
      </div>

      {!review.passed && attemptLimitReached && (
        <p className={styles.notice}>
          최대 응시 횟수를 모두 사용했습니다.
          아래에서 최종 답안과 정답을 확인하세요.
        </p>
      )}

      <section
        className={styles.reviewQuestions}
        aria-labelledby="quiz-review-title"
      >
        <h4
          className={styles.reviewTitle}
          id="quiz-review-title"
        >
          최종 응시 답안 및 정답
        </h4>

        {review.questions.map((question, index) => (
          <article
            className={styles.reviewQuestion}
            key={question.questionId}
          >
            <div className={styles.reviewQuestionHeader}>
              <h5>
                {index + 1}. {question.questionContent}
              </h5>
              <span
                className={
                  question.correct
                    ? styles.correctBadge
                    : styles.incorrectBadge
                }
              >
                {question.correct ? '정답' : '오답'}
              </span>
            </div>

            <dl className={styles.reviewAnswers}>
              <div>
                <dt>내가 선택한 답</dt>
                <dd>{question.selectedOptionContent}</dd>
              </div>
              <div>
                <dt>정답</dt>
                <dd>{question.correctOptionContent}</dd>
              </div>
              <div>
                <dt>획득 점수</dt>
                <dd>
                  {question.earnedScore}점 / {question.score}점
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </section>
    </div>
  )
}
