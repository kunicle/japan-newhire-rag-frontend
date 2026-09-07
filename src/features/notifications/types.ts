export interface NotificationItem {
  notificationId: number
  notificationType: string
  title: string
  message: string
  targetType: string | null
  targetId: number | null
  isRead: boolean
  readAt: string | null
  createdAt: string
}

export interface NotificationPage {
  content: NotificationItem[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}
