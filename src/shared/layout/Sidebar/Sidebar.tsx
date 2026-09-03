import { LogOut, UserRound } from 'lucide-react'
import { filterByRoles, navigationGroups } from '../../../app/navigation'
import { useAuth } from '../../../features/auth/AuthContext'
import { NavItem } from './NavItem'
import styles from './Sidebar.module.css'

export function Sidebar() {
  const { user, roles, logout } = useAuth()
  const visibleGroups = filterByRoles(navigationGroups, roles)

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandMark} aria-hidden="true">S</span>
        <span className={styles.brandText}>
          <strong>주식회사 SLDK</strong>
          <small>WORKSPACE</small>
        </span>
      </div>
      <nav className={styles.navigation} aria-label="주 메뉴">
        {visibleGroups.map((group) => (
          <div className={styles.group} key={group.label ?? 'home'}>
            {group.label && <p className={styles.groupLabel}>{group.label}</p>}
            <div className={styles.items}>
              {group.items.map((item) => (
                <NavItem key={item.path} {...item} />
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
    </aside>
  )
}
