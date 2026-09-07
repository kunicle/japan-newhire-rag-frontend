import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { onAuthExpired } from '../../shared/api/authEvents'
import { refreshAccessToken } from '../../shared/api/refreshCoordinator'
import { setAccessToken } from '../../shared/api/tokenStore'
import * as authApi from './authApi'
import type { AuthStatus, AuthUser, RoleType } from './types'

interface AuthContextValue {
  status: AuthStatus
  user: AuthUser | null
  roles: RoleType[]
  login(email: string, password: string): Promise<void>
  logout(): Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('initializing')
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      const refreshed = await refreshAccessToken()

      if (cancelled) return

      if (!refreshed) {
        setStatus('unauthenticated')
        return
      }

      try {
        const me = await authApi.fetchMe()

        if (cancelled) return

        setUser(me)
        setStatus('authenticated')
      } catch {
        if (cancelled) return

        setAccessToken(null)
        setUser(null)
        setStatus('unauthenticated')
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(
    () =>
      onAuthExpired(() => {
        setAccessToken(null)
        setUser(null)
        setStatus('unauthenticated')
      }),
    [],
  )

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login(email, password)
    if (
      typeof response.accessToken !== 'string' ||
      response.accessToken.trim() === ''
    ) {
      throw new Error('Invalid login response')
    }

    setAccessToken(response.accessToken)

    try {
      const me = await authApi.fetchMe()
      setUser(me)
      setStatus('authenticated')
    } catch (error) {
      setAccessToken(null)
      setUser(null)
      setStatus('unauthenticated')
      throw error
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Local logout must complete even when the server request fails.
    } finally {
      setAccessToken(null)
      setUser(null)
      setStatus('unauthenticated')
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      roles: user?.roles ?? [],
      login,
      logout,
    }),
    [login, logout, status, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCurrentRoles(): { roles: RoleType[] } {
  const { roles } = useAuth()
  return { roles }
}
