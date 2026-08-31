import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import styles from './NotFoundPage.module.css'

export function NotFoundPage() {
  useEffect(() => {
    document.title = '페이지를 찾을 수 없습니다 · 사내 플랫폼'
  }, [])

  return (
    <section className={styles.page}>
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>페이지를 찾을 수 없습니다</h1>
      <p className={styles.description}>
        주소가 올바른지 확인하거나 홈에서 다시 시작해 주세요.
      </p>
      <Link className={styles.link} to="/home">
        홈으로 돌아가기
      </Link>
    </section>
  )
}
