import { describe, expect, it } from 'vitest'
import { getHomeShortcutIds } from './homeHelpers'

describe('getHomeShortcutIds', () => {
  it('returns employee shortcuts', () => {
    expect(getHomeShortcutIds(['EMPLOYEE'])).toEqual([
      'rag',
      'education',
      'onboarding',
      'evaluation',
      'notifications',
    ])
  })

  it('returns manager shortcuts', () => {
    expect(getHomeShortcutIds(['MANAGER'])).toEqual([
      'rag',
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
  })

  it('returns system administrator shortcuts without processing', () => {
    expect(getHomeShortcutIds(['SYSTEM_ADMIN'])).toEqual([
      'rag',
      'education',
      'onboarding',
      'evaluation',
      'documents',
      'upload',
      'notifications',
    ])
  })

  it('returns combined-role shortcuts without duplicates', () => {
    expect(getHomeShortcutIds(['HR_MANAGER', 'SYSTEM_ADMIN'])).toEqual([
      'rag',
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
  })

  it('returns manager and HR shortcuts together without duplicates', () => {
    expect(getHomeShortcutIds(['MANAGER', 'HR_MANAGER'])).toEqual([
      'rag',
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
