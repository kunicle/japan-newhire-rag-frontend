import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Header } from './Header'
import { useAuth } from '../../../features/auth/AuthContext'

vi.mock('../../../features/auth/AuthContext', () => ({ useAuth: vi.fn() }))
;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const useAuthMock = vi.mocked(useAuth)
const profile = {
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
  roles: ['SYSTEM_ADMIN'] as const,
  hireDate: '2020-04-01',
  managerEmployeeId: null,
  managerName: null,
}

function CurrentPath() {
  const location = useLocation()
  return <output data-testid="current-path">{location.pathname}</output>
}

describe('Header profile navigation', () => {
  let container: HTMLDivElement
  let root: Root | null
  const logout = vi.fn()

  beforeEach(() => {
    useAuthMock.mockReset()
    logout.mockReset()
    useAuthMock.mockReturnValue({
      status: 'authenticated',
      user: { ...profile, roles: [...profile.roles] },
      roles: [...profile.roles],
      login: vi.fn(),
      logout,
    })
    root = null
    container = document.createElement('div')
    document.body.append(container)
  })

  afterEach(async () => {
    if (root) await act(async () => root?.unmount())
    container.remove()
  })

  it('keeps the Bell and logout while linking the user profile to /me', async () => {
    root = createRoot(container)
    await act(async () => root?.render(
      <MemoryRouter initialEntries={['/home']}>
        <Header title="홈" drawerOpen={false} onMenuToggle={vi.fn()} />
        <CurrentPath />
      </MemoryRouter>,
    ))

    const profileLink = [...container.querySelectorAll('a')].find((link) =>
      link.getAttribute('aria-label') === '내 프로필: Integration Test Admin',
    )
    expect(profileLink?.getAttribute('href')).toBe('/me')
    expect(profileLink?.textContent).toContain('Integration Test Admin')
    expect(container.querySelector('a[aria-label="알림"]')).toBeTruthy()
    expect(container.querySelector('button[aria-label="로그아웃"]')).toBeTruthy()

    await act(async () => profileLink?.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 })))
    expect(container.querySelector('[data-testid="current-path"]')?.textContent).toBe('/me')

    await act(async () => container.querySelector<HTMLButtonElement>('button[aria-label="로그아웃"]')?.click())
    expect(logout).toHaveBeenCalledOnce()
  })
})
