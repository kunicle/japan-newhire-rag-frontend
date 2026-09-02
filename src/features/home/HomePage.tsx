import {
  Bell,
  BookOpen,
  ClipboardCheck,
  FileClock,
  Files,
  FileUp,
  GraduationCap,
  MessageCircleQuestion,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Card } from '../../shared/ui'
import { useAuth } from '../auth/AuthContext'
import { hasAnyRole } from '../auth/roles'
import { ROLE_LABELS } from '../documents/accessRuleFormHelpers'
import { getHomeShortcutIds, type HomeShortcutId } from './homeHelpers'
import styles from './HomePage.module.css'

const SHORTCUT_CONFIG: Record<HomeShortcutId, {
  title: string
  description: string
  path: string
  icon: LucideIcon
}> = {
  rag: {
    title: 'AI 문서 검색',
    path: '/rag',
    icon: MessageCircleQuestion,
    description: '권한이 있는 사내 문서를 기반으로 질문하고 근거와 함께 답변을 확인합니다.',
  },
  education: {
    title: '내 교육',
    path: '/me/education',
    icon: BookOpen,
    description: '배정된 교육 과정을 확인하고 학습을 진행합니다.',
  },
  onboarding: {
    title: '내 온보딩',
    path: '/me/onboarding',
    icon: ClipboardCheck,
    description: '배정된 온보딩 할 일을 확인하고 진행합니다.',
  },
  managerEducation: {
    title: '팀 교육 현황',
    path: '/manager/education',
    icon: Users,
    description: '관리 중인 직원들의 교육 진행 현황을 확인합니다.',
  },
  documents: {
    title: '문서 관리',
    path: '/hr/documents',
    icon: Files,
    description: '등록된 문서와 버전, 접근 범위를 확인하고 관리합니다.',
  },
  upload: {
    title: '문서 업로드',
    path: '/hr/documents/upload',
    icon: FileUp,
    description: '새 문서를 업로드하고 접근 범위를 설정합니다.',
  },
  processing: {
    title: '처리 현황',
    path: '/hr/documents/processing',
    icon: FileClock,
    description: '업로드한 문서의 임베딩 처리 상태를 확인합니다.',
  },
  courseManagement: {
    title: '교육 과정 관리',
    path: '/hr/courses',
    icon: GraduationCap,
    description: '교육 과정과 학습 모듈을 만들고 관리합니다.',
  },
  notifications: {
    title: '알림',
    path: '/notifications',
    icon: Bell,
    description: '새로운 소식과 처리 결과를 확인합니다.',
  },
}

const HR_FLOW_STEPS = [
  '업로드',
  '접근 범위 설정',
  '발행',
  '처리 완료',
  'AI 검색',
]

export function HomePage() {
  const { user, roles } = useAuth()
  const shortcutIds = getHomeShortcutIds(roles)
  const showHrFlow = hasAnyRole(roles, ['HR_MANAGER'])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>업무 지원 포털</h1>
        {user && (
          <p className={styles.welcome}>
            {user.employeeName}님, 현재 역할에 맞는 업무와 AI 문서 검색 기능을 빠르게 이용할 수 있습니다.
          </p>
        )}
        <div className={styles.roleList} aria-label="현재 역할">
          {roles.map((role) => (
            <Badge key={role} variant="info">{ROLE_LABELS[role]}</Badge>
          ))}
        </div>
      </header>

      <section className={styles.section} aria-labelledby="shortcuts-title">
        <h2 className={styles.sectionTitle} id="shortcuts-title">바로가기</h2>
        <div className={styles.shortcutGrid}>
          {shortcutIds.map((shortcutId) => {
            const config = SHORTCUT_CONFIG[shortcutId]
            const Icon = config.icon
            return (
              <Card padding="none" className={styles.shortcutCard} key={shortcutId}>
                <Link className={styles.shortcutLink} to={config.path}>
                  <Icon className={styles.shortcutIcon} size={24} aria-hidden="true" />
                  <h3 className={styles.shortcutTitle}>{config.title}</h3>
                  <p className={styles.shortcutDescription}>{config.description}</p>
                </Link>
              </Card>
            )
          })}
        </div>
      </section>

      {showHrFlow && (
        <section className={styles.section} aria-labelledby="flow-title">
          <h2 className={styles.sectionTitle} id="flow-title">문서 운영 흐름</h2>
          <ol className={styles.flowList}>
            {HR_FLOW_STEPS.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </section>
      )}
    </div>
  )
}
