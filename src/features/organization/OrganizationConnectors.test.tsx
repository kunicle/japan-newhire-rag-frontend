import { act, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'
import { OrganizationConnectors } from './OrganizationConnectors'
import { buildOrganizationChart } from './organizationChart'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers() })

it('measures after the parent ref mounts and follows ResizeObserver updates without changing relations', async () => {
  vi.useFakeTimers()
  let resize: () => void = () => {}
  const disconnect = vi.fn()
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: () => void) { resize = callback }
    observe() {}
    disconnect = disconnect
  })
  let childLeft = 100
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const id = this.getAttribute('data-employee-id')
    if (id === '1') return new DOMRect(100, 0, 120, 100)
    if (id === '2') return new DOMRect(childLeft, 140, 120, 100)
    return new DOMRect(0, 0, 500, 300)
  })
  const employees = [1, 2].map(id => ({
    employeeId: id, employeeName: String(id), employeeNumber: String(id), departmentId: 1, departmentName: '팀',
    jobGradeId: id, jobGradeName: '직급', jobGradeLevel: id, employmentStatus: 'EMPLOYED' as const, hireDate: '2024-01-01', managerEmployeeId: id === 2 ? 1 : null,
  }))
  const chart = buildOrganizationChart(employees)
  function Fixture() {
    const ref = useRef<HTMLDivElement>(null)
    return <div ref={ref}><article data-employee-id="1" /><article data-employee-id="2" />
      <OrganizationConnectors containerRef={ref} edges={chart.edges} />
    </div>
  }
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  try {
    await act(async () => { root.render(<Fixture />) })
    await act(async () => { await vi.runOnlyPendingTimersAsync() })
    expect(container.querySelector('[data-connector-id="1-2"]')?.getAttribute('d')).toMatch(/^M 160 100 .*L 160 140$/)
    childLeft = 240
    await act(async () => { resize(); await vi.runOnlyPendingTimersAsync() })
    expect(container.querySelector('[data-connector-id="1-2"]')?.getAttribute('d')).toMatch(/^M 160 100 .*L 300 140$/)
    expect(container.querySelectorAll('path')).toHaveLength(1)
  } finally {
    await act(async () => root.unmount())
    container.remove()
  }
  expect(disconnect).toHaveBeenCalledOnce()
})