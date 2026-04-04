import type { WorkCapacity, ProductionLine } from '../../shared/types.js'

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
