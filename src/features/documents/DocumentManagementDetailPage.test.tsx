import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DocumentManagementDetailPage } from './DocumentManagementDetailPage'
import type {
  DocumentManagementDetail,
  DocumentManagementVersion,
  DocumentRetractionResult,
  DocumentVersionAuditEventPage,
} from './documentManagementTypes'

const documentApiMock = vi.hoisted(() => ({
  fetchDocument: vi.fn(),
  fetchDocumentVersionAuditEvents: vi.fn(),
  retractDocumentVersion: vi.fn(),
}))
const organizationApiMock = vi.hoisted(() => ({
  fetchJobGrades: vi.fn(),
  fetchOrganization: vi.fn(),
}))

vi.mock('./documentManagementApi', () => documentApiMock)
vi.mock('../organization/organizationApi', () => organizationApiMock)

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true

const activePublicVersion: DocumentManagementVersion = {
  documentVersionId: 20,
  versionName: 'v2',
  publicationStatus: 'PUBLIC',
  isActive: true,
  originalFileName: 'policy-v2.txt',
  effectiveDate: '2026-09-01',
  expirationDate: null,
  publishedAt: '2026-09-02T10:00:00+09:00',
  createdAt: '2026-09-01T10:00:00+09:00',
  accessRule: {
    accessScope: 'ALL',
    conditionOperator: 'AND',
    roles: [],
    departmentIds: [],
    minimumJobGradeId: null,
    newEmployeeOnly: false,
  },
}

const detail: DocumentManagementDetail = {
  documentId: 10,
  documentName: '취업 규칙',
  documentDescription: '임직원 취업 규칙입니다.',
  documentCategoryId: 1,
  categoryCode: 'EMPLOYEE_POLICY',
  categoryName: '사내 규정',
  documentStatus: 'ACTIVE',
  createdAt: '2026-09-01T09:00:00+09:00',
  versions: [
    activePublicVersion,
    { ...activePublicVersion, documentVersionId: 19, versionName: 'v1-draft', publicationStatus: 'DRAFT', isActive: false },
    { ...activePublicVersion, documentVersionId: 18, versionName: 'v1-inactive', isActive: false },
    { ...activePublicVersion, documentVersionId: 17, versionName: 'v0', publicationStatus: 'RETRACTED', isActive: false },
  ],
}

const retractedDetail: DocumentManagementDetail = {
  ...detail,
  versions: detail.versions.map((version) => version.documentVersionId === 20
    ? { ...version, publicationStatus: 'RETRACTED', isActive: false }
    : version),
}

const auditPage: DocumentVersionAuditEventPage = {
  content: [{
    actionType: 'DOCUMENT_VERSION_RETRACTED',
    actorUserId: 77,
    previousValue: '{"publicationStatus":"PUBLIC","isActive":true}',
    changedValue: '{"publicationStatus":"RETRACTED","isActive":false}',
    createdAt: '2026-09-09T12:30:45+09:00',
  }],
  page: 0,
  size: 20,
  totalElements: 1,
  totalPages: 1,
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((promiseResolve) => { resolve = promiseResolve })
  return { promise, resolve }
}

describe('DocumentManagementDetailPage', () => {
  let container: HTMLDivElement
  let root: Root | null
  let confirmMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    Object.values(documentApiMock).forEach((mock) => mock.mockReset())
    Object.values(organizationApiMock).forEach((mock) => mock.mockReset())
    documentApiMock.fetchDocument.mockResolvedValue(detail)
    documentApiMock.fetchDocumentVersionAuditEvents.mockResolvedValue(auditPage)
    documentApiMock.retractDocumentVersion.mockResolvedValue({} as DocumentRetractionResult)
    confirmMock = vi.fn(() => true)
    vi.stubGlobal('confirm', confirmMock)
    root = null
    container = document.createElement('div')
    document.body.append(container)
  })

  afterEach(async () => {
    vi.unstubAllGlobals()
    if (root) await act(async () => root?.unmount())
    container.remove()
  })

  async function renderPage() {
    root = createRoot(container)
    await act(async () => {
      root?.render(
        <MemoryRouter initialEntries={['/hr/documents/10']}>
          <Routes>
            <Route path="/hr/documents/:documentId" element={<DocumentManagementDetailPage />} />
          </Routes>
        </MemoryRouter>,
      )
    })
  }

  function buttonsWithText(text: string) {
    return [...container.querySelectorAll('button')].filter(
      (button) => button.textContent?.trim() === text,
    )
  }

  function versionItem(name: string) {
    return [...container.querySelectorAll('li')].find((item) =>
      item.querySelector('h3')?.textContent === name,
    )
  }

  function versionButton(name: string, text: string) {
    return [...(versionItem(name)?.querySelectorAll('button') ?? [])].find(
      (button) => button.textContent?.trim() === text,
    )
  }

  it('shows retract only for the active PUBLIC version', async () => {
    await renderPage()

    expect(buttonsWithText('철회')).toHaveLength(1)
    expect(versionButton('v2', '철회')).toBeDefined()
    expect(versionButton('v1-draft', '철회')).toBeUndefined()
    expect(versionButton('v1-inactive', '철회')).toBeUndefined()
    expect(versionButton('v0', '철회')).toBeUndefined()
    expect(versionItem('v2')?.textContent).toContain('현재 공개 버전')
    expect(versionItem('v1-inactive')?.textContent).not.toContain('현재 공개 버전')
  })

  it('does not call the API when confirmation is cancelled', async () => {
    confirmMock.mockReturnValue(false)
    await renderPage()

    await act(async () => versionButton('v2', '철회')?.click())

    expect(documentApiMock.retractDocumentVersion).not.toHaveBeenCalled()
  })

  it('retracts using the route document id and selected version id', async () => {
    documentApiMock.fetchDocument
      .mockResolvedValueOnce(detail)
      .mockResolvedValueOnce(retractedDetail)
    await renderPage()

    await act(async () => versionButton('v2', '철회')?.click())

    expect(confirmMock).toHaveBeenCalledWith(
      '이 문서 버전을 철회하시겠습니까?\n철회 후에는 일반 RAG 검색에서 제외되며,\n이번 버전은 다시 발행할 수 없습니다.',
    )
    expect(documentApiMock.retractDocumentVersion).toHaveBeenCalledWith(10, 20)
  })

  it('blocks duplicate retract requests while one is pending', async () => {
    const pending = deferred<DocumentRetractionResult>()
    documentApiMock.retractDocumentVersion.mockReturnValue(pending.promise)
    documentApiMock.fetchDocument.mockResolvedValueOnce(detail).mockResolvedValueOnce(retractedDetail)
    await renderPage()
    const button = versionButton('v2', '철회')
    if (!button) throw new Error('Retract button was not rendered')

    act(() => { button.click(); button.click() })

    expect(documentApiMock.retractDocumentVersion).toHaveBeenCalledOnce()
    expect(button.disabled).toBe(true)
    await act(async () => pending.resolve({} as DocumentRetractionResult))
  })

  it('refreshes detail and history after success and renders RETRACTED', async () => {
    documentApiMock.fetchDocument
      .mockResolvedValueOnce(detail)
      .mockResolvedValueOnce(retractedDetail)
    await renderPage()

    await act(async () => versionButton('v2', '철회')?.click())

    expect(documentApiMock.fetchDocument).toHaveBeenCalledTimes(2)
    expect(documentApiMock.fetchDocumentVersionAuditEvents).toHaveBeenCalledWith(10, 20, 0, 20)
    expect(versionItem('v2')?.textContent).toContain('철회됨')
    expect(versionItem('v2')?.textContent).not.toContain('현재 공개 버전')
    expect(versionButton('v2', '철회')).toBeUndefined()
    expect(versionItem('v2')?.textContent).toContain('실행자 app-user ID: 77')
  })

  it('renders a version-scoped error when retraction fails', async () => {
    documentApiMock.retractDocumentVersion.mockRejectedValue(new Error('HTTP 500'))
    await renderPage()

    await act(async () => versionButton('v2', '철회')?.click())

    expect(versionItem('v2')?.querySelector('[role="alert"]')?.textContent)
      .toContain('문서 버전을 철회하지 못했습니다.')
    expect(documentApiMock.fetchDocument).toHaveBeenCalledOnce()
  })

  it('loads and displays scoped retraction history', async () => {
    await renderPage()

    await act(async () => versionButton('v2', '철회 이력 보기')?.click())

    expect(documentApiMock.fetchDocumentVersionAuditEvents).toHaveBeenCalledWith(10, 20, 0, 20)
    expect(versionItem('v2')?.textContent).toContain('실행자 app-user ID: 77')
    expect(versionItem('v2')?.textContent).toContain('공개 · 활성 → 철회됨 · 비활성')
  })

  it('renders an empty state when a version has no retraction events', async () => {
    documentApiMock.fetchDocumentVersionAuditEvents.mockResolvedValue({
      ...auditPage, content: [], totalElements: 0, totalPages: 0,
    })
    await renderPage()

    await act(async () => versionButton('v2', '철회 이력 보기')?.click())

    expect(versionItem('v2')?.textContent).toContain('철회 이력이 없습니다.')
  })

  it('renders an error and retry action when history loading fails', async () => {
    documentApiMock.fetchDocumentVersionAuditEvents.mockRejectedValue(new Error('HTTP 500'))
    await renderPage()

    await act(async () => versionButton('v2', '철회 이력 보기')?.click())

    expect(versionItem('v2')?.querySelector('[role="alert"]')?.textContent)
      .toContain('철회 이력을 불러오지 못했습니다.')
    expect(versionButton('v2', '다시 시도')).toBeDefined()
  })

  it('keeps the existing access-rule summary visible', async () => {
    await renderPage()

    expect(versionItem('v2')?.textContent).toContain('접근 범위: 전체 직원')
    expect(versionButton('v2', '접근 범위 변경')).toBeDefined()
  })
})
