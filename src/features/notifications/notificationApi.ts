import { request } from '../../shared/api/httpClient'
import type { NotificationItem, NotificationPage } from './types'

export function fetchNotifications(params: {
  read?: boolean
  page: number
  size: number
}): Promise<NotificationPage> {
  const query = new URLSearchParams()

  if (params.read !== undefined) {
    query.set('read', String(params.read))
  }

  query.set('page', String(params.page))
  query.set('size', String(params.size))

  return request<NotificationPage>(`/notifications?${query.toString()}`)
}

export function markNotificationRead(
  notificationId: number,
): Promise<NotificationItem> {
  return request<NotificationItem>(`/notifications/${notificationId}/read`, {
    method: 'PATCH',
  })
}
