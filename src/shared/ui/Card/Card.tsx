import type { HTMLAttributes } from 'react'
import { cx } from '../lib/cx'
import styles from './Card.module.css'

export interface CardProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({
  padding = 'md',
  className,
  children,
  ...divProps
}: CardProps) {
  return (
    <div className={cx(styles.card, styles[padding], className)} {...divProps}>
      {children}
    </div>
  )
}
