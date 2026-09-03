import {
  ArrowUpRight,
  Bell,
  BookOpen,
  Building2,
  ClipboardCheck,
  ClipboardList,
  ClipboardPenLine,
  CalendarCog,
  FileClock,
  Files,
  FileUp,
  GraduationCap,
  MessageCircleQuestion,
  Users,
  UserPlus,
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
  organization: {
    title: '조직도',
    path: '/organization',
    icon: Building2,
    description: '부서 구조와 소속 직원을 확인합니다.',
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
  evaluation: {
    title: '내 평가',
    path: '/me/evaluations',
    icon: ClipboardList,
    description: '배정된 평가를 확인하고 자기 평가를 작성합니다.',
  },
  managerEducation: {
    title: '팀 교육 현황',
    path: '/manager/education',
    icon: Users,
    description: '관리 중인 직원들의 교육 진행 현황을 확인합니다.',
  },
  managerEvaluation: {
    title: '팀 평가',
    path: '/manager/evaluations',
    icon: ClipboardPenLine,
    description: '팀원에게 배정된 평가를 확인하고 작성합니다.',
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
  hrOnboarding: {
    title: '온보딩 관리',
    path: '/hr/onboarding',
    icon: UserPlus,
    description: '신입사원 온보딩 태스크를 만들고 배정합니다.',
  },
  hrEvaluation: {
    title: '평가 관리',
    path: '/hr/evaluations',
    icon: CalendarCog,
    description: '평가 주기와 자기·관리자 평가 템플릿을 설정합니다.',
  },
  audit: {
    title: '감사 로그',
    path: '/admin/audit',
    icon: FileClock,
    description: '주요 시스템 활동 기록을 확인합니다.',
  },
  adminUsers: {
    title: '사용자 관리',
    path: '/admin/users',
    icon: Users,
    description: '새 사용자 계정을 생성하고 권한을 관리합니다.',
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
        <p className={styles.eyebrow}>SLDK WORKSPACE</p>
        <h1 className={styles.title}>주식회사 SLDK 업무 포털</h1>
        {user && (
          <p className={styles.welcome}>
            {user.employeeName}님, 안녕하세요. 사내 문서, 교육, 평가와 온보딩 업무를 한 곳에서 관리하세요.
          </p>
        )}
        <div className={styles.roleList} aria-label="현재 역할">
          {roles.map((role) => (
            <Badge key={role} variant="info">{ROLE_LABELS[role]}</Badge>
          ))}
        </div>
      </header>

      <section className={styles.section} aria-labelledby="shortcuts-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.sectionEyebrow}>WORK TOOLS</p>
            <h2 className={styles.sectionTitle} id="shortcuts-title">주요 업무 바로가기</h2>
          </div>
          <p>현재 역할에 필요한 메뉴만 표시됩니다.</p>
        </div>
        <div className={styles.shortcutGrid}>
          {shortcutIds.map((shortcutId) => {
            const config = SHORTCUT_CONFIG[shortcutId]
            const Icon = config.icon
            return (
              <Card padding="none" className={styles.shortcutCard} key={shortcutId}>
                <Link className={styles.shortcutLink} to={config.path}>
                  <span className={styles.shortcutIconWrap}>
                    <Icon className={styles.shortcutIcon} size={22} aria-hidden="true" />
                  </span>
                  <ArrowUpRight className={styles.shortcutArrow} size={18} aria-hidden="true" />
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
          <div className={styles.flowPanel}>
            <div className={styles.flowIntro}>
              <p className={styles.sectionEyebrow}>HR GUIDE</p>
              <h2 className={styles.sectionTitle} id="flow-title">문서 운영 흐름</h2>
              <p>문서를 등록한 뒤 AI 검색에 반영되기까지의 순서입니다.</p>
            </div>
            <ol className={styles.flowList}>
              {HR_FLOW_STEPS.map((step, index) => <li key={step}><span>{index + 1}</span>{step}</li>)}
            </ol>
          </div>
        </section>
      )}
    </div>
  )
}
