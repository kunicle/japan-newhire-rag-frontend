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
import { HrCourseCreatePage } from '../features/education/HrCourseCreatePage'
import { HrCourseDetailPage } from '../features/education/HrCourseDetailPage'
import { HrCourseListPage } from '../features/education/HrCourseListPage'
import { MyEvaluationDetailPage } from '../features/evaluation/MyEvaluationDetailPage'
import { MyEvaluationListPage } from '../features/evaluation/MyEvaluationListPage'
import { ManagerEvaluationDetailPage } from '../features/evaluation/ManagerEvaluationDetailPage'
import { ManagerEvaluationListPage } from '../features/evaluation/ManagerEvaluationListPage'
import { HrEvaluationCycleCreatePage } from '../features/evaluation/HrEvaluationCycleCreatePage'
import { HrEvaluationCycleDetailPage } from '../features/evaluation/HrEvaluationCycleDetailPage'
import { NotificationsPage } from '../features/notifications/NotificationsPage'
import { MyOnboardingPage } from '../features/onboarding/MyOnboardingPage'
import { HrOnboardingPage } from '../features/onboarding/HrOnboardingPage'
import { RagPage } from '../features/rag/RagPage'
import { AccessDeniedPage } from '../pages/AccessDeniedPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { PlaceholderPage } from '../pages/PlaceholderPage'
import { AppShell } from './AppShell'
import { GuestRoute } from './GuestRoute'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleRoute } from './RoleRoute'

const hrPlaceholderRoutes = [
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
          { path: 'me/education', element: <MyEducationPage /> },
          { path: 'me/education/:enrollmentId', element: <MyEducationDetailPage /> },
          { path: 'me/onboarding', element: <MyOnboardingPage /> },
          { path: 'me/evaluations', element: <MyEvaluationListPage /> },
          { path: 'me/evaluations/:evaluationId', element: <MyEvaluationDetailPage /> },
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
              { path: 'manager/evaluations', element: <ManagerEvaluationListPage /> },
              { path: 'manager/evaluations/:evaluationId', element: <ManagerEvaluationDetailPage /> },
            ],
          },
          {
            element: <RoleRoute allow={['HR_MANAGER']} />,
            children: [
              { path: 'hr/documents/processing', element: <DocumentProcessingPage /> },
              { path: 'hr/courses', element: <HrCourseListPage /> },
              { path: 'hr/courses/new', element: <HrCourseCreatePage /> },
              { path: 'hr/courses/:courseId', element: <HrCourseDetailPage /> },
              { path: 'hr/onboarding', element: <HrOnboardingPage /> },
              { path: 'hr/evaluations', element: <HrEvaluationCycleCreatePage /> },
              { path: 'hr/evaluations/:cycleId', element: <HrEvaluationCycleDetailPage /> },
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
