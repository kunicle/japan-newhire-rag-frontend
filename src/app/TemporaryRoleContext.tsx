import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { RoleType } from './navigation'

const STORAGE_KEY = '__dev_temporary_roles__'
const DEFAULT_ROLES: RoleType[] = ['EMPLOYEE']
const VALID_ROLES: RoleType[] = [
  'EMPLOYEE',
  'MANAGER',
  'HR_MANAGER',
  'SYSTEM_ADMIN',
]

interface TemporaryRoleValue {
  roles: RoleType[]
  setRoles: (roles: RoleType[]) => void
}

const TemporaryRoleContext = createContext<TemporaryRoleValue | null>(null)

function readStoredRoles(): RoleType[] {
  try {
    const storedValue = localStorage.getItem(STORAGE_KEY)
    if (!storedValue) return DEFAULT_ROLES

    const parsedValue: unknown = JSON.parse(storedValue)
    if (!Array.isArray(parsedValue)) return DEFAULT_ROLES

    const roles = VALID_ROLES.filter((role) => parsedValue.includes(role))
    return roles.length > 0 ? roles : DEFAULT_ROLES
  } catch {
    return DEFAULT_ROLES
  }
}

export function TemporaryRoleProvider({ children }: { children: ReactNode }) {
  const [roles, setRoles] = useState<RoleType[]>(readStoredRoles)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(roles))
  }, [roles])

  const value = useMemo(() => ({ roles, setRoles }), [roles])

  return (
    <TemporaryRoleContext.Provider value={value}>
      {children}
    </TemporaryRoleContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCurrentRoles(): TemporaryRoleValue {
  const context = useContext(TemporaryRoleContext)
  if (!context) {
    throw new Error('useCurrentRoles must be used within TemporaryRoleProvider')
  }
  return context
}
