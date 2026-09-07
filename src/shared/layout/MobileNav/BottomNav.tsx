import { Bell, Home, ListChecks, Menu, MessageCircleQuestion } from 'lucide-react'
import type { MouseEvent } from 'react'
import { NavLink } from 'react-router-dom'
import { filterByRoles, navigationGroups } from '../../../app/navigation'
import { useCurrentRoles } from '../../../features/auth/AuthContext'
import { cx } from '../../ui/lib/cx'
import styles from './BottomNav.module.css'

interface BottomNavProps {
  drawerOpen: boolean
  onMoreClick: (event: MouseEvent<HTMLButtonElement>) => void
}

const primaryItems = [
  { label: '홈', path: '/home', icon: Home },
  { label: '업무', path: '/me/onboarding', icon: ListChecks },
  { label: 'AI 질문', path: '/rag', icon: MessageCircleQuestion },
  { label: '알림', path: '/notifications', icon: Bell },
]

export function BottomNav({ drawerOpen, onMoreClick }: BottomNavProps) {
  const { roles } = useCurrentRoles()
  const visibleGroups = filterByRoles(navigationGroups, roles)
  const hasRoleSpecificGroup = visibleGroups.some(
    (group) => group.requiredRoles && group.requiredRoles.length > 0,
  )

  return (
    <nav className={styles.navigation} aria-label="하단 메뉴">
      {primaryItems.map(({ label, path, icon: Icon }) => (
        <NavLink
          className={({ isActive }) =>
            cx(styles.item, isActive && styles.active)
          }
          to={path}
          end
          key={path}
        >
          <Icon size={20} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
      {hasRoleSpecificGroup && (
        <button
          className={cx(styles.item, drawerOpen && styles.active)}
          type="button"
          aria-label={drawerOpen ? '메뉴 닫기' : '더보기 메뉴 열기'}
          aria-expanded={drawerOpen}
          aria-controls="navigation-drawer"
          onClick={onMoreClick}
        >
          <Menu size={20} aria-hidden="true" />
          <span>더보기</span>
        </button>
      )}
    </nav>
  )
}
