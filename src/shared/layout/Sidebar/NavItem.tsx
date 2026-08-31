import type { LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cx } from '../../ui/lib/cx'
import styles from './NavItem.module.css'

interface NavItemProps {
  label: string
  path: string
  icon: LucideIcon
  onNavigate?: () => void
}

export function NavItem({ label, path, icon: Icon, onNavigate }: NavItemProps) {
  return (
    <NavLink
      className={({ isActive }) =>
        cx(styles.link, isActive && styles.active)
      }
      to={path}
      end
      onClick={onNavigate}
    >
      <Icon className={styles.icon} size={19} aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  )
}
