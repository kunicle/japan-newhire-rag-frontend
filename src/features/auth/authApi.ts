import { request } from '../../shared/api/httpClient'
import type { AuthUser, LoginResponse } from './types'

export function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    skipAuthRetry: true,
  })
}

export function fetchMe(): Promise<AuthUser> {
  return request<AuthUser>('/me')
}

export function logout(): Promise<void> {
  return request<void>('/auth/logout', { method: 'POST' })
}
