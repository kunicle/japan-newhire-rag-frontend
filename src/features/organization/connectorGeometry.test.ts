import { describe, expect, it } from 'vitest'
import { buildConnectorRoutes, type ConnectorBox } from './connectorGeometry'

const box = (x: number, y: number, width = 120, height = 100): ConnectorBox =>
  ({ left: x, top: y, right: x + width, bottom: y + height })

describe('measured connector geometry', () => {
  it.each([1, 2, 3])('connects exact centers for %i direct reports with a common junction', count => {
    const parent = box(200.25, 0)
    const children = Array.from({ length: count }, (_, i) => box(20.5 + i * 150, 140))
    const links = children.map((child, i) => ({ id: String(i), from: parent, to: child }))
    const paths = buildConnectorRoutes(links, [parent, ...children], 600, 400)
    expect(paths).toHaveLength(count)
    paths.forEach((path, i) => {
      expect(path.points[0]).toEqual({ x: 260.25, y: 100 })
      expect(path.points.at(-1)).toEqual({ x: children[i].left + 60, y: 140 })
      expect(path.points).toContainEqual({ x: 260.25, y: 120 })
    })
  })

  it('routes wrapped rows without crossing any employee card', () => {
    const parent = box(170, 0)
    const children = [box(20, 140), box(170, 140), box(320, 140), box(20, 270), box(170, 270)]
    const boxes = [parent, ...children]
    const paths = buildConnectorRoutes(children.map((to, i) => ({ id: String(i), from: parent, to })), boxes, 500, 400)
    expect(paths).toHaveLength(5)
    for (const path of paths) {
      for (let i = 1; i < path.points.length; i++) {
        const a = path.points[i - 1], b = path.points[i]
        expect(a.x === b.x || a.y === b.y).toBe(true)
        for (const card of boxes) {
          const crosses = a.x === b.x
            ? a.x > card.left && a.x < card.right && Math.max(a.y, b.y) > card.top && Math.min(a.y, b.y) < card.bottom
            : a.y > card.top && a.y < card.bottom && Math.max(a.x, b.x) > card.left && Math.min(a.x, b.x) < card.right
          expect(crosses).toBe(false)
        }
      }
    }
  })

  it('preserves a three-level chain and creates no lines for independent roots', () => {
    const cards = [box(100, 0), box(100, 140), box(100, 280), box(350, 0)]
    const paths = buildConnectorRoutes([
      { id: '1-2', from: cards[0], to: cards[1] },
      { id: '2-3', from: cards[1], to: cards[2] },
    ], cards, 500, 420)
    expect(paths.map(path => path.id)).toEqual(['1-2', '2-3'])
    expect(paths[1].points[0]).toEqual({ x: 160, y: 240 })
    expect(paths[1].points.at(-1)).toEqual({ x: 160, y: 280 })
  })
})