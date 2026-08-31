import type { ReactNode } from 'react'
import { cx } from '../lib/cx'
import styles from './Badge.module.css'

export interface BadgeProps {
  variant?: 'neutral' | 'info' | 'success' | 'warning' | 'danger'
  children: ReactNode
}

export function Badge({ variant = 'neutral', children }: BadgeProps) {
  return <span className={cx(styles.badge, styles[variant])}>{children}</span>
}
