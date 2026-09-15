import { useEffect, useState, type RefObject } from 'react'
import type { ChartEdge } from './organizationChart'
import { buildConnectorRoutes, connectorPath, type ConnectorBox, type ConnectorLink, type ConnectorRoute } from './connectorGeometry'
import styles from './OrganizationPage.module.css'

export function OrganizationConnectors({ containerRef, edges }: {
  containerRef: RefObject<HTMLDivElement | null>
  edges: ChartEdge[]
}) {
  const [routes, setRoutes] = useState<ConnectorRoute[]>([])
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let timer = 0
    let active = true
    const measure = () => {
      if (!active) return
      const origin = container.getBoundingClientRect()
      const box = (element: Element): ConnectorBox => {
        const rect = element.getBoundingClientRect()
        return { left: rect.left - origin.left, right: rect.right - origin.left, top: rect.top - origin.top, bottom: rect.bottom - origin.top }
      }
      const elements = [...container.querySelectorAll<HTMLElement>('[data-employee-id]')]
      const cards = new Map(elements.map(element => [Number(element.dataset.employeeId), { element, box: box(element) }]))
      const headers = new Map([...container.querySelectorAll<HTMLElement>('[data-team-id]')].map(panel => [Number(panel.dataset.teamId), box(panel.querySelector('header')!)]))
      const links: ConnectorLink[] = []
      const usedHeaders = new Set<string>()
      for (const edge of edges) {
        const from = cards.get(edge.from.employee.employeeId), to = cards.get(edge.to.employee.employeeId)
        if (!from || !to) continue
        const id = edge.from.employee.employeeId + '-' + edge.to.employee.employeeId
        const header = headers.get(edge.to.employee.departmentId)
        if (header && from.element.closest('[aria-label="본부 상단 관리자"]') && !to.element.closest('[aria-label="본부 상단 관리자"]')) {
          const headerId = edge.from.employee.employeeId + '-team-' + edge.to.employee.departmentId
          if (!usedHeaders.has(headerId)) { links.push({ id: headerId, from: from.box, to: header }); usedHeaders.add(headerId) }
          links.push({ id, from: header, to: to.box })
        } else links.push({ id, from: from.box, to: to.box })
      }
      const next = buildConnectorRoutes(links, [...cards.values()].map(card => card.box).concat([...headers.values()]), origin.width, origin.height)
      setRoutes(current => JSON.stringify(current) === JSON.stringify(next) ? current : next)
    }
    const schedule = () => { if (!active) return; clearTimeout(timer); timer = window.setTimeout(measure, 0) }
    const observer = new ResizeObserver(schedule)
    observer.observe(container)
    container.querySelectorAll('[data-employee-id], [data-team-id], ul').forEach(element => observer.observe(element))
    window.addEventListener('resize', schedule)
    void document.fonts?.ready.then(schedule)
    schedule()
    return () => { active = false; clearTimeout(timer); observer.disconnect(); window.removeEventListener('resize', schedule) }
  }, [containerRef, edges])
  return <svg className={styles.measuredConnectors} aria-hidden="true">
    {routes.map(route => <path key={route.id} data-connector-id={route.id} d={connectorPath(route.points)} />)}
  </svg>
}