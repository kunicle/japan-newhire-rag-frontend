import { useCallback, useEffect, useRef, useState } from 'react'
import { Badge, Button, EmptyState, Skeleton } from '../../shared/ui'
import { fetchNotifications, markNotificationRead } from './notificationApi'
import type { NotificationItem } from './types'
import styles from './NotificationsPage.module.css'

const PAGE_SIZE = 20
const INITIAL_ERROR_MESSAGE = '알림을 불러오지 못했습니다.'
const LOAD_MORE_ERROR_MESSAGE = '추가 알림을 불러오지 못했습니다.'
const READ_ERROR_MESSAGE = '읽음 처리에 실패했습니다.'

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function formatCreatedAt(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '날짜 정보 없음'
    : dateFormatter.format(date)
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [initialError, setInitialError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null)
  const [pendingReadIds, setPendingReadIds] = useState<Set<number>>(new Set())
  const [readErrorMessage, setReadErrorMessage] = useState<string | null>(null)
  const latestListFetchId = useRef(0)
  const readOverridesRef = useRef<Map<number, NotificationItem>>(new Map())
  const pendingReadIdsRef = useRef<Set<number>>(new Set())
  const loadingMoreRef = useRef(false)

  const applyReadOverrides = useCallback((items: NotificationItem[]) => {
    return items.map(
      (item) => readOverridesRef.current.get(item.notificationId) ?? item,
    )
  }, [])

  const loadInitialNotifications = useCallback(
    async (isCancelled: () => boolean = () => false) => {
      const requestId = ++latestListFetchId.current
      setInitialLoading(true)
      setInitialError(null)

      try {
        const response = await fetchNotifications({ page: 0, size: PAGE_SIZE })
        if (isCancelled() || requestId !== latestListFetchId.current) return

        setNotifications(applyReadOverrides(response.content))
        setPage(response.page)
        setTotalPages(response.totalPages)
        setInitialError(null)
      } catch {
        if (isCancelled() || requestId !== latestListFetchId.current) return
        setInitialError(INITIAL_ERROR_MESSAGE)
      } finally {
        if (!isCancelled() && requestId === latestListFetchId.current) {
          setInitialLoading(false)
        }
      }
    },
    [applyReadOverrides],
  )

  useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      void loadInitialNotifications(() => cancelled)
    })

    return () => {
      cancelled = true
    }
  }, [loadInitialNotifications])

  const hasMore = page + 1 < totalPages

  async function handleLoadMore() {
    if (loadingMoreRef.current || !hasMore) return

    loadingMoreRef.current = true
    const requestId = ++latestListFetchId.current
    setLoadingMore(true)
    setLoadMoreError(null)

    try {
      const response = await fetchNotifications({
        page: page + 1,
        size: PAGE_SIZE,
      })
      if (requestId !== latestListFetchId.current) return

      const incoming = applyReadOverrides(response.content)
      setNotifications((current) => {
        const existingIds = new Set(
          current.map((item) => item.notificationId),
        )
        return [
          ...current,
          ...incoming.filter((item) => !existingIds.has(item.notificationId)),
        ]
      })
      setPage(response.page)
      setTotalPages(response.totalPages)
    } catch {
      if (requestId !== latestListFetchId.current) return
      setLoadMoreError(LOAD_MORE_ERROR_MESSAGE)
    } finally {
      if (requestId === latestListFetchId.current) {
        loadingMoreRef.current = false
        setLoadingMore(false)
      }
    }
  }

  async function handleMarkRead(item: NotificationItem) {
    const id = item.notificationId
    if (item.isRead || pendingReadIdsRef.current.has(id)) return

    pendingReadIdsRef.current.add(id)
    setPendingReadIds((current) => new Set(current).add(id))
    setReadErrorMessage(null)

    try {
      const updated = await markNotificationRead(id)
      readOverridesRef.current.set(updated.notificationId, updated)
      setNotifications((current) =>
        current.map((notification) =>
          notification.notificationId === updated.notificationId
            ? updated
            : notification,
        ),
      )
    } catch {
      setReadErrorMessage(READ_ERROR_MESSAGE)
    } finally {
      pendingReadIdsRef.current.delete(id)
      setPendingReadIds((current) => {
        const next = new Set(current)
        next.delete(id)
        return next
      })
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>알림</h1>
        <p className={styles.description}>새로운 소식과 업무 안내를 확인하세요.</p>
      </header>

      <div className={styles.content}>
        {initialLoading ? (
          <div className={styles.skeletonList}>
            <Skeleton lines={3} />
            <Skeleton lines={3} />
            <Skeleton lines={3} />
            <Skeleton lines={3} />
          </div>
        ) : initialError ? (
          <div className={styles.initialError}>
            <p className={styles.errorMessage} role="alert">
              {initialError}
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                void loadInitialNotifications()
              }}
            >
              다시 시도
            </Button>
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            title="알림이 없습니다"
            description="새로운 알림이 도착하면 이곳에 표시됩니다."
          />
        ) : (
          <>
            {readErrorMessage && (
              <p className={styles.errorMessage} role="alert">
                {readErrorMessage}
              </p>
            )}
            <ul className={styles.notificationList} aria-label="알림 목록">
              {notifications.map((item) => (
                <li
                  className={styles.notificationItem}
                  data-unread={!item.isRead || undefined}
                  key={item.notificationId}
                >
                  <div className={styles.itemHeader}>
                    <h2 className={styles.itemTitle}>{item.title}</h2>
                    {!item.isRead && <Badge variant="info">읽지 않음</Badge>}
                  </div>
                  <p className={styles.message}>{item.message}</p>
                  <div className={styles.itemFooter}>
                    <time dateTime={item.createdAt}>
                      {formatCreatedAt(item.createdAt)}
                    </time>
                    {!item.isRead && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        loading={pendingReadIds.has(item.notificationId)}
                        onClick={() => {
                          void handleMarkRead(item)
                        }}
                      >
                        읽음으로 표시
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {(hasMore || loadMoreError) && (
              <div className={styles.loadMoreArea}>
                {loadMoreError && (
                  <p className={styles.errorMessage} role="alert">
                    {loadMoreError}
                  </p>
                )}
                {hasMore && (
                  <Button
                    type="button"
                    variant="secondary"
                    loading={loadingMore}
                    onClick={() => {
                      void handleLoadMore()
                    }}
                  >
                    더 보기
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
