import { describe, expect, it } from 'vitest'
import { getHomeShortcutIds } from './homeHelpers'

describe('getHomeShortcutIds', () => {
  it('returns employee shortcuts', () => {
    expect(getHomeShortcutIds(['EMPLOYEE'])).toEqual([
      'rag',
      'notifications',
    ])
  })

  it('returns manager shortcuts', () => {
    expect(getHomeShortcutIds(['MANAGER'])).toEqual([
      'rag',
      'notifications',
    ])
  })

  it('returns HR manager shortcuts', () => {
    expect(getHomeShortcutIds(['HR_MANAGER'])).toEqual([
      'rag',
      'documents',
      'upload',
      'processing',
      'notifications',
    ])
  })

  it('returns system administrator shortcuts without processing', () => {
    expect(getHomeShortcutIds(['SYSTEM_ADMIN'])).toEqual([
      'rag',
      'documents',
      'upload',
      'notifications',
    ])
  })

  it('returns combined-role shortcuts without duplicates', () => {
    expect(getHomeShortcutIds(['HR_MANAGER', 'SYSTEM_ADMIN'])).toEqual([
      'rag',
      'documents',
      'upload',
      'processing',
      'notifications',
    ])
  })
})
