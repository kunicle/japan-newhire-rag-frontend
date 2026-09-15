import {
  EVALUATION_SCORE_DECIMAL_GUIDE,
  EVALUATION_SCORE_GUIDE,
} from './evaluationHelpers'
import styles from './EvaluationScoreGuide.module.css'

export function EvaluationScoreGuide() {
  return (
    <>
      <p className={styles.help}>{EVALUATION_SCORE_DECIMAL_GUIDE}</p>
      <ul className={styles.guide} aria-label="점수 기준">
        {EVALUATION_SCORE_GUIDE.map(({ score, label }) => (
          <li key={score}><strong>{score}점</strong> {label}</li>
        ))}
      </ul>
    </>
  )
}
