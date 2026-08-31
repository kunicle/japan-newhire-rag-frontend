import { UserRound } from 'lucide-react'
import { filterByRoles, navigationGroups } from '../../../app/navigation'
import { useCurrentRoles } from '../../../app/TemporaryRoleContext'
import { NavItem } from './NavItem'
import styles from './Sidebar.module.css'

export function Sidebar() {
  const { roles } = useCurrentRoles()
  const visibleGroups = filterByRoles(navigationGroups, roles)

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>사내 플랫폼</div>
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
      <div className={styles.profile} aria-label="내 프로필">
        <span className={styles.avatar}>
          <UserRound size={20} aria-hidden="true" />
        </span>
      </div>
    </aside>
  )
}
