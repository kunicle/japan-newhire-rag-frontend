import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../lib/cx'
import { Spinner } from '../Spinner/Spinner'
import styles from './Button.module.css'

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leadingIcon,
  trailingIcon,
  type = 'button',
  disabled,
  className,
  children,
  'aria-busy': ariaBusy,
  ...buttonProps
}: ButtonProps) {
  return (
    <button
      {...buttonProps}
      className={cx(
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        className,
      )}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading ? true : ariaBusy}
    >
      {loading && (
        <span className={styles.loadingIndicator}>
          <Spinner size="sm" decorative />
        </span>
      )}
      <span className={cx(styles.content, loading && styles.hiddenContent)}>
        {leadingIcon && <span className={styles.icon}>{leadingIcon}</span>}
        <span className={styles.label}>{children}</span>
        {trailingIcon && <span className={styles.icon}>{trailingIcon}</span>}
      </span>
    </button>
  )
}
