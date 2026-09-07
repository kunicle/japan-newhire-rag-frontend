import type { RoleType } from './types'

export function hasAnyRole(
  userRoles: RoleType[],
  allowed: RoleType[],
): boolean {
  return allowed.some((role) => userRoles.includes(role))
}
