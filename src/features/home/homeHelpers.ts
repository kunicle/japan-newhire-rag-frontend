import { hasAnyRole } from '../auth/roles'
import type { RoleType } from '../auth/types'

export type HomeShortcutId =
  | 'rag'
  | 'organization'
  | 'education'
  | 'onboarding'
  | 'evaluation'
  | 'managerEducation'
  | 'managerEvaluation'
  | 'documents'
  | 'upload'
  | 'processing'
  | 'courseManagement'
  | 'hrOnboarding'
  | 'hrEvaluation'
  | 'notifications'

export function getHomeShortcutIds(
  roles: RoleType[],
): HomeShortcutId[] {
  const ids: HomeShortcutId[] = ['rag', 'organization', 'education', 'onboarding', 'evaluation']

  if (hasAnyRole(roles, ['MANAGER'])) {
    ids.push('managerEducation', 'managerEvaluation')
  }

  if (hasAnyRole(roles, ['HR_MANAGER', 'SYSTEM_ADMIN'])) {
    ids.push('documents', 'upload')
  }

  if (hasAnyRole(roles, ['HR_MANAGER'])) {
    ids.push('processing', 'courseManagement', 'hrOnboarding', 'hrEvaluation')
  }

  ids.push('notifications')

  return ids
}
