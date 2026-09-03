import { LogOut, UserRound, X } from 'lucide-react'
import { useEffect, useRef, type RefObject } from 'react'
import { filterByRoles, navigationGroups } from '../../../app/navigation'
import { useAuth } from '../../../features/auth/AuthContext'
import { NavItem } from '../Sidebar/NavItem'
import styles from './NavDrawer.module.css'

interface NavDrawerProps {
  open: boolean
  onClose: () => void
  returnFocusRef: RefObject<HTMLButtonElement | null>
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function NavDrawer({
  open,
  onClose,
  returnFocusRef,
}: NavDrawerProps) {
  const { user, roles, logout } = useAuth()
  const visibleGroups = filterByRoles(navigationGroups, roles)
  const drawerRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    const returnFocusElement = returnFocusRef.current
    document.body.style.overflow = 'hidden'
    const focusFrame = requestAnimationFrame(() => closeButtonRef.current?.focus())

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab' || !drawerRef.current) return

      const focusableElements = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      )
      const firstElement = focusableElements[0]
      const lastElement = focusableElements.at(-1)
      if (!firstElement || !lastElement) return

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      cancelAnimationFrame(focusFrame)
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      returnFocusElement?.focus()
    }
  }, [onClose, open, returnFocusRef])

  return (
    <div className={styles.layer} data-open={open || undefined} aria-hidden={!open}>
      <div className={styles.scrim} onClick={onClose} />
      <div
        ref={drawerRef}
        id="navigation-drawer"
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-label="전체 메뉴"
      >
        <div className={styles.header}>
          <span className={styles.title}>주식회사 SLDK</span>
          <button
            ref={closeButtonRef}
            className={styles.closeButton}
            type="button"
            aria-label="메뉴 닫기"
            onClick={onClose}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <nav className={styles.navigation} aria-label="주 메뉴">
          {visibleGroups.map((group) => (
            <div className={styles.group} key={group.label ?? 'home'}>
              {group.label && <p className={styles.groupLabel}>{group.label}</p>}
              <div className={styles.items}>
                {group.items.map((item) => (
                  <NavItem key={item.path} {...item} onNavigate={onClose} />
                ))}
              </div>
            </div>
          ))}
        </nav>
        {user && (
          <div className={styles.profile}>
            <span className={styles.avatar} aria-hidden="true">
              <UserRound size={20} aria-hidden="true" />
            </span>
            <span className={styles.identity}>
              <span className={styles.name}>{user.employeeName}</span>
              <span className={styles.department}>{user.departmentName}</span>
            </span>
            <button
              type="button"
              className={styles.logoutButton}
              aria-label="로그아웃"
              onClick={() => {
                void logout()
              }}
            >
              <LogOut size={18} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
