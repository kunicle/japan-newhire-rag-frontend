import type { HTMLAttributes } from 'react'
import { cx } from '../lib/cx'
import styles from './Spinner.module.css'

export interface SpinnerProps {
  size?: 'sm' | 'md'
  label?: string
  decorative?: boolean
}

export function Spinner({
  size = 'md',
  label = '로딩 중',
  decorative = false,
}: SpinnerProps) {
  const accessibilityProps: HTMLAttributes<HTMLSpanElement> = decorative
    ? { 'aria-hidden': true }
    : { role: 'status' }

  return (
    <span
      className={cx(styles.spinner, styles[size])}
      {...accessibilityProps}
    >
      {!decorative && <span className="sr-only">{label}</span>}
    </span>
  )
}
