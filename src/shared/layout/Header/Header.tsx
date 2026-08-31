import { Bell, LogOut, Menu, UserRound, X, type LucideIcon } from 'lucide-react'
import type { MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../features/auth/AuthContext'
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
  const { user, logout } = useAuth()
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
        {user && (
          <div
            className={styles.profile}
            role="group"
            aria-label={`${user.employeeName}, ${user.departmentName}`}
          >
            <span className={styles.avatar} aria-hidden="true">
              <UserRound size={18} aria-hidden="true" />
            </span>
            <span className={styles.profileText}>{user.employeeName}</span>
            <button
              type="button"
              className={styles.logoutButton}
              aria-label="로그아웃"
              onClick={() => {
                void logout()
              }}
            >
              <LogOut size={16} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
