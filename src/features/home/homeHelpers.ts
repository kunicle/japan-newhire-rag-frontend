import { hasAnyRole } from '../auth/roles'
import type { RoleType } from '../auth/types'

export type HomeShortcutId =
  | 'rag'
  | 'education'
  | 'onboarding'
  | 'evaluation'
  | 'managerEducation'
  | 'documents'
  | 'upload'
  | 'processing'
  | 'courseManagement'
  | 'hrOnboarding'
  | 'notifications'

export function getHomeShortcutIds(
  roles: RoleType[],
): HomeShortcutId[] {
  const ids: HomeShortcutId[] = ['rag', 'education', 'onboarding', 'evaluation']

  if (hasAnyRole(roles, ['MANAGER'])) {
    ids.push('managerEducation')
  }

  if (hasAnyRole(roles, ['HR_MANAGER', 'SYSTEM_ADMIN'])) {
    ids.push('documents', 'upload')
  }

  if (hasAnyRole(roles, ['HR_MANAGER'])) {
    ids.push('processing', 'courseManagement', 'hrOnboarding')
  }

  ids.push('notifications')

  return ids
}
