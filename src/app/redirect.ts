import { hasAnyRole } from '../features/auth/roles'
import type { RoleType } from '../features/auth/types'

interface RestrictedRoute {
  prefix: string
  allowedRoles: RoleType[]
}

const restrictedRoutes: RestrictedRoute[] = [
  {
    prefix: '/hr/documents/processing',
    allowedRoles: ['HR_MANAGER'],
  },
  {
    prefix: '/hr/documents',
    allowedRoles: ['HR_MANAGER', 'SYSTEM_ADMIN'],
  },
  { prefix: '/hr', allowedRoles: ['HR_MANAGER'] },
  { prefix: '/manager', allowedRoles: ['MANAGER'] },
  { prefix: '/admin', allowedRoles: ['SYSTEM_ADMIN'] },
]

function matchesRoutePrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

export function resolveRedirectPath(
  from: unknown,
  roles: RoleType[],
): string {
  if (
    typeof from !== 'string' ||
    !from.startsWith('/') ||
    from.startsWith('//')
  ) {
    return '/home'
  }

  const pathname = from.split(/[?#]/, 1)[0]

  if (pathname === '/login' || pathname === '/access-denied') {
    return '/home'
  }

  const restrictedRoute = restrictedRoutes.find(({ prefix }) =>
    matchesRoutePrefix(pathname, prefix),
  )

  if (
    restrictedRoute &&
    !hasAnyRole(roles, restrictedRoute.allowedRoles)
  ) {
    return '/home'
  }

  return from
}
