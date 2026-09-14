import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, EmptyState, Input, Skeleton } from '../../shared/ui'
import { deleteDocument, fetchDocuments } from './documentManagementApi'
import { mapDocumentErrorMessage } from './documentErrors'
import {
  formatDocumentStatus,
  formatPublicationStatus,
} from './documentManagementHelpers'
import type { DocumentManagementListItem } from './documentManagementTypes'
import styles from './DocumentManagementPage.module.css'

const LIST_ERROR_MESSAGE = '문서 목록을 불러오지 못했습니다.'
const DELETE_ERROR_MESSAGE = '문서를 삭제하지 못했습니다.'
const NO_SEARCH_RESULTS_MESSAGE = '검색 결과가 없습니다.'
const SEARCH_PLACEHOLDER = '문서 검색'
const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 400

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium', timeStyle: 'short',
})

function formatDateTime(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '날짜 정보 없음' : dateFormatter.format(date)
}

function DocumentPagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <nav className={styles.pagination} aria-label="문서 목록 페이지">
      <Button
        variant="ghost"
        size="sm"
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
      >
        이전
      </Button>
      {Array.from({ length: totalPages }, (_, index) => index).map((pageNumber) => (
        <button
          key={pageNumber}
          type="button"
          className={styles.pageButton}
          aria-current={pageNumber === page ? 'page' : undefined}
          onClick={() => onPageChange(pageNumber)}
        >
          {pageNumber + 1}
        </button>
      ))}
      <Button
        variant="ghost"
        size="sm"
        disabled={page + 1 >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        다음
      </Button>
    </nav>
  )
}

function DeleteConfirmDialog({
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  busy: boolean
  error: string | null
  onCancel: () => void
  onConfirm: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current!
    const previous = document.activeElement as HTMLElement | null
    dialog.showModal()
    return () => {
      dialog.close()
      previous?.focus()
    }
  }, [])

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="document-delete-title"
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onCancel()
      }}
    >
      <h2 id="document-delete-title">문서 삭제</h2>
      <p>문서를 삭제하시겠습니까? 삭제된 문서는 RAG 검색에서 더 이상 사용할 수 없습니다.</p>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.dialogActions}>
        <Button variant="secondary" autoFocus disabled={busy} onClick={onCancel}>
          취소
        </Button>
        <Button variant="danger" loading={busy} disabled={busy} onClick={onConfirm}>
          삭제
        </Button>
      </div>
    </dialog>
  )
}

export function DocumentManagementPage() {
  const [documents, setDocuments] = useState<DocumentManagementListItem[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const latestFetchIdRef = useRef(0)
  const mountedRef = useRef(false)
  const previousKeywordRef = useRef(debouncedKeyword)
  const deleteBusyRef = useRef(false)

  async function loadDocuments(requestedKeyword: string, requestedPage: number) {
    const requestId = ++latestFetchIdRef.current
    setListLoading(true)
    setListError(null)
    try {
      const response = await fetchDocuments({
        keyword: requestedKeyword,
        page: requestedPage,
        size: PAGE_SIZE,
      })
      if (!mountedRef.current || requestId !== latestFetchIdRef.current) return
      setDocuments(response.content)
      setPage(response.page)
      setTotalPages(response.totalPages)
    } catch {
      if (!mountedRef.current || requestId !== latestFetchIdRef.current) return
      setListError(LIST_ERROR_MESSAGE)
    } finally {
      if (mountedRef.current && requestId === latestFetchIdRef.current) {
        setListLoading(false)
      }
    }
  }

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      latestFetchIdRef.current += 1
    }
  }, [])

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedKeyword(keyword), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [keyword])

  useEffect(() => {
    const keywordChanged = previousKeywordRef.current !== debouncedKeyword
    previousKeywordRef.current = debouncedKeyword
    if (keywordChanged && page !== 0) {
      setPage(0)
      return
    }
    void loadDocuments(debouncedKeyword, keywordChanged ? 0 : page)
  }, [debouncedKeyword, page])

  function handleDeleteRequest(documentId: number) {
    setDeleteError(null)
    setDeleteTargetId(documentId)
  }

  function handleDeleteCancel() {
    if (deleteBusy) return
    setDeleteTargetId(null)
    setDeleteError(null)
  }

  async function handleDeleteConfirm() {
    if (deleteBusyRef.current || deleteTargetId === null) return
    deleteBusyRef.current = true
    setDeleteBusy(true)
    setDeleteError(null)
    try {
      await deleteDocument(deleteTargetId)
      if (!mountedRef.current) return
      setDeleteTargetId(null)
      const isLastItemOnPage = documents.length === 1 && page > 0
      const nextPage = isLastItemOnPage ? page - 1 : page
      if (nextPage !== page) {
        setPage(nextPage)
      } else {
        await loadDocuments(debouncedKeyword, page)
      }
    } catch (error) {
      if (!mountedRef.current) return
      setDeleteError(mapDocumentErrorMessage(error, DELETE_ERROR_MESSAGE))
    } finally {
      deleteBusyRef.current = false
      if (mountedRef.current) setDeleteBusy(false)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>문서 관리</h1>
          <p className={styles.description}>등록된 문서와 최신 버전 상태를 확인하세요.</p>
        </div>
        <Link className={styles.primaryLink} to="/hr/documents/upload">문서 업로드</Link>
      </header>

      <Input
        label={SEARCH_PLACEHOLDER}
        hideLabel
        placeholder={SEARCH_PLACEHOLDER}
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        className={styles.searchField}
      />

      {listLoading ? (
        <div className={styles.skeletonList} role="status" aria-label="문서 목록을 불러오는 중">
          <Skeleton lines={3} /><Skeleton lines={3} /><Skeleton lines={3} />
        </div>
      ) : listError ? (
        <div className={styles.errorState}>
          <p className={styles.error} role="alert">{listError}</p>
          <Button variant="secondary" onClick={() => void loadDocuments(debouncedKeyword, page)}>
            다시 시도
          </Button>
        </div>
      ) : documents.length === 0 ? (
        <div className={styles.emptyState}>
          {debouncedKeyword ? (
            <p className={styles.metadata}>{NO_SEARCH_RESULTS_MESSAGE}</p>
          ) : (
            <>
              <EmptyState title="문서가 없습니다." description="문서를 업로드하면 이곳에서 관리할 수 있습니다." />
              <Link className={styles.primaryLink} to="/hr/documents/upload">문서 업로드</Link>
            </>
          )}
        </div>
      ) : (
        <>
          <ul className={styles.documentList} aria-label="문서 목록">
            {documents.map((document) => (
              <li className={styles.documentItem} key={document.documentId}>
                <div className={styles.itemRow}>
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
                  <div className={styles.itemActions}>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteRequest(document.documentId)}
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <DocumentPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {deleteTargetId !== null && (
        <DeleteConfirmDialog
          busy={deleteBusy}
          error={deleteError}
          onCancel={handleDeleteCancel}
          onConfirm={() => void handleDeleteConfirm()}
        />
      )}
    </div>
  )
}
