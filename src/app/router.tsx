import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage } from '../features/auth/LoginPage'
import { HomePage } from '../features/home/HomePage'
import { DocumentUploadPage } from '../features/documents/DocumentUploadPage'
import { DocumentProcessingPage } from '../features/documents/DocumentProcessingPage'
import { DocumentManagementPage } from '../features/documents/DocumentManagementPage'
import { DocumentManagementDetailPage } from '../features/documents/DocumentManagementDetailPage'
import { MyEducationDetailPage } from '../features/education/MyEducationDetailPage'
import { MyEducationPage } from '../features/education/MyEducationPage'
import { ManagerEducationPage } from '../features/education/ManagerEducationPage'
import { ManagerEmployeeEducationPage } from '../features/education/ManagerEmployeeEducationPage'
import { NotificationsPage } from '../features/notifications/NotificationsPage'
import { RagPage } from '../features/rag/RagPage'
import { AccessDeniedPage } from '../pages/AccessDeniedPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { PlaceholderPage } from '../pages/PlaceholderPage'
import { AppShell } from './AppShell'
import { GuestRoute } from './GuestRoute'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleRoute } from './RoleRoute'

const commonPlaceholderRoutes = [
  { path: 'me/onboarding', title: '온보딩', description: '입사 후 필요한 절차와 진행 상황을 확인하는 기능을 준비하고 있습니다.' },
  { path: 'me/evaluations', title: '평가', description: '평가 일정과 제출 항목을 관리하는 기능을 준비하고 있습니다.' },
]

const managerPlaceholderRoutes = [
  { path: 'manager/evaluations', title: '팀 평가', description: '팀원 평가를 검토하고 관리하는 기능을 준비하고 있습니다.' },
]

const hrPlaceholderRoutes = [
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
          { path: 'home', element: <HomePage /> },
          ...mapPlaceholderRoutes(commonPlaceholderRoutes),
          { path: 'me/education', element: <MyEducationPage /> },
          { path: 'me/education/:enrollmentId', element: <MyEducationDetailPage /> },
          { path: 'rag', element: <RagPage /> },
          { path: 'notifications', element: <NotificationsPage /> },
          {
            element: <RoleRoute allow={['HR_MANAGER', 'SYSTEM_ADMIN']} />,
            children: [
              { path: 'hr/documents', element: <DocumentManagementPage /> },
              { path: 'hr/documents/:documentId', element: <DocumentManagementDetailPage /> },
              { path: 'hr/documents/upload', element: <DocumentUploadPage /> },
            ],
          },
          {
            element: <RoleRoute allow={['MANAGER']} />,
            children: [
              { path: 'manager/education', element: <ManagerEducationPage /> },
              { path: 'manager/education/:employeeId', element: <ManagerEmployeeEducationPage /> },
              ...mapPlaceholderRoutes(managerPlaceholderRoutes),
            ],
          },
          {
            element: <RoleRoute allow={['HR_MANAGER']} />,
            children: [
              { path: 'hr/documents/processing', element: <DocumentProcessingPage /> },
              ...mapPlaceholderRoutes(hrPlaceholderRoutes),
            ],
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
