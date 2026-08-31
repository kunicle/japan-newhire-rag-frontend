import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { AuthLoadingScreen } from './AuthLoadingScreen'
import { resolveRedirectPath } from './redirect'

export function GuestRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'initializing') return <AuthLoadingScreen />
  if (status === 'authenticated') {
    const redirectTo = resolveRedirectPath(location.state?.from)
    return <Navigate to={redirectTo} replace />
  }
  return <Outlet />
}
