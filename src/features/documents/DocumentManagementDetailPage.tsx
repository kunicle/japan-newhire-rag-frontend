import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Badge, Button, EmptyState, Skeleton } from '../../shared/ui'
import { fetchJobGrades, fetchOrganization } from '../organization/organizationApi'
import { flattenDepartments } from '../organization/organizationHelpers'
import type { AccessRuleReferences } from './accessRuleFormHelpers'
import { DocumentAccessRuleForm } from './DocumentAccessRuleForm'
import {
  fetchDocument,
  fetchDocumentVersionAuditEvents,
  retractDocumentVersion,
} from './documentManagementApi'
import { mapDocumentErrorMessage } from './documentErrors'
import {
  buildAccessRuleReadSummaryLines,
  formatDocumentVersionAuditState,
  formatDocumentStatus,
  formatPublicationStatus,
  toAccessRuleFormSnapshot,
} from './documentManagementHelpers'
import type {
  DocumentAccessRuleRead,
  DocumentManagementDetail,
  DocumentVersionAuditEventPage,
} from './documentManagementTypes'
import styles from './DocumentManagementDetailPage.module.css'

const DETAIL_ERROR_MESSAGE = '문서 정보를 불러오지 못했습니다.'
const REFERENCE_ERROR_MESSAGE = '접근 조건 상세를 불러오지 못했습니다.'
const RETRACT_ERROR_MESSAGE = '문서 버전을 철회하지 못했습니다.'
const AUDIT_ERROR_MESSAGE = '철회 이력을 불러오지 못했습니다.'
const RETRACT_CONFIRM_MESSAGE = '이 문서 버전을 철회하시겠습니까?\n철회 후에는 일반 RAG 검색에서 제외되며,\n이번 버전은 다시 발행할 수 없습니다.'
const AUDIT_PAGE_SIZE = 20
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
  const [retractingVersionIds, setRetractingVersionIds] = useState<Set<number>>(new Set())
  const [actionErrorByVersionId, setActionErrorByVersionId] = useState<Map<number, string>>(new Map())
  const [auditPageByVersionId, setAuditPageByVersionId] = useState<Map<number, DocumentVersionAuditEventPage>>(new Map())
  const [auditLoadingVersionIds, setAuditLoadingVersionIds] = useState<Set<number>>(new Set())
  const [auditErrorByVersionId, setAuditErrorByVersionId] = useState<Map<number, string>>(new Map())
  const latestFetchIdRef = useRef(0)
  const referenceFetchIdRef = useRef(0)
  const auditFetchIdByVersionRef = useRef<Map<number, number>>(new Map())
  const retractingVersionIdsRef = useRef<Set<number>>(new Set())
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

  const loadAuditEvents = useCallback(async (documentVersionId: number, page = 0) => {
    const requestId = (auditFetchIdByVersionRef.current.get(documentVersionId) ?? 0) + 1
    auditFetchIdByVersionRef.current.set(documentVersionId, requestId)
    setAuditLoadingVersionIds((current) => new Set(current).add(documentVersionId))
    setAuditErrorByVersionId((current) => {
      const next = new Map(current)
      next.delete(documentVersionId)
      return next
    })
    try {
      const response = await fetchDocumentVersionAuditEvents(
        documentId,
        documentVersionId,
        page,
        AUDIT_PAGE_SIZE,
      )
      if (!mountedRef.current || auditFetchIdByVersionRef.current.get(documentVersionId) !== requestId) return
      setAuditPageByVersionId((current) => new Map(current).set(documentVersionId, response))
    } catch (error) {
      if (!mountedRef.current || auditFetchIdByVersionRef.current.get(documentVersionId) !== requestId) return
      setAuditErrorByVersionId((current) => new Map(current).set(
        documentVersionId,
        mapDocumentErrorMessage(error, AUDIT_ERROR_MESSAGE),
      ))
    } finally {
      if (mountedRef.current && auditFetchIdByVersionRef.current.get(documentVersionId) === requestId) {
        setAuditLoadingVersionIds((current) => {
          const next = new Set(current)
          next.delete(documentVersionId)
          return next
        })
      }
    }
  }, [documentId])

  useEffect(() => {
    const auditFetchIds = auditFetchIdByVersionRef.current
    const retractingIds = retractingVersionIdsRef.current
    mountedRef.current = true
    if (validDocumentId) queueMicrotask(() => void loadDetail())
    return () => {
      mountedRef.current = false
      latestFetchIdRef.current += 1
      referenceFetchIdRef.current += 1
      auditFetchIds.clear()
      retractingIds.clear()
    }
  }, [loadDetail, validDocumentId])

  useEffect(() => {
    queueMicrotask(() => setEditingVersionId(null))
  }, [documentId])

  async function handleAccessRuleSaved() {
    setEditingVersionId(null)
    await loadDetail()
  }

  async function handleRetract(documentVersionId: number) {
    if (retractingVersionIdsRef.current.has(documentVersionId)) return
    if (!window.confirm(RETRACT_CONFIRM_MESSAGE)) return
    retractingVersionIdsRef.current.add(documentVersionId)
    setRetractingVersionIds(new Set(retractingVersionIdsRef.current))
    setActionErrorByVersionId((current) => {
      const next = new Map(current)
      next.delete(documentVersionId)
      return next
    })
    let succeeded = false
    try {
      await retractDocumentVersion(documentId, documentVersionId)
      succeeded = true
    } catch (error) {
      if (mountedRef.current) {
        setActionErrorByVersionId((current) => new Map(current).set(
          documentVersionId,
          mapDocumentErrorMessage(error, RETRACT_ERROR_MESSAGE),
        ))
      }
    }
    if (succeeded && mountedRef.current) {
      await Promise.all([loadDetail(), loadAuditEvents(documentVersionId)])
    }
    retractingVersionIdsRef.current.delete(documentVersionId)
    if (mountedRef.current) setRetractingVersionIds(new Set(retractingVersionIdsRef.current))
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
                      <div className={styles.versionIdentity}>
                        <h3 className={styles.versionTitle}>{version.versionName}</h3>
                        <Badge variant={version.publicationStatus === 'PUBLIC' ? 'info' : version.publicationStatus === 'RETRACTED' ? 'danger' : 'neutral'}>
                          {formatPublicationStatus(version.publicationStatus)}
                        </Badge>
                        {version.publicationStatus === 'PUBLIC' && version.isActive && <Badge variant="success">현재 공개 버전</Badge>}
                      </div>
                      {version.publicationStatus === 'PUBLIC' && version.isActive && (
                        <Button
                          variant="danger"
                          size="sm"
                          loading={retractingVersionIds.has(version.documentVersionId)}
                          disabled={retractingVersionIds.has(version.documentVersionId)}
                          onClick={() => void handleRetract(version.documentVersionId)}
                        >
                          철회
                        </Button>
                      )}
                    </div>
                    {actionErrorByVersionId.has(version.documentVersionId) && (
                      <p className={styles.error} role="alert">
                        {actionErrorByVersionId.get(version.documentVersionId)}
                      </p>
                    )}
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
                    <section className={styles.auditSection} aria-label={`${version.versionName} 철회 이력`}>
                      <div className={styles.auditHeader}>
                        <h4 className={styles.accessTitle}>철회 이력</h4>
                        {!auditPageByVersionId.has(version.documentVersionId) && !auditErrorByVersionId.has(version.documentVersionId) && (
                          <Button
                            variant="secondary"
                            size="sm"
                            loading={auditLoadingVersionIds.has(version.documentVersionId)}
                            onClick={() => void loadAuditEvents(version.documentVersionId)}
                          >
                            철회 이력 보기
                          </Button>
                        )}
                      </div>
                      {auditLoadingVersionIds.has(version.documentVersionId) && !auditPageByVersionId.has(version.documentVersionId) ? (
                        <p className={styles.status} role="status">철회 이력을 불러오는 중...</p>
                      ) : auditErrorByVersionId.has(version.documentVersionId) ? (
                        <div className={styles.auditError}>
                          <p className={styles.error} role="alert">{auditErrorByVersionId.get(version.documentVersionId)}</p>
                          <Button variant="secondary" size="sm" onClick={() => void loadAuditEvents(version.documentVersionId)}>다시 시도</Button>
                        </div>
                      ) : auditPageByVersionId.has(version.documentVersionId) ? (() => {
                        const auditPage = auditPageByVersionId.get(version.documentVersionId)!
                        return auditPage.content.length === 0 ? (
                          <p className={styles.unconfigured}>철회 이력이 없습니다.</p>
                        ) : (
                          <>
                            <ul className={styles.auditList}>
                              {auditPage.content.map((event) => (
                                <li key={`${event.createdAt}-${event.actorUserId}`}>
                                  <time dateTime={event.createdAt}>{formatDateTime(event.createdAt)}</time>
                                  <span>실행자 app-user ID: {event.actorUserId}</span>
                                  <span>{formatDocumentVersionAuditState(event.previousValue)} → {formatDocumentVersionAuditState(event.changedValue)}</span>
                                </li>
                              ))}
                            </ul>
                            {auditPage.totalPages > 1 && (
                              <nav className={styles.pagination} aria-label={`${version.versionName} 철회 이력 페이지`}>
                                <Button variant="secondary" size="sm" disabled={auditPage.page === 0 || auditLoadingVersionIds.has(version.documentVersionId)} onClick={() => void loadAuditEvents(version.documentVersionId, auditPage.page - 1)}>이전</Button>
                                <span>페이지 {auditPage.page + 1} / {auditPage.totalPages}</span>
                                <Button variant="secondary" size="sm" disabled={auditPage.page + 1 >= auditPage.totalPages || auditLoadingVersionIds.has(version.documentVersionId)} onClick={() => void loadAuditEvents(version.documentVersionId, auditPage.page + 1)}>다음</Button>
                              </nav>
                            )}
                          </>
                        )
                      })() : null}
                    </section>
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
