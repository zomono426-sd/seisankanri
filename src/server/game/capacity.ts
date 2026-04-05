import type { WorkCapacity, ProductionLine, ProductionOrder } from '../../shared/types.js'

// ============================================================
// 作業能力システム — 設備故障・人員欠勤の影響管理
// ============================================================

// --- 初期作業能力 ---
export const INITIAL_CAPACITY: WorkCapacity = {
  totalWorkers: 24,
  presentWorkers: 24,
  equipmentTotal: 6,        // 3ライン × 2設備
  equipmentOperational: 6,
  overallCapacity: 100,
}

// --- 初期製造ライン ---
export const INITIAL_PRODUCTION_LINES: ProductionLine[] = [
  {
    id: 'line1',
    name: '第1組立ライン',
    capacity: 5,           // 5台/日
    currentLoad: 4,
    status: 'running',
    assignedWorkers: 8,
    maxWorkers: 10,
  },
  {
    id: 'line2',
    name: '第2組立ライン',
    capacity: 5,
    currentLoad: 3,
    status: 'running',
    assignedWorkers: 8,
    maxWorkers: 10,
  },
  {
    id: 'weld',
    name: '溶接ライン',
    capacity: 4,
    currentLoad: 3,
    status: 'running',
    assignedWorkers: 6,
    maxWorkers: 8,
  },
]

// 能力の再計算
export function recalculateCapacity(
  lines: ProductionLine[],
  capacity: WorkCapacity
): WorkCapacity {
  const totalCapacity = lines.reduce((sum, l) => sum + l.capacity, 0)
  const effectiveCapacity = lines.reduce((sum, l) => {
    if (l.status === 'down') return sum
    if (l.status === 'maintenance') return sum
    if (l.status === 'reduced') return sum + l.capacity * 0.5
    // workerペナルティ
    const workerRatio = l.assignedWorkers / l.maxWorkers
    return sum + l.capacity * Math.min(1, workerRatio)
  }, 0)

  const equipmentRatio = capacity.equipmentOperational / capacity.equipmentTotal
  const workerRatio = capacity.presentWorkers / capacity.totalWorkers

  return {
    ...capacity,
    overallCapacity: Math.round(
      (effectiveCapacity / totalCapacity) * equipmentRatio * workerRatio * 100
    ),
  }
}

// 設備故障を適用
export function applyEquipmentBreakdown(
  lines: ProductionLine[],
  lineId: string
): ProductionLine[] {
  return lines.map(l =>
    l.id === lineId ? { ...l, status: 'down' as const } : l
  )
}

// 設備修理
export function repairEquipment(
  lines: ProductionLine[],
  lineId: string
): ProductionLine[] {
  return lines.map(l =>
    l.id === lineId ? { ...l, status: 'running' as const } : l
  )
}

// 人員欠勤を適用
export function applyWorkerAbsence(
  capacity: WorkCapacity,
  absentCount: number
): WorkCapacity {
  return {
    ...capacity,
    presentWorkers: Math.max(0, capacity.presentWorkers - absentCount),
  }
}

// 人員をライン間で移動
export function reassignWorkers(
  lines: ProductionLine[],
  fromLineId: string,
  toLineId: string,
  count: number
): ProductionLine[] {
  return lines.map(l => {
    if (l.id === fromLineId) {
      return { ...l, assignedWorkers: Math.max(0, l.assignedWorkers - count) }
    }
    if (l.id === toLineId) {
      return { ...l, assignedWorkers: Math.min(l.maxWorkers, l.assignedWorkers + count) }
    }
    return l
  })
}

// ラインステータスを「低下」に設定
export function reduceLineCapacity(
  lines: ProductionLine[],
  lineId: string
): ProductionLine[] {
  return lines.map(l =>
    l.id === lineId ? { ...l, status: 'reduced' as const } : l
  )
}

// --- 生産: ラインの日産能力をラインストックに蓄積 ---
export function produceLineStock(
  lines: ProductionLine[],
  currentStock: Record<string, number>
): { updatedStock: Record<string, number>; dailyProduced: number } {
  const stock = { ...currentStock }
  let totalProduced = 0
  for (const line of lines) {
    let effective = 0
    if (line.status === 'running') {
      effective = Math.floor(line.capacity * (line.assignedWorkers / line.maxWorkers))
    } else if (line.status === 'reduced') {
      effective = Math.floor(line.capacity * 0.5)
    }
    // down / maintenance → 0
    if (effective > 0) {
      stock[line.name] = (stock[line.name] ?? 0) + effective
      totalProduced += effective
    }
  }
  return { updatedStock: stock, dailyProduced: totalProduced }
}

// --- 手動引当: ユーザーがラインストックを受注に割り当て（ATO: 受注組立生産） ---
// 引当は即完了ではなく、全数引当完了時点から製造リードタイムが開始する。
// リードタイム経過後に timeAdvanceNode で completedQuantity が反映される。
export function allocateToOrder(
  orders: ProductionOrder[],
  lineStock: Record<string, number>,
  orderNo: string,
  quantity: number,
  currentWeek: number,
  currentDay: number
): { updatedOrders: ProductionOrder[]; updatedStock: Record<string, number>; allocatedQuantity: number } {
  const order = orders.find(o => o.orderNo === orderNo)
  if (!order) throw new Error('Order not found')

  const available = lineStock[order.line] ?? 0
  const remaining = order.quantity - (order.allocatedQuantity ?? 0)
  const actual = Math.min(quantity, available, remaining)
  if (actual <= 0) throw new Error('No stock available or order already fully allocated')

  const updatedOrders = orders.map(o => {
    if (o.orderNo !== orderNo) return o
    const newAllocated = (o.allocatedQuantity ?? 0) + actual
    const fullyAllocated = newAllocated >= o.quantity

    if (fullyAllocated) {
      // 全数引当完了 → 生産開始、リードタイムのカウント開始
      const leadTime = o.productionLeadTimeDays ?? 2
      const absoluteStart = (currentWeek - 1) * 5 + currentDay
      const absoluteEnd = absoluteStart + leadTime
      const endWeek = Math.floor((absoluteEnd - 1) / 5) + 1
      const endDay = ((absoluteEnd - 1) % 5) + 1

      return {
        ...o,
        allocatedQuantity: newAllocated,
        status: 'producing' as const,
        productionStartWeek: currentWeek,
        productionStartDay: currentDay,
        productionEndWeek: endWeek,
        productionEndDay: endDay,
      }
    }

    // 部分引当: まだ全数揃っていない
    return {
      ...o,
      allocatedQuantity: newAllocated,
      status: 'in_progress' as const,
    }
  })

  const updatedStockMap = {
    ...lineStock,
    [order.line]: available - actual,
  }
  return { updatedOrders, updatedStock: updatedStockMap, allocatedQuantity: actual }
}

// 日次のリセット（翌日になったら欠勤リセット等は行わない — 継続影響）
export function dailyCapacityUpdate(
  lines: ProductionLine[],
  capacity: WorkCapacity
): { lines: ProductionLine[]; capacity: WorkCapacity } {
  // maintenance中のラインを復旧チェック（簡易: 翌日に復旧）
  const updatedLines = lines.map(l =>
    l.status === 'maintenance' ? { ...l, status: 'running' as const } : l
  )
  return { lines: updatedLines, capacity }
}
