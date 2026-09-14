import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../shared/api/errors'
import { DocumentManagementPage } from './DocumentManagementPage'
import type { DocumentManagementListItem, DocumentManagementListPage } from './documentManagementTypes'

const documentApiMock = vi.hoisted(() => ({
  fetchDocuments: vi.fn(),
  deleteDocument: vi.fn(),
}))

vi.mock('./documentManagementApi', () => documentApiMock)

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true

function item(overrides: Partial<DocumentManagementListItem> = {}): DocumentManagementListItem {
  return {
    documentId: 1,
    documentName: '취업 규칙',
    documentCategoryId: 1,
    categoryCode: 'EMPLOYEE_POLICY',
    categoryName: '사내 규정',
    documentStatus: 'ACTIVE',
    latestVersionId: 10,
    latestVersionName: 'v1',
    latestVersionPublicationStatus: 'PUBLIC',
    latestVersionIsActive: true,
    createdAt: '2026-09-01T09:00:00+09:00',
    ...overrides,
  }
}

function page(overrides: Partial<DocumentManagementListPage> = {}): DocumentManagementListPage {
  const content = overrides.content ?? [item()]
  return {
    content,
    page: 0,
    size: 10,
    totalElements: content.length,
    totalPages: 1,
    ...overrides,
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((promiseResolve) => { resolve = promiseResolve })
  return { promise, resolve }
}

describe('DocumentManagementPage', () => {
  let container: HTMLDivElement
  let root: Root | null

  beforeEach(() => {
    documentApiMock.fetchDocuments.mockReset()
    documentApiMock.deleteDocument.mockReset()
    documentApiMock.fetchDocuments.mockResolvedValue(page())
    documentApiMock.deleteDocument.mockResolvedValue(undefined)
    root = null
    container = document.createElement('div')
    document.body.append(container)
  })

  afterEach(async () => {
    if (root) await act(async () => root?.unmount())
    container.remove()
  })

  async function renderPage() {
    root = createRoot(container)
    await act(async () => {
      root?.render(
        <MemoryRouter>
          <DocumentManagementPage />
        </MemoryRouter>,
      )
    })
  }

  function buttonsWithText(text: string) {
    return [...container.querySelectorAll('button')].filter(
      (button) => button.textContent?.trim() === text,
    )
  }

  function searchInput() {
    return container.querySelector<HTMLInputElement>('input[placeholder="문서 검색"]')
  }

  function typeKeyword(value: string) {
    const input = searchInput()
    if (!input) throw new Error('Search input was not rendered')
    const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    valueSetter?.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }

  it('renders existing document cards without regressions', async () => {
    await renderPage()

    expect(container.textContent).toContain('취업 규칙')
    expect(container.textContent).toContain('사내 규정')
    expect(container.textContent).toContain('최신 버전: v1')
    expect(container.textContent).toContain('현재 공개 버전')
    expect(container.querySelector('a[href="/hr/documents/1"]')).not.toBeNull()
  })

  it('searches documents server-side after debouncing input', async () => {
    await renderPage()
    documentApiMock.fetchDocuments.mockClear()

    try {
      vi.useFakeTimers()
      typeKeyword('취업')
      expect(documentApiMock.fetchDocuments).not.toHaveBeenCalled()
      await act(async () => { vi.advanceTimersByTime(400) })
    } finally {
      vi.useRealTimers()
    }
    await act(async () => { await Promise.resolve() })

    expect(documentApiMock.fetchDocuments).toHaveBeenCalledWith({ keyword: '취업', page: 0, size: 10 })
  })

  it('resets to page 0 when the search keyword changes', async () => {
    documentApiMock.fetchDocuments.mockResolvedValue(
      page({ content: [item(), item({ documentId: 2 })], page: 1, totalPages: 3 }),
    )
    await renderPage()
    await act(async () => buttonsWithText('2')[0]?.click())
    documentApiMock.fetchDocuments.mockClear()
    documentApiMock.fetchDocuments.mockResolvedValue(page())

    try {
      vi.useFakeTimers()
      typeKeyword('연차')
      await act(async () => { vi.advanceTimersByTime(400) })
    } finally {
      vi.useRealTimers()
    }
    await act(async () => { await Promise.resolve() })

    expect(documentApiMock.fetchDocuments).toHaveBeenCalledWith({ keyword: '연차', page: 0, size: 10 })
  })

  it('shows a no-results message when a search returns nothing', async () => {
    await renderPage()
    documentApiMock.fetchDocuments.mockResolvedValue(page({ content: [], totalElements: 0, totalPages: 0 }))

    try {
      vi.useFakeTimers()
      typeKeyword('없는문서')
      await act(async () => { vi.advanceTimersByTime(400) })
    } finally {
      vi.useRealTimers()
    }
    await act(async () => { await Promise.resolve() })

    expect(container.textContent).toContain('검색 결과가 없습니다.')
  })

  it('navigates between pages without resetting the keyword', async () => {
    documentApiMock.fetchDocuments.mockImplementation((params: { keyword?: string; page: number; size: number }) =>
      Promise.resolve(page({ content: [item()], page: params.page, totalPages: 3 })))
    await renderPage()

    await act(async () => buttonsWithText('2')[0]?.click())

    expect(documentApiMock.fetchDocuments).toHaveBeenCalledWith({ keyword: '', page: 1, size: 10 })
    const previousButton = buttonsWithText('이전')[0]
    const nextButton = buttonsWithText('다음')[0]
    expect(previousButton?.hasAttribute('disabled')).toBe(false)
    expect(nextButton?.hasAttribute('disabled')).toBe(false)
  })

  it('hides pagination when there is only one page', async () => {
    await renderPage()

    expect(buttonsWithText('이전')).toHaveLength(0)
    expect(buttonsWithText('다음')).toHaveLength(0)
  })

  it('opens a confirm dialog and cancels without deleting', async () => {
    await renderPage()

    await act(async () => buttonsWithText('삭제')[0]?.click())
    expect(container.textContent).toContain('문서를 삭제하시겠습니까? 삭제된 문서는 RAG 검색에서 더 이상 사용할 수 없습니다.')

    await act(async () => buttonsWithText('취소')[0]?.click())

    expect(documentApiMock.deleteDocument).not.toHaveBeenCalled()
    expect(container.querySelector('dialog')).toBeNull()
  })

  it('deletes a document on confirm and refetches the list', async () => {
    await renderPage()
    documentApiMock.fetchDocuments.mockClear()
    documentApiMock.fetchDocuments.mockResolvedValue(page({ content: [] }))

    await act(async () => buttonsWithText('삭제')[0]?.click())
    await act(async () => buttonsWithText('삭제')[1]?.click())

    expect(documentApiMock.deleteDocument).toHaveBeenCalledWith(1)
    expect(documentApiMock.fetchDocuments).toHaveBeenCalledWith({ keyword: '', page: 0, size: 10 })
  })

  it('prevents duplicate delete requests while one is pending', async () => {
    const pending = deferred<void>()
    documentApiMock.deleteDocument.mockReturnValue(pending.promise)
    await renderPage()

    await act(async () => buttonsWithText('삭제')[0]?.click())
    const confirmButton = buttonsWithText('삭제')[1]
    if (!confirmButton) throw new Error('Confirm delete button was not rendered')

    act(() => { confirmButton.click(); confirmButton.click() })

    expect(documentApiMock.deleteDocument).toHaveBeenCalledOnce()
    await act(async () => pending.resolve())
  })

  it('shows an error message when delete fails', async () => {
    documentApiMock.deleteDocument.mockRejectedValue(new AppError(409, 'CONFLICT', '현재 상태에서는 요청을 처리할 수 없습니다.'))
    await renderPage()

    await act(async () => buttonsWithText('삭제')[0]?.click())
    await act(async () => buttonsWithText('삭제')[1]?.click())

    expect(container.textContent).toContain('현재 상태에서는 요청을 처리할 수 없습니다.')
    expect(container.querySelector('dialog')).not.toBeNull()
  })

  it('moves to the previous page after deleting the last item on the current page', async () => {
    documentApiMock.fetchDocuments.mockImplementation((params: { keyword?: string; page: number; size: number }) =>
      Promise.resolve(page({ content: [item()], page: params.page, totalPages: 2 })))
    await renderPage()
    await act(async () => buttonsWithText('2')[0]?.click())
    documentApiMock.fetchDocuments.mockClear()
    documentApiMock.fetchDocuments.mockResolvedValue(
      page({ content: [item(), item({ documentId: 2 })], page: 0, totalPages: 1 }),
    )

    await act(async () => buttonsWithText('삭제')[0]?.click())
    await act(async () => buttonsWithText('삭제')[1]?.click())

    expect(documentApiMock.fetchDocuments).toHaveBeenCalledWith({ keyword: '', page: 0, size: 10 })
  })
})
