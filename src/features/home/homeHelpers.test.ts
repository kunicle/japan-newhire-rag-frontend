import { describe, expect, it } from 'vitest'
import { getHomeShortcutIds } from './homeHelpers'

describe('getHomeShortcutIds', () => {
  it('returns employee shortcuts', () => {
    expect(getHomeShortcutIds(['EMPLOYEE'])).toEqual([
      'rag',
      'organization',
      'education',
      'onboarding',
      'evaluation',
      'notifications',
    ])
    expect(getHomeShortcutIds(['EMPLOYEE'])).not.toContain('audit')
    expect(getHomeShortcutIds(['EMPLOYEE'])).not.toContain('adminUsers')
  })

  it('returns manager shortcuts', () => {
    expect(getHomeShortcutIds(['MANAGER'])).toEqual([
      'rag',
      'organization',
      'education',
      'onboarding',
      'evaluation',
      'managerEducation',
      'managerEvaluation',
      'notifications',
    ])
  })

  it('returns HR manager shortcuts', () => {
    expect(getHomeShortcutIds(['HR_MANAGER'])).toEqual([
      'rag',
      'organization',
      'education',
      'onboarding',
      'evaluation',
      'documents',
      'upload',
      'processing',
      'courseManagement',
      'hrOnboarding',
      'hrEvaluation',
      'notifications',
    ])
    expect(getHomeShortcutIds(['HR_MANAGER'])).not.toContain('audit')
    expect(getHomeShortcutIds(['HR_MANAGER'])).not.toContain('adminUsers')
  })

  it('returns system administrator shortcuts without processing', () => {
    expect(getHomeShortcutIds(['SYSTEM_ADMIN'])).toEqual([
      'rag',
      'organization',
      'education',
      'onboarding',
      'evaluation',
      'documents',
      'upload',
      'audit',
      'adminUsers',
      'notifications',
    ])
  })

  it('returns combined-role shortcuts without duplicates', () => {
    expect(getHomeShortcutIds(['HR_MANAGER', 'SYSTEM_ADMIN'])).toEqual([
      'rag',
      'organization',
      'education',
      'onboarding',
      'evaluation',
      'documents',
      'upload',
      'processing',
      'courseManagement',
      'hrOnboarding',
      'hrEvaluation',
      'audit',
      'adminUsers',
      'notifications',
    ])
  })

  it('returns manager and HR shortcuts together without duplicates', () => {
    expect(getHomeShortcutIds(['MANAGER', 'HR_MANAGER'])).toEqual([
      'rag',
      'organization',
      'education',
      'onboarding',
      'evaluation',
      'managerEducation',
      'managerEvaluation',
      'documents',
      'upload',
      'processing',
      'courseManagement',
      'hrOnboarding',
      'hrEvaluation',
      'notifications',
    ])
  })
})
