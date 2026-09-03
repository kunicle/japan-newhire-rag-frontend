import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import styles from './AccessDeniedPage.module.css'

export function AccessDeniedPage() {
  useEffect(() => {
    document.title = '접근 권한 없음 · 주식회사 SLDK'
  }, [])

  return (
    <section className={styles.page}>
      <p className={styles.code}>403</p>
      <h1 className={styles.title}>접근 권한이 없습니다</h1>
      <p className={styles.description}>
        이 페이지에 접근할 권한이 없습니다.
      </p>
      <Link className={styles.link} to="/home">
        홈으로 돌아가기
      </Link>
    </section>
  )
}
