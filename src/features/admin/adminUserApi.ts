import { request } from '../../shared/api/httpClient'
import type { RoleType } from '../auth/types'
import type { AccountStatusResult, CreateUserInput, CreateUserResult, UserRolesResult } from './adminUserTypes'

export function createUser(input: CreateUserInput): Promise<CreateUserResult> { return request<CreateUserResult>('/admin/users', { method: 'POST', body: JSON.stringify(input) }) }
export function activateUser(appUserId: number): Promise<AccountStatusResult> { return request<AccountStatusResult>(`/admin/users/${appUserId}/activate`, { method: 'PATCH' }) }
export function deactivateUser(appUserId: number): Promise<AccountStatusResult> { return request<AccountStatusResult>(`/admin/users/${appUserId}/deactivate`, { method: 'PATCH' }) }
export function updateUserRoles(appUserId: number, roles: RoleType[]): Promise<UserRolesResult> { return request<UserRolesResult>(`/admin/users/${appUserId}/roles`, { method: 'PATCH', body: JSON.stringify({ roles }) }) }
