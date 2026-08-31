import { useEffect } from 'react'
import { Badge } from '../shared/ui'
import styles from './PlaceholderPage.module.css'

export interface PlaceholderPageProps {
  title: string
  description: string
  status?: string
}

export function PlaceholderPage({
  title,
  description,
  status = '준비 중',
}: PlaceholderPageProps) {
  useEffect(() => {
    document.title = `${title} · 사내 플랫폼`
  }, [title])

  return (
    <section className={styles.page} aria-labelledby="page-title">
      <Badge variant="info">{status}</Badge>
      <h1 id="page-title" className={styles.title}>
        {title}
      </h1>
      <p className={styles.description}>{description}</p>
    </section>
  )
}
