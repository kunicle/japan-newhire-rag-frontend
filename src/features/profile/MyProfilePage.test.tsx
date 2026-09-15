import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MyProfilePage } from './MyProfilePage'
import { useAuth } from '../auth/AuthContext'
import type { AuthUser } from '../auth/types'

vi.mock('../auth/AuthContext', () => ({ useAuth: vi.fn() }))
;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true
const useAuthMock = vi.mocked(useAuth)
const profile: AuthUser = {
  appUserId: 1,
  employeeId: 2,
  employeeNumber: 'E-0002',
  employeeName: 'Integration Test Admin',
  email: 'admin@example.com',
  departmentId: 3,
  departmentName: '플랫폼팀',
  jobGradeId: 4,
  jobGradeName: '선임',
  jobGradeLevel: 3,
  roles: ['SYSTEM_ADMIN'],
  hireDate: '2020-04-01',
  managerEmployeeId: null,
  managerName: null,
}

describe('MyProfilePage', () => {
  let container: HTMLDivElement
  let root: Root | null

  beforeEach(() => {
    useAuthMock.mockReset()
    root = null
    container = document.createElement('div')
    document.body.append(container)
  })

  afterEach(async () => {
    if (root) await act(async () => root?.unmount())
    container.remove()
  })

  async function renderPage() {
    root = createRoot(container)
    await act(async () => root?.render(<MyProfilePage />))
  }

  it('renders current user data as read-only information', async () => {
    useAuthMock.mockReturnValue({ status: 'authenticated', user: profile, roles: [...profile.roles], login: vi.fn(), logout: vi.fn() })
    await renderPage()
    expect(container.textContent).toContain('내 프로필')
    expect(container.textContent).toContain('Integration Test Admin')
    expect(container.textContent).toContain('E-0002')
    expect(container.textContent).toContain('admin@example.com')
    expect(container.textContent).toContain('플랫폼팀')
    expect(container.textContent).toContain('시스템 관리자')
    expect(container.querySelector('input, button, select, textarea')).toBeNull()
  })

  it('shows a loading state while authentication is initializing', async () => {
    useAuthMock.mockReturnValue({ status: 'initializing', user: null, roles: [], login: vi.fn(), logout: vi.fn() })
    await renderPage()
    expect(container.querySelector('[role="status"]')?.getAttribute('aria-label')).toBe('프로필을 불러오는 중')
  })

  it('shows an empty state when no current user is available', async () => {
    useAuthMock.mockReturnValue({ status: 'unauthenticated', user: null, roles: [], login: vi.fn(), logout: vi.fn() })
    await renderPage()
    expect(container.textContent).toContain('프로필 정보를 확인할 수 없습니다.')
  })
})

