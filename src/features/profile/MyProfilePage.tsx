import { useAuth } from '../auth/AuthContext'
import { Badge, Card, EmptyState, Skeleton } from '../../shared/ui'
import styles from './MyProfilePage.module.css'

const roleLabels: Record<string, string> = {
  EMPLOYEE: '직원',
  MANAGER: '관리자',
  HR_MANAGER: '인사 담당자',
  SYSTEM_ADMIN: '시스템 관리자',
}

function formatHireDate(value: string): string {
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('ko-KR', { dateStyle: 'long' }).format(date)
}

export function MyProfilePage() {
  const { status, user } = useAuth()

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>내 프로필</h1>
        <p className={styles.description}>나의 기본 정보와 소속 정보를 확인합니다.</p>
      </header>
      {status === 'initializing' ? (
        <div className={styles.loading} role="status" aria-label="프로필을 불러오는 중">
          <Skeleton lines={5} />
        </div>
      ) : !user ? (
        <EmptyState title="프로필 정보를 확인할 수 없습니다." description="로그인 상태를 확인한 뒤 다시 시도해 주세요." />
      ) : (
        <div className={styles.sections}>
          <Card>
            <section aria-labelledby="profile-basic-heading">
              <h2 className={styles.sectionTitle} id="profile-basic-heading">기본 정보</h2>
              <dl className={styles.fields}>
                <div><dt>이름</dt><dd>{user.employeeName}</dd></div>
                <div><dt>사번</dt><dd>{user.employeeNumber}</dd></div>
                <div><dt>이메일</dt><dd>{user.email}</dd></div>
                <div><dt>입사일</dt><dd>{formatHireDate(user.hireDate)}</dd></div>
              </dl>
            </section>
          </Card>
          <Card>
            <section aria-labelledby="profile-affiliation-heading">
              <h2 className={styles.sectionTitle} id="profile-affiliation-heading">소속 정보</h2>
              <dl className={styles.fields}>
                <div><dt>부서</dt><dd>{user.departmentName}</dd></div>
                <div><dt>직급</dt><dd>{user.jobGradeName}</dd></div>
                <div><dt>직속 관리자</dt><dd>{user.managerName ?? '없음'}</dd></div>
              </dl>
            </section>
          </Card>
          <Card>
            <section aria-labelledby="profile-roles-heading">
              <h2 className={styles.sectionTitle} id="profile-roles-heading">권한 정보</h2>
              <div className={styles.roles}>
                {user.roles.map((role) => <Badge key={role}>{roleLabels[role] ?? role}</Badge>)}
              </div>
            </section>
          </Card>
        </div>
      )}
    </div>
  )
}
