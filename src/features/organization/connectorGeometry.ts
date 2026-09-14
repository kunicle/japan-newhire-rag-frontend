export interface Point { x: number; y: number }
export interface ConnectorBox { left: number; right: number; top: number; bottom: number }
export interface ConnectorRoute { id: string; points: Point[] }
export interface ConnectorLink { id: string; from: ConnectorBox; to: ConnectorBox }
const clearance = 4

function blocked(a: Point, b: Point, boxes: ConnectorBox[]): boolean {
  return boxes.some(box => a.x === b.x
    ? a.x > box.left && a.x < box.right && Math.max(a.y, b.y) > box.top && Math.min(a.y, b.y) < box.bottom
    : a.y > box.top && a.y < box.bottom && Math.max(a.x, b.x) > box.left && Math.min(a.x, b.x) < box.right)
}

// Route in measured whitespace, rather than drawing through cards on wrapped rows.
function route(start: Point, end: Point, boxes: ConnectorBox[], width: number, height: number): Point[] {
  const xs = [...new Set([start.x, end.x, ...boxes.flatMap(box => [Math.max(0, box.left - clearance), Math.min(width, box.right + clearance)])])].sort((a, b) => a - b)
  const ys = [...new Set([start.y, end.y, ...boxes.flatMap(box => [Math.max(0, box.top - clearance), Math.min(height, box.bottom + clearance)])])].sort((a, b) => a - b)
  const key = (x: number, y: number) => y * xs.length + x
  const point = (id: number) => ({ x: xs[id % xs.length], y: ys[Math.floor(id / xs.length)] })
  const first = key(xs.indexOf(start.x), ys.indexOf(start.y))
  const last = key(xs.indexOf(end.x), ys.indexOf(end.y))
  const distance = new Map<number, number>([[first, 0]])
  const previous = new Map<number, number>()
  const open = new Set([first])
  const heuristic = (id: number) => Math.abs(point(id).x - end.x) + Math.abs(point(id).y - end.y)
  while (open.size) {
    let current = -1
    let score = Infinity
    for (const id of open) {
      const value = distance.get(id)! + heuristic(id)
      if (value < score) { current = id; score = value }
    }
    if (current === last) {
      const result = [point(last)]
      while (previous.has(current)) { current = previous.get(current)!; result.push(point(current)) }
      return result.reverse()
    }
    open.delete(current)
    const x = current % xs.length, y = Math.floor(current / xs.length)
    for (const [nx, ny] of [[x, y + 1], [x - 1, y], [x + 1, y], [x, y - 1]]) {
      if (nx < 0 || ny < 0 || nx >= xs.length || ny >= ys.length) continue
      const next = key(nx, ny), a = point(current), b = point(next)
      if (blocked(a, b, boxes)) continue
      const cost = distance.get(current)! + Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
      if (cost < (distance.get(next) ?? Infinity)) {
        distance.set(next, cost); previous.set(next, current); open.add(next)
      }
    }
  }
  return []
}

export function buildConnectorRoutes(links: ConnectorLink[], boxes: ConnectorBox[], width: number, height: number): ConnectorRoute[] {
  return links.flatMap(link => {
    const start = { x: (link.from.left + link.from.right) / 2, y: link.from.bottom }
    const end = { x: (link.to.left + link.to.right) / 2, y: link.to.top }
    if (link.from.bottom <= link.from.top || link.to.bottom <= link.to.top) return []
    const siblings = links.filter(other => other.from === link.from)
    const rowTop = Math.min(...siblings.map(other => other.to.top))
    const junction = { x: start.x, y: rowTop > start.y ? (start.y + rowTop) / 2 : start.y + clearance }
    const startPort = { x: start.x, y: start.y + clearance }
    const endPort = { x: end.x, y: end.y - clearance }
    const first = route(startPort, junction, boxes, width, height)
    const second = first.length ? route(junction, endPort, boxes, width, height) : []
    const middle = second.length ? [...first, ...second.slice(1)] : route(startPort, endPort, boxes, width, height)
    if (!middle.length) return []
    const points = [start, ...middle, end].filter((p, index, all) => index === 0 || p.x !== all[index - 1].x || p.y !== all[index - 1].y)
    return [{ id: link.id, points }]
  })
}

export function connectorPath(points: Point[]): string {
  return points.map((point, index) => (index ? 'L ' : 'M ') + point.x + ' ' + point.y).join(' ')
}