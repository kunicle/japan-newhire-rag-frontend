import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { HrQuizForm } from './HrQuizForm'
import type { HrQuizCreateInput } from './hrQuizTypes'

;(globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean
}).IS_REACT_ACT_ENVIRONMENT = true

function setNativeValue(
  element:
    | HTMLInputElement
    | HTMLTextAreaElement
    | HTMLSelectElement,
  value: string,
) {
  let prototype: object

  if (element instanceof HTMLInputElement) {
    prototype = HTMLInputElement.prototype
  } else if (element instanceof HTMLTextAreaElement) {
    prototype = HTMLTextAreaElement.prototype
  } else {
    prototype = HTMLSelectElement.prototype
  }

  const setter = Object.getOwnPropertyDescriptor(
    prototype,
    'value',
  )?.set

  if (!setter) {
    throw new Error('Element value setter was not found')
  }

  act(() => {
    setter.call(element, value)

    element.dispatchEvent(
      new Event(
        element instanceof HTMLSelectElement
          ? 'change'
          : 'input',
        { bubbles: true },
      ),
    )
  })
}

describe('HrQuizForm', () => {
  let container: HTMLDivElement
  let root: Root | null
  let onSubmit: ReturnType<
    typeof vi.fn<(input: HrQuizCreateInput) => void>
  >

  beforeEach(() => {
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    onSubmit = vi.fn()
  })

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root?.unmount()
      })
    }

    container.remove()
  })

  async function renderForm(submitting = false) {
    await act(async () => {
      root?.render(
        <HrQuizForm
          submitting={submitting}
          onSubmit={onSubmit}
        />,
      )
    })
  }

  function getInput(id: string) {
    const input =
      container.querySelector<HTMLInputElement>(`#${id}`)

    if (!input) {
      throw new Error(`${id} input was not rendered`)
    }

    return input
  }

  function getTextarea(id: string) {
    const textarea =
      container.querySelector<HTMLTextAreaElement>(`#${id}`)

    if (!textarea) {
      throw new Error(`${id} textarea was not rendered`)
    }

    return textarea
  }

  function getSelect(id: string) {
    const select =
      container.querySelector<HTMLSelectElement>(`#${id}`)

    if (!select) {
      throw new Error(`${id} select was not rendered`)
    }

    return select
  }

  function buttonWithText(text: string) {
    return [...container.querySelectorAll('button')].find(
      (button) => button.textContent?.trim().includes(text),
    )
  }

  async function submitForm() {
    const form = container.querySelector('form')

    if (!form) {
      throw new Error('Quiz form was not rendered')
    }

    await act(async () => {
      form.dispatchEvent(
        new Event('submit', {
          bubbles: true,
          cancelable: true,
        }),
      )
    })
  }

  it('submits a normalized O/X quiz input', async () => {
    await renderForm()

    setNativeValue(
      getInput('quiz-title'),
      '  정보보안 퀴즈  ',
    )
    setNativeValue(
      getTextarea('quiz-question-1'),
      '  비밀번호를 다른 사람과 공유해도 된다.  ',
    )
    setNativeValue(
      getSelect('quiz-question-answer-1'),
      'X',
    )

    await submitForm()

    expect(onSubmit).toHaveBeenCalledOnce()
    expect(onSubmit).toHaveBeenCalledWith({
      quizTitle: '정보보안 퀴즈',
      passingScore: 80,
      maxAttemptCount: 3,
      required: true,
      questions: [
        {
          questionContent:
            '비밀번호를 다른 사람과 공유해도 된다.',
          score: 100,
          correctAnswer: 'X',
        },
      ],
    })
  })

  it('rejects submission when the total score is not 100', async () => {
    await renderForm()

    setNativeValue(
      getInput('quiz-title'),
      '정보보안 퀴즈',
    )
    setNativeValue(
      getTextarea('quiz-question-1'),
      '첫 번째 문제',
    )
    setNativeValue(
      getInput('quiz-question-score-1'),
      '60',
    )

    const addButton = buttonWithText('문제 추가')

    if (!addButton) {
      throw new Error('Add question button was not rendered')
    }

    await act(async () => {
      addButton.click()
    })

    setNativeValue(
      getTextarea('quiz-question-2'),
      '두 번째 문제',
    )
    setNativeValue(
      getInput('quiz-question-score-2'),
      '30',
    )

    await submitForm()

    expect(onSubmit).not.toHaveBeenCalled()
    expect(
      container.querySelector('[role="alert"]')?.textContent,
    ).toContain('전체 문제의 배점 합계는 100점이어야 합니다.')
  })

  it('adds and removes a question', async () => {
    await renderForm()

    expect(
      container.querySelectorAll('[class*="questionItem"]'),
    ).toHaveLength(1)

    const initialDeleteButton = buttonWithText('삭제')
    expect(initialDeleteButton?.disabled).toBe(true)

    const addButton = buttonWithText('문제 추가')

    if (!addButton) {
      throw new Error('Add question button was not rendered')
    }

    await act(async () => {
      addButton.click()
    })

    expect(
      container.querySelectorAll('[class*="questionItem"]'),
    ).toHaveLength(2)

    const deleteButtons = [
      ...container.querySelectorAll<HTMLButtonElement>(
        'button',
      ),
    ].filter((button) =>
      button.textContent?.includes('삭제'),
    )

    await act(async () => {
      deleteButtons[1]?.click()
    })

    expect(
      container.querySelectorAll('[class*="questionItem"]'),
    ).toHaveLength(1)
  })

  it('prevents submission while a request is pending', async () => {
    await renderForm(true)

    const submitButton = buttonWithText('퀴즈 저장')

    expect(submitButton?.disabled).toBe(true)

    await submitForm()

    expect(onSubmit).not.toHaveBeenCalled()
  })
})