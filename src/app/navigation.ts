import {
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
  Home,
  MessageCircleQuestion,
  Users,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'
import type { RoleType } from '../features/auth/types'

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
}

export interface NavGroup {
  label?: string
  items: NavItem[]
  requiredRoles?: RoleType[]
}

export const navigationGroups: NavGroup[] = [
  {
    items: [{ label: '홈', path: '/home', icon: Home }],
  },
  {
    label: '업무 지원',
    items: [
      { label: 'AI 질문', path: '/rag', icon: MessageCircleQuestion },
      { label: '조직도', path: '/organization', icon: Building2 },
    ],
  },
  {
    label: '내 업무',
    items: [
      { label: '교육', path: '/me/education', icon: BookOpen },
      { label: '온보딩', path: '/me/onboarding', icon: ClipboardCheck },
      { label: '평가', path: '/me/evaluations', icon: ClipboardList },
    ],
  },
  {
    label: '팀 관리',
    requiredRoles: ['MANAGER'],
    items: [
      { label: '팀 교육 현황', path: '/manager/education', icon: Users },
      { label: '팀 평가', path: '/manager/evaluations', icon: ClipboardPenLine },
    ],
  },
  {
    label: '문서 운영',
    requiredRoles: ['HR_MANAGER', 'SYSTEM_ADMIN'],
    items: [
      { label: '문서 관리', path: '/hr/documents', icon: Files },
      { label: '문서 업로드', path: '/hr/documents/upload', icon: FileUp },
    ],
  },
  {
    label: '인사 운영',
    requiredRoles: ['HR_MANAGER'],
    items: [
      {
        label: '문서 처리 현황',
        path: '/hr/documents/processing',
        icon: FileClock,
      },
      { label: '교육 과정 관리', path: '/hr/courses', icon: GraduationCap },
      { label: '신입사원 등록', path: '/hr/new-hires', icon: UserPlus },
      { label: '온보딩 관리', path: '/hr/onboarding', icon: UserPlus },
      { label: '평가 관리', path: '/hr/evaluations', icon: CalendarCog },
    ],
  },
  {
    label: '시스템 관리',
    requiredRoles: ['SYSTEM_ADMIN'],
    items: [
      { label: '감사 로그', path: '/admin/audit', icon: FileClock },
      { label: '사용자 관리', path: '/admin/users', icon: Users },
    ],
  },
]

export function filterByRoles(
  groups: NavGroup[],
  roles: RoleType[],
): NavGroup[] {
  return groups.filter(
    (group) =>
      !group.requiredRoles ||
      group.requiredRoles.some((requiredRole) => roles.includes(requiredRole)),
  )
}
