import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Badge, Button, EmptyState, Skeleton } from '../../shared/ui'
import { fetchJobGrades, fetchOrganization } from '../organization/organizationApi'
import { flattenDepartments } from '../organization/organizationHelpers'
import type { AccessRuleReferences } from './accessRuleFormHelpers'
import { DocumentAccessRuleForm } from './DocumentAccessRuleForm'
import { fetchDocument } from './documentManagementApi'
import {
  buildAccessRuleReadSummaryLines,
  formatDocumentStatus,
  formatPublicationStatus,
  toAccessRuleFormSnapshot,
} from './documentManagementHelpers'
import type {
  DocumentAccessRuleRead,
  DocumentManagementDetail,
} from './documentManagementTypes'
import styles from './DocumentManagementDetailPage.module.css'

const DETAIL_ERROR_MESSAGE = '문서 정보를 불러오지 못했습니다.'
const REFERENCE_ERROR_MESSAGE = '접근 조건 상세를 불러오지 못했습니다.'
const dateTimeFormatter = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' })
const dateFormatter = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeZone: 'UTC' })

function formatDateTime(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '날짜 정보 없음' : dateTimeFormatter.format(date)
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? '날짜 정보 없음' : dateFormatter.format(date)
}

export function DocumentManagementDetailPage() {
  const { documentId: documentIdParam } = useParams()
  const documentId = Number(documentIdParam)
  const validDocumentId = Number.isInteger(documentId) && documentId > 0
  const [detail, setDetail] = useState<DocumentManagementDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(validDocumentId)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [references, setReferences] = useState<AccessRuleReferences | null>(null)
  const [referencesLoading, setReferencesLoading] = useState(false)
  const [referencesError, setReferencesError] = useState<string | null>(null)
  const [editingVersionId, setEditingVersionId] = useState<number | null>(null)
  const latestFetchIdRef = useRef(0)
  const referenceFetchIdRef = useRef(0)
  const mountedRef = useRef(false)

  const loadReferences = useCallback(async () => {
    const requestId = ++referenceFetchIdRef.current
    setReferencesLoading(true)
    setReferencesError(null)
    setReferences(null)
    try {
      const [organization, jobGrades] = await Promise.all([
        fetchOrganization(), fetchJobGrades(),
      ])
      if (!mountedRef.current || requestId !== referenceFetchIdRef.current) return
      setReferences({ departments: flattenDepartments(organization.departments), jobGrades })
    } catch {
      if (!mountedRef.current || requestId !== referenceFetchIdRef.current) return
      setReferencesError(REFERENCE_ERROR_MESSAGE)
    } finally {
      if (mountedRef.current && requestId === referenceFetchIdRef.current) {
        setReferencesLoading(false)
      }
    }
  }, [])

  const loadDetail = useCallback(async () => {
    if (!validDocumentId) return
    const requestId = ++latestFetchIdRef.current
    referenceFetchIdRef.current += 1
    setDetailLoading(true)
    setDetailError(null)
    setReferences(null)
    setReferencesError(null)
    setReferencesLoading(false)
    try {
      const response = await fetchDocument(documentId)
      if (!mountedRef.current || requestId !== latestFetchIdRef.current) return
      setDetail(response)
      const hasRestrictedRule = response.versions.some(
        (version) => version.accessRule?.accessScope === 'RESTRICTED',
      )
      if (hasRestrictedRule) void loadReferences()
    } catch {
      if (!mountedRef.current || requestId !== latestFetchIdRef.current) return
      setDetail(null)
      setDetailError(DETAIL_ERROR_MESSAGE)
    } finally {
      if (mountedRef.current && requestId === latestFetchIdRef.current) {
        setDetailLoading(false)
      }
    }
  }, [documentId, loadReferences, validDocumentId])

  useEffect(() => {
    mountedRef.current = true
    if (validDocumentId) queueMicrotask(() => void loadDetail())
    return () => {
      mountedRef.current = false
      latestFetchIdRef.current += 1
      referenceFetchIdRef.current += 1
    }
  }, [loadDetail, validDocumentId])

  useEffect(() => {
    queueMicrotask(() => setEditingVersionId(null))
  }, [documentId])

  async function handleAccessRuleSaved() {
    setEditingVersionId(null)
    await loadDetail()
  }

  function renderAccessRule(rule: DocumentAccessRuleRead | null) {
    if (!rule) return <p className={styles.unconfigured}>접근 범위 미설정</p>
    if (rule.accessScope === 'RESTRICTED' && referencesLoading) {
      return <p className={styles.status} role="status">접근 조건 상세를 불러오는 중...</p>
    }
    return (
      <div className={styles.accessRule}>
        {rule.accessScope === 'RESTRICTED' && referencesError && (
          <p className={styles.error} role="alert">{referencesError}</p>
        )}
        <ul className={styles.summaryList}>
          {buildAccessRuleReadSummaryLines(rule, references).map((line) => <li key={line}>{line}</li>)}
        </ul>
      </div>
    )
  }

  if (!validDocumentId) {
    return (
      <div className={styles.page}>
        <p className={styles.error} role="alert">잘못된 문서 정보입니다.</p>
        <Link className={styles.backLink} to="/hr/documents"><ArrowLeft size={16} aria-hidden="true" />문서 관리로 돌아가기</Link>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <Link className={styles.backLink} to="/hr/documents"><ArrowLeft size={16} aria-hidden="true" />문서 관리로 돌아가기</Link>
      {detailLoading ? (
        <div className={styles.skeletons} role="status" aria-label="문서 정보를 불러오는 중">
          <Skeleton lines={3} /><Skeleton lines={5} /><Skeleton lines={5} />
        </div>
      ) : detailError ? (
        <div className={styles.errorState}>
          <p className={styles.error} role="alert">{detailError}</p>
          <Button variant="secondary" onClick={() => void loadDetail()}>다시 시도</Button>
        </div>
      ) : detail ? (
        <>
          <header className={styles.header}>
            <div className={styles.headingRow}>
              <h1 className={styles.title}>{detail.documentName}</h1>
              <Badge variant="success">{formatDocumentStatus(detail.documentStatus)}</Badge>
            </div>
            <div className={styles.metadataRow}>
              <span className={styles.metadata}>카테고리 · {detail.categoryName}</span>
              <time className={styles.metadata} dateTime={detail.createdAt}>등록 · {formatDateTime(detail.createdAt)}</time>
            </div>
            <p className={styles.description}>{detail.documentDescription ?? '설명 없음'}</p>
          </header>
          {detail.versions.length === 0 ? (
            <EmptyState title="버전이 없습니다." description="등록된 문서 버전이 없습니다." />
          ) : (
            <section aria-labelledby="versions-title">
              <h2 className={styles.sectionTitle} id="versions-title">버전</h2>
              <ul className={styles.versionList}>
                {detail.versions.map((version) => (
                  <li className={styles.versionItem} key={version.documentVersionId}>
                    <div className={styles.versionHeader}>
                      <h3 className={styles.versionTitle}>{version.versionName}</h3>
                      <Badge variant={version.publicationStatus === 'PUBLIC' ? 'info' : 'neutral'}>
                        {formatPublicationStatus(version.publicationStatus)}
                      </Badge>
                      {version.isActive && <Badge variant="success">현재 공개 버전</Badge>}
                    </div>
                    <dl className={styles.details}>
                      <div><dt>원본 파일</dt><dd className={styles.fileName}>{version.originalFileName}</dd></div>
                      <div><dt>적용일</dt><dd>{formatDate(version.effectiveDate)}</dd></div>
                      <div><dt>만료일</dt><dd>{version.expirationDate ? formatDate(version.expirationDate) : '없음'}</dd></div>
                      {version.publishedAt && <div><dt>발행일시</dt><dd>{formatDateTime(version.publishedAt)}</dd></div>}
                      <div><dt>등록일시</dt><dd>{formatDateTime(version.createdAt)}</dd></div>
                    </dl>
                    <div className={styles.accessSection}>
                      <div className={styles.accessHeader}>
                        <h4 className={styles.accessTitle}>접근 범위</h4>
                        {editingVersionId !== version.documentVersionId && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={editingVersionId !== null}
                            aria-label={`${version.versionName} ${
                              version.accessRule ? '접근 범위 변경' : '접근 범위 설정'
                            }`}
                            onClick={() => setEditingVersionId(version.documentVersionId)}
                          >
                            {version.accessRule ? '접근 범위 변경' : '접근 범위 설정'}
                          </Button>
                        )}
                      </div>
                      {editingVersionId === version.documentVersionId ? (
                        <DocumentAccessRuleForm
                          documentId={detail.documentId}
                          documentVersionId={version.documentVersionId}
                          initialConfiguration={version.accessRule
                            ? toAccessRuleFormSnapshot(version.accessRule)
                            : undefined}
                          initialReferences={references}
                          onSaved={() => {
                            void handleAccessRuleSaved()
                          }}
                          onCancel={() => setEditingVersionId(null)}
                        />
                      ) : renderAccessRule(version.accessRule)}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      ) : null}
    </div>
  )
}
