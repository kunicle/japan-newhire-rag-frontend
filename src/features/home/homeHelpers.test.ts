import { describe, expect, it } from 'vitest'
import { getHomeShortcutIds } from './homeHelpers'

describe('getHomeShortcutIds', () => {
  it('returns employee shortcuts', () => {
    expect(getHomeShortcutIds(['EMPLOYEE'])).toEqual([
      'rag',
      'education',
      'notifications',
    ])
  })

  it('returns manager shortcuts', () => {
    expect(getHomeShortcutIds(['MANAGER'])).toEqual([
      'rag',
      'education',
      'notifications',
    ])
  })

  it('returns HR manager shortcuts', () => {
    expect(getHomeShortcutIds(['HR_MANAGER'])).toEqual([
      'rag',
      'education',
      'documents',
      'upload',
      'processing',
      'notifications',
    ])
  })

  it('returns system administrator shortcuts without processing', () => {
    expect(getHomeShortcutIds(['SYSTEM_ADMIN'])).toEqual([
      'rag',
      'education',
      'documents',
      'upload',
      'notifications',
    ])
  })

  it('returns combined-role shortcuts without duplicates', () => {
    expect(getHomeShortcutIds(['HR_MANAGER', 'SYSTEM_ADMIN'])).toEqual([
      'rag',
      'education',
      'documents',
      'upload',
      'processing',
      'notifications',
    ])
  })
})
