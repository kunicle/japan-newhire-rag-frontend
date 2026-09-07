import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RagPage } from './RagPage'

const ragApiMock = vi.hoisted(() => ({
  askQuestion: vi.fn(),
  fetchHistory: vi.fn(),
  fetchHistoryDetail: vi.fn(),
}))

vi.mock('./ragApi', () => ragApiMock)

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true

const answeredResult = {
  hasSufficientEvidence: true,
  answer: '연차는 입사일을 기준으로 부여됩니다.',
  validCitedChunkIds: [101],
  citations: [
    {
      documentChunkId: 101,
      documentName: '취업규칙',
      versionName: '2026년판',
      articleNumber: '제12조',
      citedText: '연차 유급휴가는 입사일을 기준으로 산정합니다.',
    },
  ],
}

const insufficientResult = {
  hasSufficientEvidence: false,
  answer: null,
  validCitedChunkIds: [],
  citations: [],
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve
  })
  return { promise, resolve }
}

describe('RagPage', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(async () => {
    ragApiMock.askQuestion.mockReset()
    ragApiMock.fetchHistory.mockReset()
    ragApiMock.fetchHistoryDetail.mockReset()
    ragApiMock.fetchHistory.mockResolvedValue([])

    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    await act(async () => {
      root.render(<RagPage />)
    })
  })

  afterEach(async () => {
    await act(async () => {
      root.unmount()
    })
    container.remove()
  })

  async function submitQuestion(question = '연차 규정을 알려주세요') {
    const form = await enterQuestion(question)

    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })
  }

  async function enterQuestion(question: string) {
    const input = container.querySelector<HTMLInputElement>('input')
    const form = container.querySelector<HTMLFormElement>('form')
    if (!input || !form) throw new Error('Question form was not rendered')

    await act(async () => {
      const valueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      )?.set
      valueSetter?.call(input, question)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    return form
  }

  async function remountPage() {
    await act(async () => {
      root.unmount()
    })
    root = createRoot(container)
    await act(async () => {
      root.render(<RagPage />)
    })
  }

  it('renders an answered response with its evidence citation', async () => {
    ragApiMock.askQuestion.mockResolvedValue(answeredResult)

    await submitQuestion()

    expect(container.textContent).toContain(answeredResult.answer)
    expect(container.textContent).toContain('근거 문서')
    expect(container.textContent).toContain('취업규칙')
    expect(container.textContent).toContain('2026년판')
    expect(container.textContent).toContain('제12조')
    expect(container.textContent).toContain(
      '연차 유급휴가는 입사일을 기준으로 산정합니다.',
    )
  })

  it('renders insufficient evidence as a neutral domain outcome without citations', async () => {
    ragApiMock.askQuestion.mockResolvedValue(insufficientResult)

    await submitQuestion()

    expect(container.textContent).toContain(
      '답변에 사용할 충분한 근거를 찾지 못했습니다.',
    )
    expect(container.textContent).toContain(
      '질문을 조금 더 구체적으로 작성하거나, 관련 문서의 용어를 포함해 다시 질문해 주세요.',
    )
    expect(container.textContent).not.toContain('AI 답변을 불러오지 못했습니다.')
    expect(container.textContent).not.toContain('근거 문서')
    expect(container.querySelector('[role="status"]')).not.toBeNull()
  })

  it('renders a retryable system error for an HTTP failure', async () => {
    ragApiMock.askQuestion.mockRejectedValue(new Error('HTTP 500'))

    await submitQuestion()

    expect(container.textContent).toContain('AI 답변을 불러오지 못했습니다.')
    expect(container.textContent).toContain('잠시 후 다시 시도해 주세요.')
    expect(container.querySelector('[role="alert"]')).not.toBeNull()
    expect(buttonWithText('다시 시도')).not.toBeNull()
  })

  it('renders a retryable system error for a network failure', async () => {
    ragApiMock.askQuestion.mockRejectedValue(new TypeError('Failed to fetch'))

    await submitQuestion()

    expect(container.textContent).toContain('AI 답변을 불러오지 못했습니다.')
    expect(container.textContent).toContain('잠시 후 다시 시도해 주세요.')
    expect(buttonWithText('다시 시도')).not.toBeNull()
  })

  it('announces evidence retrieval while the answer is loading', async () => {
    const pendingAnswer = deferred<typeof answeredResult>()
    ragApiMock.askQuestion.mockReturnValue(pendingAnswer.promise)

    const form = await enterQuestion('연차 규정을 알려주세요')
    act(() => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    expect(container.textContent).toContain('사내 문서에서 근거를 찾고 있습니다.')
    expect(container.querySelector('[role="status"]')).not.toBeNull()

    await act(async () => {
      pendingAnswer.resolve(answeredResult)
    })
  })

  it('labels answered questions in history', async () => {
    ragApiMock.fetchHistory.mockResolvedValue([
      {
        questionId: 1,
        question: '연차 규정',
        status: 'ANSWERED',
        askedAt: '2026-09-04T10:00:00Z',
      },
    ])

    await remountPage()

    expect(container.textContent).toContain('답변 완료')
  })

  it('labels rejected history and renders its detail without citations', async () => {
    const rejectedItem = {
      questionId: 2,
      question: '알 수 없는 규정',
      status: 'REJECTED' as const,
      askedAt: '2026-09-04T10:00:00Z',
    }
    ragApiMock.fetchHistory.mockResolvedValue([rejectedItem])
    ragApiMock.fetchHistoryDetail.mockResolvedValue({
      ...rejectedItem,
      answer: null,
      citations: [],
    })

    await remountPage()

    expect(container.textContent).toContain('근거 부족')

    await act(async () => {
      buttonWithText('알 수 없는 규정')?.click()
    })

    expect(container.textContent).toContain(
      '이 질문에 답변할 충분한 근거를 찾지 못했습니다.',
    )
    expect(container.textContent).not.toContain('근거 문서')
  })

  function buttonWithText(text: string) {
    return [...container.querySelectorAll('button')].find((button) =>
      button.textContent?.includes(text),
    )
  }
})
