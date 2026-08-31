import { Bell, Menu, UserRound, X, type LucideIcon } from 'lucide-react'
import type { MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import styles from './Header.module.css'

export interface BreadcrumbItem {
  label: string
}

interface HeaderProps {
  title: string
  breadcrumbs?: BreadcrumbItem[]
  drawerOpen: boolean
  onMenuToggle: (event: MouseEvent<HTMLButtonElement>) => void
}

export function Header({
  title,
  breadcrumbs = [],
  drawerOpen,
  onMenuToggle,
}: HeaderProps) {
  const MenuIcon: LucideIcon = drawerOpen ? X : Menu

  return (
    <header className={styles.header}>
      <div className={styles.leading}>
        <button
          className={styles.iconButton}
          type="button"
          aria-label={drawerOpen ? '메뉴 닫기' : '메뉴 열기'}
          aria-expanded={drawerOpen}
          aria-controls="navigation-drawer"
          onClick={onMenuToggle}
        >
          <MenuIcon size={20} aria-hidden="true" />
        </button>
        <div>
          {breadcrumbs.length > 0 && (
            <ol className={styles.breadcrumbs} aria-label="현재 위치">
              {breadcrumbs.map((breadcrumb) => (
                <li key={breadcrumb.label}>{breadcrumb.label}</li>
              ))}
            </ol>
          )}
          <p className={styles.title}>{title}</p>
        </div>
      </div>
      <div className={styles.actions}>
        <Link className={styles.iconButton} to="/notifications" aria-label="알림">
          <Bell size={20} aria-hidden="true" />
        </Link>
        <div className={styles.profile} aria-label="내 프로필">
          <span className={styles.avatar}>
            <UserRound size={18} aria-hidden="true" />
          </span>
          <span className={styles.profileText}>내 프로필</span>
        </div>
      </div>
    </header>
  )
}
