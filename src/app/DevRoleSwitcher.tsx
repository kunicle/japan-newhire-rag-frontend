import { Button } from '../shared/ui'
import { useCurrentRoles } from './TemporaryRoleContext'
import type { RoleType } from './navigation'
import styles from './DevRoleSwitcher.module.css'

const ROLE_OPTIONS: Array<{ role: RoleType; label: string }> = [
  { role: 'EMPLOYEE', label: '구성원' },
  { role: 'MANAGER', label: '팀 관리자' },
  { role: 'HR_MANAGER', label: 'HR' },
  { role: 'SYSTEM_ADMIN', label: '시스템 관리자' },
]

export function DevRoleSwitcher() {
  const { roles, setRoles } = useCurrentRoles()

  function toggleRole(role: RoleType) {
    setRoles(
      roles.includes(role)
        ? roles.filter((currentRole) => currentRole !== role)
        : [...roles, role],
    )
  }

  return (
    <aside className={styles.switcher} aria-label="개발용 역할 전환">
      <p className={styles.title}>DEV 역할</p>
      <div className={styles.options}>
        {ROLE_OPTIONS.map(({ role, label }) => (
          <label className={styles.option} key={role}>
            <input
              type="checkbox"
              checked={roles.includes(role)}
              onChange={() => toggleRole(role)}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
      <Button size="sm" variant="secondary" onClick={() => setRoles(['EMPLOYEE'])}>
        초기화
      </Button>
    </aside>
  )
}
