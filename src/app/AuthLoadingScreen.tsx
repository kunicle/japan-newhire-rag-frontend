import { Spinner } from '../shared/ui'
import styles from './AuthLoadingScreen.module.css'

export function AuthLoadingScreen() {
  return (
    <div className={styles.screen}>
      <Spinner
        size="md"
        label="로그인 상태를 확인하고 있습니다"
        decorative={false}
      />
    </div>
  )
}
