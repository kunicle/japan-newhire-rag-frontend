import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage } from '../features/auth/LoginPage'
import { RagPage } from '../features/rag/RagPage'
import { AccessDeniedPage } from '../pages/AccessDeniedPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { PlaceholderPage } from '../pages/PlaceholderPage'
import { AppShell } from './AppShell'
import { GuestRoute } from './GuestRoute'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleRoute } from './RoleRoute'

const commonPlaceholderRoutes = [
  { path: 'home', title: '홈', description: '업무 현황과 주요 안내를 한곳에서 확인할 수 있도록 준비하고 있습니다.' },
  { path: 'notifications', title: '알림', description: '새로운 알림과 확인할 소식을 확인하는 기능을 준비하고 있습니다.' },
  { path: 'me/onboarding', title: '온보딩', description: '입사 후 필요한 절차와 진행 상황을 확인하는 기능을 준비하고 있습니다.' },
  { path: 'me/education', title: '교육', description: '배정된 교육 과정과 학습 현황을 확인하는 기능을 준비하고 있습니다.' },
  { path: 'me/evaluations', title: '평가', description: '평가 일정과 제출 항목을 관리하는 기능을 준비하고 있습니다.' },
]

const managerPlaceholderRoutes = [
  { path: 'manager/education', title: '팀 교육', description: '팀원의 교육 진행 상황을 확인하는 기능을 준비하고 있습니다.' },
  { path: 'manager/evaluations', title: '팀 평가', description: '팀원 평가를 검토하고 관리하는 기능을 준비하고 있습니다.' },
]

const hrPlaceholderRoutes = [
  { path: 'hr/documents/upload', title: '문서 업로드', description: '사내 지식 문서를 안전하게 등록하는 기능을 준비하고 있습니다.' },
  { path: 'hr/documents/processing', title: '문서 처리 현황', description: '업로드한 문서의 처리 상태를 확인하는 기능을 준비하고 있습니다.' },
  { path: 'hr/courses', title: '교육 과정', description: '교육 과정을 만들고 운영하는 기능을 준비하고 있습니다.' },
  { path: 'hr/onboarding', title: '온보딩 관리', description: '신입 구성원의 온보딩 절차를 관리하는 기능을 준비하고 있습니다.' },
  { path: 'hr/evaluations', title: '평가 관리', description: '평가 항목과 일정을 운영하는 기능을 준비하고 있습니다.' },
  { path: 'hr/organization', title: '조직 관리', description: '조직 구조와 구성원 정보를 관리하는 기능을 준비하고 있습니다.' },
]

const adminPlaceholderRoutes = [
  { path: 'admin/users', title: '사용자 관리', description: '사용자 계정과 역할을 관리하는 기능을 준비하고 있습니다.' },
  { path: 'admin/audit', title: '감사 로그', description: '주요 시스템 활동 기록을 확인하는 기능을 준비하고 있습니다.' },
]

function mapPlaceholderRoutes(
  routes: Array<{ path: string; title: string; description: string }>,
) {
  return routes.map(({ path, title, description }) => ({
    path,
    element: <PlaceholderPage title={title} description={description} />,
  }))
}

export const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [{ path: 'login', element: <LoginPage /> }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/home" replace /> },
          ...mapPlaceholderRoutes(commonPlaceholderRoutes),
          { path: 'rag', element: <RagPage /> },
          {
            element: <RoleRoute allow={['MANAGER']} />,
            children: mapPlaceholderRoutes(managerPlaceholderRoutes),
          },
          {
            element: <RoleRoute allow={['HR_MANAGER']} />,
            children: mapPlaceholderRoutes(hrPlaceholderRoutes),
          },
          {
            element: <RoleRoute allow={['SYSTEM_ADMIN']} />,
            children: mapPlaceholderRoutes(adminPlaceholderRoutes),
          },
          { path: 'access-denied', element: <AccessDeniedPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
