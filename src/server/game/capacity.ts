import type { WorkCapacity, ProductionLine, ProductionOrder, LineProductionPlan, InventoryItem, BomEntry } from '../../shared/types.js'

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

// --- ライン実効能力の計算 ---
function getLineEffectiveCapacity(line: ProductionLine): number {
  if (line.status === 'running') {
    return Math.floor(line.capacity * (line.assignedWorkers / line.maxWorkers))
  } else if (line.status === 'reduced') {
    return Math.floor(line.capacity * 0.5)
  }
  return 0 // down / maintenance
}

// --- 中間品の見込み生産（MTS部分） ---
// 各ラインの productionPlans に従い、BOM展開して原材料を消費しつつ中間品を生産する。
export function produceIntermediates(
  lines: ProductionLine[],
  plans: LineProductionPlan[],
  inventory: InventoryItem[],
  bom: BomEntry[]
): {
  updatedInventory: InventoryItem[]
  dailyProduced: number
  productionLog: string[]
} {
  const inv = inventory.map(item => ({ ...item }))
  let totalProduced = 0
  const log: string[] = []

  for (const plan of plans) {
    const line = lines.find(l => l.id === plan.lineId)
    if (!line) continue

    const effective = getLineEffectiveCapacity(line)
    if (effective <= 0) {
      log.push(`${line.name}: ライン停止中のため ${plan.targetPartNo} の生産なし`)
      continue
    }

    const maxProduce = Math.min(effective, plan.dailyTarget)

    // BOM展開: この中間品を作るのに必要な原材料を取得
    const childEntries = bom.filter(b => b.parentPartNo === plan.targetPartNo)

    let canProduce = maxProduce

    if (childEntries.length > 0) {
      // 原材料制約チェック: 足りる分だけ生産
      for (const entry of childEntries) {
        const material = inv.find(i => i.partNo === entry.childPartNo)
        if (!material) {
          canProduce = 0
          break
        }
        const availableForProduction = Math.floor(material.free / entry.quantityPer)
        canProduce = Math.min(canProduce, availableForProduction)
      }
    }
    // childEntries.length === 0 の場合（WF-FRAME-Aなど）は原材料チェックをスキップ

    if (canProduce <= 0) {
      log.push(`${line.name}: 原材料欠品により ${plan.targetPartNo} の生産停止`)
      continue
    }

    // 原材料を消費
    for (const entry of childEntries) {
      const material = inv.find(i => i.partNo === entry.childPartNo)!
      const consumed = entry.quantityPer * canProduce
      material.onHand -= consumed
      material.free -= consumed
    }

    // 中間品を生産
    const intermediate = inv.find(i => i.partNo === plan.targetPartNo)
    if (intermediate) {
      intermediate.onHand += canProduce
      intermediate.free += canProduce
    }

    totalProduced += canProduce

    const consumptionDetail = childEntries
      .map(e => `${e.childPartNo} x${e.quantityPer * canProduce}消費`)
      .join('、')
    const detail = consumptionDetail ? `（${consumptionDetail}）` : '（原材料不要）'
    log.push(`${line.name}: ${plan.targetPartNo} x${canProduce}台生産${detail}`)
  }

  return { updatedInventory: inv, dailyProduced: totalProduced, productionLog: log }
}

// --- BOM展開による部品充足チェック ---
export function checkPartsAvailability(
  order: ProductionOrder,
  inventory: InventoryItem[],
  bom: BomEntry[]
): {
  allAvailable: boolean
  missingParts: Array<{ partNo: string; partName: string; required: number; available: number }>
} {
  const bomEntries = bom.filter(b => b.parentPartNo === order.partNo)
  const missingParts: Array<{ partNo: string; partName: string; required: number; available: number }> = []
  let allAvailable = true

  for (const entry of bomEntries) {
    const required = entry.quantityPer * order.quantity
    const item = inventory.find(i => i.partNo === entry.childPartNo)
    const available = item?.free ?? 0

    if (available < required) {
      allAvailable = false
      missingParts.push({
        partNo: entry.childPartNo,
        partName: item?.partName ?? entry.childPartNo,
        required,
        available,
      })
    }
  }

  return { allAvailable, missingParts }
}

// --- 受注組立開始（ATO部分） ---
// BOM展開して中間品/原材料が揃っていれば消費して組立開始。足りなければ waiting_parts。
export function startAssembly(
  order: ProductionOrder,
  inventory: InventoryItem[],
  bom: BomEntry[],
  currentWeek: number,
  currentDay: number
): {
  updatedOrder: ProductionOrder
  updatedInventory: InventoryItem[]
  success: boolean
  missingParts: Array<{ partNo: string; partName: string; required: number; available: number }>
} {
  const { allAvailable, missingParts } = checkPartsAvailability(order, inventory, bom)

  if (!allAvailable) {
    return {
      updatedOrder: { ...order, status: 'waiting_parts' },
      updatedInventory: inventory,
      success: false,
      missingParts,
    }
  }

  // 全部品揃い → 在庫を消費して組立開始
  const inv = inventory.map(item => ({ ...item }))
  const bomEntries = bom.filter(b => b.parentPartNo === order.partNo)

  for (const entry of bomEntries) {
    const item = inv.find(i => i.partNo === entry.childPartNo)!
    const consumed = entry.quantityPer * order.quantity
    item.onHand -= consumed
    item.free -= consumed
    item.allocated += consumed
  }

  // リードタイム計算
  const leadTime = order.productionLeadTimeDays ?? 2
  const absoluteStart = (currentWeek - 1) * 5 + currentDay
  const absoluteEnd = absoluteStart + leadTime
  const endWeek = Math.floor((absoluteEnd - 1) / 5) + 1
  const endDay = ((absoluteEnd - 1) % 5) + 1

  return {
    updatedOrder: {
      ...order,
      allocatedQuantity: order.quantity,
      status: 'producing',
      productionStartWeek: currentWeek,
      productionStartDay: currentDay,
      productionEndWeek: endWeek,
      productionEndDay: endDay,
    },
    updatedInventory: inv,
    success: true,
    missingParts: [],
  }
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
