import type { SelfCheckQuestion } from './SelfCheckQuiz'

export const SELF_CHECK_QUESTIONS: SelfCheckQuestion[] = [
  {
    id: 'password-sharing',
    statement: '회사 계정 비밀번호는 다른 직원과 공유해도 된다.',
    correctAnswer: 'X',
  },
  {
    id: 'policy-check',
    statement: '업무 중 모르는 규정은 사내 자료에서 확인한다.',
    correctAnswer: 'O',
  },
  {
    id: 'external-sharing',
    statement: '승인받지 않은 사내 자료를 외부로 전송해도 된다.',
    correctAnswer: 'X',
  },
]