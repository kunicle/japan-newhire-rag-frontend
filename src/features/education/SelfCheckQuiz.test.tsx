import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  SelfCheckQuiz,
  type SelfCheckQuestion,
} from './SelfCheckQuiz'

const questions: SelfCheckQuestion[] = [
  {
    id: 'question-1',
    statement: '첫 번째 문제입니다.',
    correctAnswer: 'O',
  },
  {
    id: 'question-2',
    statement: '두 번째 문제입니다.',
    correctAnswer: 'X',
  },
]

describe('SelfCheckQuiz', () => {
  let container: HTMLDivElement
  let root: Root | null

  beforeEach(() => {
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root?.unmount())
    container.remove()
  })

  async function renderQuiz() {
    await act(async () => {
      root?.render(<SelfCheckQuiz questions={questions} />)
    })
  }

  function buttonWithText(text: string) {
    return [...container.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === text,
    )
  }

  function answerQuestion(questionId: string, answer: 'O' | 'X') {
    const input = container.querySelector<HTMLInputElement>(
      `input[name="question-${questionId}"][value="${answer}"]`,
    )

    if (!input) {
      throw new Error(`답안 입력을 찾을 수 없습니다: ${questionId}`)
    }

    act(() => input.click())
  }

  it('renders O and X choices for every question', async () => {
    await renderQuiz()

    expect(container.textContent).toContain('교육 이수 확인 퀴즈')
    expect(container.querySelectorAll('fieldset')).toHaveLength(2)
    expect(container.querySelectorAll('input[type="radio"]')).toHaveLength(4)
  })

  it('does not submit until every question has an answer', async () => {
    await renderQuiz()

    act(() => buttonWithText('결과 확인')?.click())

    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      '모든 문제에 답해주세요.',
    )
    expect(container.querySelector('[role="status"]')).toBeNull()
  })

  it('shows how many questions were answered correctly', async () => {
    await renderQuiz()

    answerQuestion('question-1', 'O')
    answerQuestion('question-2', 'O')

    act(() => buttonWithText('결과 확인')?.click())

    expect(container.querySelector('[role="status"]')?.textContent).toContain(
      '전체 2개 중 1개를 맞혔습니다.',
    )
  })

  it('clears answers and result when retrying the quiz', async () => {
    await renderQuiz()

    answerQuestion('question-1', 'O')
    answerQuestion('question-2', 'X')
    act(() => buttonWithText('결과 확인')?.click())

    expect(container.textContent).toContain(
      '전체 2개 중 2개를 맞혔습니다.',
    )

    act(() => buttonWithText('다시 풀기')?.click())

    expect(container.querySelector('[role="status"]')).toBeNull()
    expect(buttonWithText('결과 확인')).toBeDefined()

    const selectedAnswers = [
      ...container.querySelectorAll<HTMLInputElement>(
        'input[type="radio"]:checked',
      ),
    ]
    expect(selectedAnswers).toHaveLength(0)
  })
})