import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HrCourseDetailPage } from './HrCourseDetailPage'
import type { HrCourse, HrCourseModule } from './hrCourseTypes'

const hrCourseApiMock = vi.hoisted(() => ({
  changeCoursePublication: vi.fn(),
  changeModuleActivation: vi.fn(),
  createHrCourseModule: vi.fn(),
  deleteCourseModuleAttachment: vi.fn(),
  deleteHrCourse: vi.fn(),
  downloadCourseModuleAttachment: vi.fn(),
  fetchHrCourse: vi.fn(),
  fetchHrCourseModules: vi.fn(),
  updateHrCourse: vi.fn(),
  updateHrCourseModule: vi.fn(),
  uploadCourseModuleAttachment: vi.fn(),
}))

vi.mock('./hrCourseApi', () => hrCourseApiMock)
vi.mock('./CourseAssignmentSection', () => ({ CourseAssignmentSection: () => null }))
vi.mock('./CourseForm', () => ({ CourseForm: () => null }))
vi.mock('./ModuleForm', () => ({ ModuleForm: () => null }))

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true

const course: HrCourse = {
  courseId: 101,
  courseName: '신입사원 필수 교육',
  courseDescription: '기본 교육입니다.',
  required: true,
  trainingStartDate: '2026-09-01',
  trainingEndDate: '2026-09-30',
  publicationStatus: 'PUBLIC',
  createdBy: 1,
  createdAt: '2026-09-01T09:00:00+09:00',
  updatedAt: '2026-09-01T09:00:00+09:00',
}

const moduleWithAttachment: HrCourseModule = {
  courseModuleId: 301,
  courseId: course.courseId,
  moduleTitle: '정보보안 기본',
  moduleContent: '정보보안 수칙을 학습합니다.',
  referenceUrl: null,
  attachmentFileName: '보안교육.txt',
  attachmentFileSize: 2048,
  moduleOrder: 1,
  required: true,
  active: true,
  createdAt: '2026-09-01T09:00:00+09:00',
  updatedAt: '2026-09-01T09:00:00+09:00',
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve
  })
  return { promise, resolve }
}

describe('HrCourseDetailPage attachments', () => {
  let container: HTMLDivElement
  let root: Root | null

  beforeEach(() => {
    Object.values(hrCourseApiMock).forEach((mock) => mock.mockReset())
    hrCourseApiMock.fetchHrCourse.mockResolvedValue(course)
    hrCourseApiMock.fetchHrCourseModules.mockResolvedValue([moduleWithAttachment])
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:hr-course-module-attachment'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    root = null
    container = document.createElement('div')
    document.body.append(container)
  })

  afterEach(async () => {
    if (root) await act(async () => root?.unmount())
    container.remove()
    vi.restoreAllMocks()
  })

  async function renderPage() {
    root = createRoot(container)
    await act(async () => {
      root?.render(
        <MemoryRouter initialEntries={['/hr/courses/101']}>
          <Routes>
            <Route path="/hr/courses/:courseId" element={<HrCourseDetailPage />} />
          </Routes>
        </MemoryRouter>,
      )
    })
  }

  function buttonWithText(text: string) {
    return [...container.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === text,
    )
  }

  it('renders attachment metadata and downloads with the original file name', async () => {
    let downloadedFileName = ''
    vi.mocked(HTMLAnchorElement.prototype.click).mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloadedFileName = this.download
    })
    const attachment = new Blob(['보안 교육'], { type: 'text/plain' })
    hrCourseApiMock.downloadCourseModuleAttachment.mockResolvedValue(attachment)

    await renderPage()
    expect(container.textContent).toContain('보안교육.txt')
    expect(container.textContent).toContain('2.0 KB')

    await act(async () => buttonWithText('다운로드')?.click())

    expect(hrCourseApiMock.downloadCourseModuleAttachment).toHaveBeenCalledWith(301)
    expect(downloadedFileName).toBe('보안교육.txt')
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(
      'blob:hr-course-module-attachment',
    )
  })

  it('uploads a selected TXT file and reloads the module list', async () => {
    hrCourseApiMock.uploadCourseModuleAttachment.mockResolvedValue({
      moduleId: 301,
      fileName: '새자료.txt',
      fileSize: 8,
    })
    await renderPage()
    const input = container.querySelector<HTMLInputElement>(
      '#module-attachment-301',
    )
    if (!input) throw new Error('Attachment input was not rendered')
    const file = new File(['새 자료'], '새자료.txt', { type: 'text/plain' })
    Object.defineProperty(input, 'files', { configurable: true, value: [file] })

    await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })))

    expect(hrCourseApiMock.uploadCourseModuleAttachment).toHaveBeenCalledWith(301, file)
    expect(hrCourseApiMock.fetchHrCourseModules).toHaveBeenCalledTimes(2)
  })

  it('rejects a non-TXT file before calling the upload API', async () => {
    await renderPage()
    const input = container.querySelector<HTMLInputElement>(
      '#module-attachment-301',
    )
    if (!input) throw new Error('Attachment input was not rendered')
    const file = new File(['image'], 'image.png', { type: 'image/png' })
    Object.defineProperty(input, 'files', { configurable: true, value: [file] })

    await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })))

    expect(hrCourseApiMock.uploadCourseModuleAttachment).not.toHaveBeenCalled()
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      'TXT 파일만 첨부할 수 있습니다.',
    )
  })

  it('deletes an attachment after confirmation and reloads the module list', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    hrCourseApiMock.deleteCourseModuleAttachment.mockResolvedValue(undefined)
    await renderPage()

    await act(async () => buttonWithText('첨부 삭제')?.click())

    expect(window.confirm).toHaveBeenCalledWith('첨부 자료를 삭제하시겠습니까?')
    expect(hrCourseApiMock.deleteCourseModuleAttachment).toHaveBeenCalledWith(301)
    expect(hrCourseApiMock.fetchHrCourseModules).toHaveBeenCalledTimes(2)
  })

  it('prevents duplicate attachment requests while one is pending', async () => {
    const pendingDownload = deferred<Blob>()
    hrCourseApiMock.downloadCourseModuleAttachment.mockReturnValue(
      pendingDownload.promise,
    )
    await renderPage()
    const button = buttonWithText('다운로드')
    if (!button) throw new Error('Download button was not rendered')

    act(() => {
      button.click()
      button.click()
    })

    expect(hrCourseApiMock.downloadCourseModuleAttachment).toHaveBeenCalledOnce()

    await act(async () => {
      pendingDownload.resolve(new Blob(['보안 교육'], { type: 'text/plain' }))
    })
  })

  it('renders a module-scoped error when an upload fails', async () => {
    hrCourseApiMock.uploadCourseModuleAttachment.mockRejectedValue(
      new Error('HTTP 500'),
    )
    await renderPage()
    const input = container.querySelector<HTMLInputElement>(
      '#module-attachment-301',
    )
    if (!input) throw new Error('Attachment input was not rendered')
    const file = new File(['새 자료'], '새자료.txt', { type: 'text/plain' })
    Object.defineProperty(input, 'files', { configurable: true, value: [file] })

    await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })))

    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      '첨부 자료 업로드에 실패했습니다.',
    )
  })
})
