import { request } from '../../shared/api/httpClient'
import type { SystemErrorPage } from './types'
export function fetchSystemErrors(page: number, size: number): Promise<SystemErrorPage> { return request<SystemErrorPage>(`/admin/system-errors?page=${page}&size=${size}`) }
