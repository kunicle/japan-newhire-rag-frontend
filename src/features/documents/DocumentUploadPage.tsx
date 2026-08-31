import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, EmptyState, Input, Skeleton } from '../../shared/ui'
import {
  fetchDocumentCategories,
  publishDocumentVersion,
  updateDocumentAccessRule,
  uploadDocument,
} from './documentApi'
import { mapDocumentErrorMessage } from './documentErrors'
import type {
  DocumentAccessRuleResult,
  DocumentCategory,
  DocumentPublicationResult,
  DocumentUploadResult,
} from './types'
import styles from './DocumentUploadPage.module.css'

const CATEGORY_ERROR_MESSAGE = '문서 카테고리를 불러오지 못했습니다.'
const UPLOAD_ERROR_MESSAGE = '문서를 업로드하지 못했습니다. 잠시 후 다시 시도해 주세요.'
const PUBLISH_ERROR_MESSAGE = '문서를 발행하지 못했습니다. 잠시 후 다시 시도해 주세요.'
const ACCESS_RULE_ERROR_MESSAGE =
  '접근 범위를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.'
const MAX_FILE_SIZE = 5 * 1024 * 1024

export function DocumentUploadPage() {
  const [categories, setCategories] = useState<DocumentCategory[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [documentCategoryId, setDocumentCategoryId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadResult, setUploadResult] = useState<DocumentUploadResult | null>(null)
  const [accessScopeAllConfirmed, setAccessScopeAllConfirmed] = useState(false)
  const [savingAccessRule, setSavingAccessRule] = useState(false)
  const [accessRuleError, setAccessRuleError] = useState<string | null>(null)
  const [accessRuleResult, setAccessRuleResult] =
    useState<DocumentAccessRuleResult | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [publishResult, setPublishResult] =
    useState<DocumentPublicationResult | null>(null)
  const latestCategoryFetchIdRef = useRef(0)
  const mountedRef = useRef(false)
  const uploadingRef = useRef(false)
  const savingAccessRuleRef = useRef(false)
  const publishingRef = useRef(false)

  async function loadCategories() {
    const requestId = ++latestCategoryFetchIdRef.current
    setCategoriesLoading(true)
    setCategoriesError(null)

    try {
      const response = await fetchDocumentCategories()
      if (!mountedRef.current || requestId !== latestCategoryFetchIdRef.current) return
      setCategories(response)
    } catch {
      if (!mountedRef.current || requestId !== latestCategoryFetchIdRef.current) return
      setCategoriesError(CATEGORY_ERROR_MESSAGE)
    } finally {
      if (mountedRef.current && requestId === latestCategoryFetchIdRef.current) {
        setCategoriesLoading(false)
      }
    }
  }

  useEffect(() => {
    let cancelled = false
    mountedRef.current = true

    async function loadInitialCategories() {
      const requestId = ++latestCategoryFetchIdRef.current

      try {
        const response = await fetchDocumentCategories()
        if (cancelled || requestId !== latestCategoryFetchIdRef.current) return
        setCategories(response)
        setCategoriesError(null)
      } catch {
        if (cancelled || requestId !== latestCategoryFetchIdRef.current) return
        setCategoriesError(CATEGORY_ERROR_MESSAGE)
      } finally {
        if (!cancelled && requestId === latestCategoryFetchIdRef.current) {
          setCategoriesLoading(false)
        }
      }
    }

    void loadInitialCategories()

    return () => {
      cancelled = true
      mountedRef.current = false
      latestCategoryFetchIdRef.current += 1
    }
  }, [])

  function validateForm(): string | null {
    if (!title.trim()) return '제목을 입력해 주세요.'
    if (!documentCategoryId) return '문서 카테고리를 선택해 주세요.'
    if (!file) return '파일을 선택해 주세요.'
    if (!file.name.toLowerCase().endsWith('.txt')) {
      return 'TXT 파일만 업로드할 수 있습니다.'
    }
    if (file.size > MAX_FILE_SIZE) {
      return '파일 크기가 5MB를 초과했습니다.'
    }
    return null
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (uploadingRef.current) return

    const error = validateForm()
    if (error) {
      setValidationError(error)
      return
    }

    uploadingRef.current = true
    setUploading(true)
    setValidationError(null)
    setUploadError(null)

    try {
      const result = await uploadDocument({
        file: file as File,
        documentCategoryId: Number(documentCategoryId),
        title: title.trim(),
        description: description.trim() || undefined,
      })
      setUploadResult(result)
    } catch (error) {
      setUploadError(mapDocumentErrorMessage(error, UPLOAD_ERROR_MESSAGE))
    } finally {
      uploadingRef.current = false
      setUploading(false)
    }
  }

  async function handlePublish() {
    if (publishingRef.current || !uploadResult || !accessRuleResult) return

    publishingRef.current = true
    setPublishing(true)
    setPublishError(null)

    try {
      const result = await publishDocumentVersion(
        uploadResult.documentId,
        uploadResult.documentVersionId,
      )
      setPublishResult(result)
    } catch (error) {
      setPublishError(mapDocumentErrorMessage(error, PUBLISH_ERROR_MESSAGE))
    } finally {
      publishingRef.current = false
      setPublishing(false)
    }
  }

  async function handleSaveAccessRule() {
    if (
      savingAccessRuleRef.current ||
      !uploadResult ||
      !accessScopeAllConfirmed
    ) {
      return
    }

    savingAccessRuleRef.current = true
    setSavingAccessRule(true)
    setAccessRuleError(null)

    try {
      const result = await updateDocumentAccessRule(
        uploadResult.documentId,
        uploadResult.documentVersionId,
        {
          accessScope: 'ALL',
          conditionOperator: null,
          roles: [],
          departmentIds: [],
          minimumJobGradeId: null,
          newEmployeeOnly: false,
        },
      )
      setAccessRuleResult(result)
    } catch (error) {
      setAccessRuleError(
        mapDocumentErrorMessage(error, ACCESS_RULE_ERROR_MESSAGE),
      )
    } finally {
      savingAccessRuleRef.current = false
      setSavingAccessRule(false)
    }
  }

  let content

  if (categoriesLoading) {
    content = (
      <Card aria-label="문서 카테고리를 불러오는 중">
        <div className={styles.skeletons}>
          <Skeleton height="2.75rem" />
          <Skeleton height="2.75rem" />
          <Skeleton height="2.75rem" />
        </div>
      </Card>
    )
  } else if (categoriesError) {
    content = (
      <Card>
        <div className={styles.loadError}>
          <p className={styles.errorMessage} role="alert">{categoriesError}</p>
          <Button variant="secondary" onClick={() => void loadCategories()}>
            다시 시도
          </Button>
        </div>
      </Card>
    )
  } else if (categories.length === 0) {
    content = (
      <Card>
        <EmptyState
          title="등록된 문서 카테고리가 없습니다"
          description="사용 가능한 문서 카테고리가 준비되지 않았습니다."
        />
      </Card>
    )
  } else if (uploadResult && !accessRuleResult) {
    content = (
      <Card className={styles.resultCard}>
        <h2 className={styles.resultTitle}>업로드가 완료되었습니다.</h2>
        <p className={styles.resultStatus}>아직 비공개</p>
        <fieldset className={styles.accessFieldset}>
          <legend className={styles.accessLegend}>접근 범위</legend>
          <div className={styles.checkboxRow}>
            <input
              id="document-access-all"
              type="checkbox"
              checked={accessScopeAllConfirmed}
              onChange={(event) =>
                setAccessScopeAllConfirmed(event.target.checked)
              }
              disabled={savingAccessRule}
            />
            <label htmlFor="document-access-all">
              이 문서를 전체 직원에게 공개하는 데 동의합니다.
            </label>
          </div>
        </fieldset>
        {accessRuleError && (
          <p className={styles.errorMessage} role="alert">{accessRuleError}</p>
        )}
        {savingAccessRule && (
          <p className={styles.statusMessage} role="status">
            접근 범위를 저장하고 있습니다...
          </p>
        )}
        <div className={styles.resultActions}>
          <Button
            onClick={() => void handleSaveAccessRule()}
            loading={savingAccessRule}
            disabled={savingAccessRule || !accessScopeAllConfirmed}
          >
            접근 범위 저장
          </Button>
        </div>
      </Card>
    )
  } else if (uploadResult) {
    content = (
      <Card className={styles.resultCard}>
        <h2 className={styles.resultTitle}>
          {publishResult ? '발행 완료' : '업로드가 완료되었습니다.'}
        </h2>
        <p className={styles.resultStatus}>
          {publishResult ? '문서가 공개되었습니다.' : '아직 비공개'}
        </p>
        <p className={styles.resultDescription}>
          {publishResult
            ? 'RAG 질문에서 발행된 문서를 활용할 수 있습니다.'
            : '문서를 RAG 검색 대상으로 사용하려면 발행해 주세요.'}
        </p>
        {!publishResult && (
          <p className={styles.resultDescription}>접근 범위: 전체 직원</p>
        )}
        {publishError && (
          <p className={styles.errorMessage} role="alert">{publishError}</p>
        )}
        <div className={styles.resultActions}>
          {publishResult ? (
            <Link className={styles.ragLink} to="/rag">
              RAG에서 질문하기
            </Link>
          ) : (
            <Button
              onClick={() => void handlePublish()}
              loading={publishing}
              disabled={publishing}
            >
              발행하기
            </Button>
          )}
        </div>
        {publishing && <p className={styles.statusMessage} role="status">문서를 발행하고 있습니다...</p>}
      </Card>
    )
  } else {
    content = (
      <Card>
        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            label="제목"
            required
            maxLength={200}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={uploading}
          />
          <Input
            label="설명"
            maxLength={1000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={uploading}
          />
          <div className={styles.field}>
            <label className={styles.label} htmlFor="document-category">
              문서 카테고리 <span className={styles.required} aria-hidden="true">*</span>
              <span className="sr-only"> (필수)</span>
            </label>
            <select
              className={styles.select}
              id="document-category"
              required
              value={documentCategoryId}
              onChange={(event) => setDocumentCategoryId(event.target.value)}
              disabled={uploading}
            >
              <option value="">선택해 주세요</option>
              {categories.map((category) => (
                <option
                  key={category.documentCategoryId}
                  value={category.documentCategoryId}
                >
                  {category.categoryName}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="document-file">
              TXT 파일 <span className={styles.required} aria-hidden="true">*</span>
              <span className="sr-only"> (필수)</span>
            </label>
            <input
              className={styles.fileInput}
              id="document-file"
              type="file"
              accept=".txt,text/plain"
              required
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              disabled={uploading}
            />
            {file && <p className={styles.fileName}>{file.name}</p>}
          </div>
          {validationError && (
            <p className={styles.errorMessage} role="alert">{validationError}</p>
          )}
          {uploadError && (
            <p className={styles.errorMessage} role="alert">{uploadError}</p>
          )}
          {uploading && (
            <p className={styles.statusMessage} role="status">
              문서를 처리하고 있습니다...
            </p>
          )}
          <div className={styles.submitRow}>
            <Button type="submit" loading={uploading} disabled={uploading}>
              문서 업로드
            </Button>
          </div>
        </form>
      </Card>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>문서 업로드</h1>
        <p className={styles.description}>
          사내 지식 문서를 등록하고 검토 후 발행하세요.
        </p>
      </header>
      {content}
    </div>
  )
}
