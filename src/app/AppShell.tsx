import { useCallback, useMemo, useRef, useState, type MouseEvent } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from '../shared/layout/Header/Header'
import { BottomNav } from '../shared/layout/MobileNav/BottomNav'
import { NavDrawer } from '../shared/layout/MobileNav/NavDrawer'
import { Sidebar } from '../shared/layout/Sidebar/Sidebar'
import { navigationGroups } from './navigation'
import styles from './AppShell.module.css'

export function AppShell() {
  const { pathname } = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const drawerTriggerRef = useRef<HTMLButtonElement>(null)

  const pageTitle = useMemo(() => {
    const currentItem = navigationGroups
      .flatMap((group) => group.items)
      .find((item) => item.path === pathname)
    return currentItem?.label ?? '주식회사 SLDK 업무 포털'
  }, [pathname])

  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  function toggleDrawer(event: MouseEvent<HTMLButtonElement>) {
    drawerTriggerRef.current = event.currentTarget
    setDrawerOpen((currentOpen) => !currentOpen)
  }

  return (
    <div className={styles.shell}>
      <div className={styles.desktopSidebar}>
        <Sidebar />
      </div>
      <div className={styles.workspace}>
        <Header
          title={pageTitle}
          drawerOpen={drawerOpen}
          onMenuToggle={toggleDrawer}
        />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
      <BottomNav drawerOpen={drawerOpen} onMoreClick={toggleDrawer} />
      <NavDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        returnFocusRef={drawerTriggerRef}
      />
    </div>
  )
}
