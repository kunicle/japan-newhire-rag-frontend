import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '../../shared/api/httpClient'
import {
  fetchDocumentCategories,
  publishDocumentVersion,
  uploadDocument,
} from './documentApi'

vi.mock('../../shared/api/httpClient', () => ({
  request: vi.fn(),
}))

const requestMock = vi.mocked(request)

describe('documentApi', () => {
  beforeEach(() => {
    requestMock.mockReset()
  })

  it('fetches document categories from the exact path', async () => {
    requestMock.mockResolvedValueOnce([])

    await fetchDocumentCategories()

    expect(requestMock).toHaveBeenCalledWith('/documents/categories')
  })

  it('uploads required fields without setting headers or description', async () => {
    const file = new File(['content'], 'policy.txt', { type: 'text/plain' })
    requestMock.mockResolvedValueOnce({})

    await uploadDocument({
      file,
      documentCategoryId: 7,
      title: 'Policy',
    })

    expect(requestMock).toHaveBeenCalledTimes(1)
    const [path, init] = requestMock.mock.calls[0]
    expect(path).toBe('/documents')
    expect(init).toEqual({ method: 'POST', body: expect.any(FormData) })
    expect(init).not.toHaveProperty('headers')
    const body = init?.body as FormData
    expect(body.get('file')).toBe(file)
    expect(body.get('documentCategoryId')).toBe('7')
    expect(body.get('title')).toBe('Policy')
    expect(body.has('description')).toBe(false)
  })

  it('appends a non-empty description', async () => {
    const file = new File(['content'], 'policy.txt', { type: 'text/plain' })
    requestMock.mockResolvedValueOnce({})

    await uploadDocument({
      file,
      documentCategoryId: 7,
      title: 'Policy',
      description: 'Description',
    })

    const body = requestMock.mock.calls[0][1]?.body as FormData
    expect(body.get('description')).toBe('Description')
  })

  it('publishes the exact document version without a body', async () => {
    requestMock.mockResolvedValueOnce({})

    await publishDocumentVersion(12, 34)

    expect(requestMock).toHaveBeenCalledWith(
      '/documents/12/versions/34/publish',
      { method: 'PATCH' },
    )
  })
})
