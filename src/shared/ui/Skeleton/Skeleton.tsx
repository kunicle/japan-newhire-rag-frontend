import type { CSSProperties } from 'react'
import { cx } from '../lib/cx'
import styles from './Skeleton.module.css'

export interface SkeletonProps {
  variant?: 'text' | 'block' | 'circle'
  width?: string | number
  height?: string | number
  lines?: number
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  lines,
}: SkeletonProps) {
  const requestedLines = lines ?? 1
  const lineCount = Number.isFinite(requestedLines)
    ? Math.min(20, Math.max(1, Math.floor(requestedLines)))
    : 1

  if (variant === 'text') {
    const groupStyle: CSSProperties = { width }
    const lineStyle: CSSProperties = { height }

    return (
      <span className={styles.group} style={groupStyle} aria-hidden="true">
        {Array.from({ length: lineCount }, (_, index) => (
          <span
            className={cx(
              styles.skeleton,
              styles.text,
              lineCount > 1 && index === lineCount - 1 && styles.lastLine,
            )}
            style={lineStyle}
            key={index}
          />
        ))}
      </span>
    )
  }

  const style: CSSProperties = { width, height }

  return (
    <span
      className={cx(styles.skeleton, styles[variant])}
      style={style}
      aria-hidden="true"
    />
  )
}
