import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { hasAnyRole } from '../features/auth/roles'
import type { RoleType } from '../features/auth/types'

interface RoleRouteProps {
  allow: RoleType[]
}

export function RoleRoute({ allow }: RoleRouteProps) {
  const { roles } = useAuth()

  if (hasAnyRole(roles, allow)) return <Outlet />
  return <Navigate to="/access-denied" replace />
}
