import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, EmptyState, Skeleton } from '../../shared/ui'
import { fetchDocuments } from './documentManagementApi'
import {
  formatDocumentStatus,
  formatPublicationStatus,
} from './documentManagementHelpers'
import type { DocumentManagementListItem } from './documentManagementTypes'
import styles from './DocumentManagementPage.module.css'

const LIST_ERROR_MESSAGE = '문서 목록을 불러오지 못했습니다.'
const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium', timeStyle: 'short',
})

function formatDateTime(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '날짜 정보 없음' : dateFormatter.format(date)
}

export function DocumentManagementPage() {
  const [documents, setDocuments] = useState<DocumentManagementListItem[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const latestFetchIdRef = useRef(0)
  const mountedRef = useRef(false)

  const loadDocuments = useCallback(async () => {
    const requestId = ++latestFetchIdRef.current
    setListLoading(true)
    setListError(null)
    try {
      const response = await fetchDocuments()
      if (!mountedRef.current || requestId !== latestFetchIdRef.current) return
      setDocuments(response)
    } catch {
      if (!mountedRef.current || requestId !== latestFetchIdRef.current) return
      setListError(LIST_ERROR_MESSAGE)
    } finally {
      if (mountedRef.current && requestId === latestFetchIdRef.current) {
        setListLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    queueMicrotask(() => void loadDocuments())
    return () => {
      mountedRef.current = false
      latestFetchIdRef.current += 1
    }
  }, [loadDocuments])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>문서 관리</h1>
          <p className={styles.description}>등록된 문서와 최신 버전 상태를 확인하세요.</p>
        </div>
        <Link className={styles.primaryLink} to="/hr/documents/upload">문서 업로드</Link>
      </header>

      {listLoading ? (
        <div className={styles.skeletonList} role="status" aria-label="문서 목록을 불러오는 중">
          <Skeleton lines={3} /><Skeleton lines={3} /><Skeleton lines={3} />
        </div>
      ) : listError ? (
        <div className={styles.errorState}>
          <p className={styles.error} role="alert">{listError}</p>
          <Button variant="secondary" onClick={() => void loadDocuments()}>다시 시도</Button>
        </div>
      ) : documents.length === 0 ? (
        <div className={styles.emptyState}>
          <EmptyState title="문서가 없습니다." description="문서를 업로드하면 이곳에서 관리할 수 있습니다." />
          <Link className={styles.primaryLink} to="/hr/documents/upload">문서 업로드</Link>
        </div>
      ) : (
        <ul className={styles.documentList} aria-label="문서 목록">
          {documents.map((document) => (
            <li className={styles.documentItem} key={document.documentId}>
              <Link className={styles.documentLink} to={`/hr/documents/${document.documentId}`}>
                <div className={styles.itemHeader}>
                  <h2 className={styles.itemTitle}>{document.documentName}</h2>
                  <Badge variant="success">{formatDocumentStatus(document.documentStatus)}</Badge>
                </div>
                <p className={styles.metadata}>카테고리: {document.categoryName}</p>
                {document.latestVersionName === null ? (
                  <p className={styles.metadata}>버전 없음</p>
                ) : (
                  <div className={styles.versionInfo}>
                    <span>최신 버전: {document.latestVersionName}</span>
                    {document.latestVersionPublicationStatus && (
                      <Badge variant={document.latestVersionPublicationStatus === 'PUBLIC' ? 'info' : 'neutral'}>
                        {formatPublicationStatus(document.latestVersionPublicationStatus)}
                      </Badge>
                    )}
                    {document.latestVersionIsActive && <Badge variant="success">현재 공개 버전</Badge>}
                  </div>
                )}
                <time className={styles.timestamp} dateTime={document.createdAt}>
                  등록 {formatDateTime(document.createdAt)}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
