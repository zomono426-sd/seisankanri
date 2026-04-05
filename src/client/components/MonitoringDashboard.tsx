import type { GameState, ProductionOrder, InventoryItem } from '../../shared/types'

interface Props {
  gameState: GameState
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    running: 'bg-green-500/20 text-green-400 border-green-500/30',
    down: 'bg-red-500/20 text-red-400 border-red-500/30',
    maintenance: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    reduced: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    planned: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    completed: 'bg-green-500/20 text-green-400 border-green-500/30',
    delayed: 'bg-red-500/20 text-red-400 border-red-500/30',
    blocked: 'bg-red-500/20 text-red-400 border-red-500/30',
  }
  const labels: Record<string, string> = {
    running: '稼働中', down: '停止', maintenance: 'メンテ中', reduced: '能力低下',
    planned: '計画', in_progress: '進行中', completed: '完了', delayed: '遅延', blocked: 'ブロック',
    normal: '通常', high: '高', urgent: '緊急',
  }
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded border ${colors[status] ?? 'bg-gray-500/20 text-gray-400'}`}>
      {labels[status] ?? status}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  if (priority === 'urgent') {
    return (
      <span className="text-xs px-1.5 py-0.5 rounded border bg-red-500/30 text-red-300 border-red-500/50 animate-pulse font-bold">
        緊急
      </span>
    )
  }
  if (priority === 'high') {
    return (
      <span className="text-xs px-1.5 py-0.5 rounded border bg-orange-500/20 text-orange-400 border-orange-500/30 font-bold">
        高
      </span>
    )
  }
  return null
}

const DAY_NAMES = ['月', '火', '水', '木', '金']

function DeadlineIndicator({ dueDay, currentDay, status }: { dueDay: number; currentDay: number; status: string }) {
  const remaining = dueDay - currentDay
  const isCompleted = status === 'completed'

  if (isCompleted) {
    return <span className="text-xs text-green-400">完了</span>
  }

  if (remaining < 0 || status === 'delayed') {
    return (
      <span className="text-xs text-red-400 font-bold animate-pulse">
        遅延 {Math.abs(remaining)}日超過
      </span>
    )
  }
  if (remaining === 0) {
    return (
      <span className="text-xs text-orange-400 font-bold">
        本日納期
      </span>
    )
  }
  return (
    <span className={`text-xs ${remaining <= 1 ? 'text-yellow-400' : 'text-factory-muted'}`}>
      残り{remaining}日
    </span>
  )
}

function DeadlineTimeline({ dueDay, currentDay }: { dueDay: number; currentDay: number }) {
  return (
    <div className="flex gap-0.5 mt-1">
      {DAY_NAMES.map((name, i) => {
        const day = i + 1
        const isDue = day === dueDay
        const isPast = day < currentDay
        const isCurrent = day === currentDay
        return (
          <div
            key={day}
            className={`flex-1 h-1.5 rounded-sm ${
              isDue ? 'bg-red-500' :
              isCurrent ? 'bg-factory-amber' :
              isPast ? 'bg-factory-border' :
              'bg-factory-border/50'
            }`}
            title={`${name}曜${isDue ? ' (納期)' : ''}${isCurrent ? ' (今日)' : ''}`}
          />
        )
      })}
    </div>
  )
}

function InventoryLink({ inventory }: { inventory: InventoryItem | undefined }) {
  if (!inventory) return null
  const isLow = inventory.free <= inventory.safetyStock
  return (
    <div className={`text-xs flex items-center gap-1 ${isLow ? 'text-red-400' : 'text-factory-muted'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isLow ? 'bg-red-500' : 'bg-green-500'}`} />
      <span className="truncate">{inventory.partName}</span>
      <span className="ml-auto whitespace-nowrap">
        空:{inventory.free}
      </span>
    </div>
  )
}

function OrderCard({
  order,
  currentDay,
  linkedInventory,
  lineStatus,
}: {
  order: ProductionOrder
  currentDay: number
  linkedInventory: InventoryItem | undefined
  lineStatus: string
}) {
  const remaining = order.dueDay - currentDay
  const isUrgent = order.priority === 'urgent'
  const isOverdue = remaining < 0 || order.status === 'delayed'
  const progressPct = order.quantity > 0 ? (order.completedQuantity / order.quantity) * 100 : 0

  const borderClass = isUrgent
    ? 'border-red-500/60 shadow-[0_0_8px_rgba(239,68,68,0.2)]'
    : isOverdue
    ? 'border-red-500/40'
    : 'border-factory-border/50'

  const bgClass = isUrgent
    ? 'bg-red-500/5'
    : isOverdue
    ? 'bg-red-500/5'
    : 'bg-factory-panel'

  return (
    <div className={`border rounded-lg p-2.5 ${borderClass} ${bgClass} ${isUrgent ? 'animate-pulse-slow' : ''}`}>
      {/* Header: orderNo + badges */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-mono font-bold text-factory-text">{order.orderNo}</span>
        <div className="flex items-center gap-1">
          <PriorityBadge priority={order.priority} />
          <StatusBadge status={order.status} />
        </div>
      </div>

      {/* Customer + Part */}
      <div className="text-xs text-factory-subtext mb-1 truncate">
        {order.customerName} — {order.partName}
      </div>

      {/* Deadline */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-factory-muted">納期: {DAY_NAMES[order.dueDay - 1]}曜</span>
          <DeadlineIndicator dueDay={order.dueDay} currentDay={currentDay} status={order.status} />
        </div>
      </div>
      <DeadlineTimeline dueDay={order.dueDay} currentDay={currentDay} />

      {/* Progress bar */}
      <div className="mt-2 mb-1.5">
        <div className="flex justify-between text-xs mb-0.5">
          <span className="text-factory-muted">進捗</span>
          <span className="text-factory-text font-mono">{order.completedQuantity}/{order.quantity}台</span>
        </div>
        <div className="h-2 bg-factory-border rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              progressPct >= 100 ? 'bg-green-500' :
              isOverdue ? 'bg-red-500' :
              'bg-factory-amber'
            }`}
            style={{ width: `${Math.min(progressPct, 100)}%` }}
          />
        </div>
      </div>

      {/* Line assignment */}
      <div className="flex items-center gap-1.5 text-xs text-factory-muted mt-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${
          lineStatus === 'running' ? 'bg-green-500' :
          lineStatus === 'down' ? 'bg-red-500' :
          lineStatus === 'maintenance' ? 'bg-yellow-500' :
          'bg-orange-500'
        }`} />
        <span>{order.line}</span>
      </div>

      {/* Inventory link */}
      {linkedInventory && (
        <div className="mt-1 pt-1 border-t border-factory-border/30">
          <InventoryLink inventory={linkedInventory} />
        </div>
      )}
    </div>
  )
}

export function MonitoringDashboard({ gameState }: Props) {
  const { productionLines, mrpState, departments, workCapacity, currentDay, suppliers } = gameState

  // Sort orders: urgent first, then by dueDay
  const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2 }
  const sortedOrders = [...mrpState.productionOrders].sort(
    (a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2) || a.dueDay - b.dueDay
  )

  // Weekly progress
  const weeklyPct = mrpState.weeklyPlanned > 0
    ? (mrpState.weeklyCompleted / mrpState.weeklyPlanned) * 100
    : 0
  const expectedPct = (currentDay / 5) * 100
  const isBehind = weeklyPct < expectedPct - 10

  // Build line status lookup
  const lineStatusMap: Record<string, string> = {}
  for (const line of productionLines) {
    lineStatusMap[line.name] = line.status
  }

  // Build inventory lookup by partNo
  const inventoryMap: Record<string, InventoryItem> = {}
  for (const item of mrpState.inventory) {
    inventoryMap[item.partNo] = item
  }

  // Count orders per line
  const ordersPerLine: Record<string, number> = {}
  for (const order of mrpState.productionOrders) {
    ordersPerLine[order.line] = (ordersPerLine[order.line] ?? 0) + 1
  }

  // Count critical inventory items
  const criticalInventory = mrpState.inventory.filter(i => i.free <= i.safetyStock)

  return (
    <div className="flex flex-col gap-2 h-full overflow-y-auto">

      {/* === Row 1: 週次生産計画ヒーロー === */}
      <div className="bg-factory-panel border border-factory-border rounded-lg p-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs text-factory-amber uppercase tracking-wider font-bold">
            週次生産計画
          </h3>
          <div className="flex items-center gap-3">
            <span className={`text-2xl font-mono font-bold ${isBehind ? 'text-red-400' : 'text-factory-amber'}`}>
              {Math.round(weeklyPct)}%
            </span>
            <span className="text-xs text-factory-muted">
              {mrpState.weeklyCompleted}/{mrpState.weeklyPlanned}台
            </span>
          </div>
        </div>

        {/* Large progress bar */}
        <div className="h-4 bg-factory-border rounded-full overflow-hidden relative mb-2">
          {/* Expected progress marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white/30 z-10"
            style={{ left: `${expectedPct}%` }}
            title={`期待進捗: ${Math.round(expectedPct)}%`}
          />
          <div
            className={`h-full rounded-full transition-all ${isBehind ? 'bg-red-500' : 'bg-factory-amber'}`}
            style={{ width: `${Math.min(weeklyPct, 100)}%` }}
          />
        </div>

        {/* Day timeline */}
        <div className="flex gap-1">
          {DAY_NAMES.map((name, i) => {
            const day = i + 1
            const isCurrent = day === currentDay
            const isPast = day < currentDay
            return (
              <div key={day} className="flex-1 text-center">
                <div className={`text-[10px] font-mono ${
                  isCurrent ? 'text-factory-amber font-bold' :
                  isPast ? 'text-factory-muted' :
                  'text-factory-muted/50'
                }`}>
                  {name}
                </div>
                <div className={`h-1 rounded-full mt-0.5 ${
                  isCurrent ? 'bg-factory-amber' :
                  isPast ? 'bg-factory-muted/50' :
                  'bg-factory-border/50'
                }`} />
              </div>
            )
          })}
        </div>
        {isBehind && (
          <div className="text-xs text-red-400 mt-1 font-bold">
            計画に対して遅延しています
          </div>
        )}
      </div>

      {/* === Row 2: 受注ボード (Hero area) === */}
      <div className="bg-factory-panel border border-factory-border rounded-lg p-3 flex-1 min-h-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs text-factory-amber uppercase tracking-wider font-bold">
            受注ボード
          </h3>
          <div className="flex items-center gap-2 text-xs text-factory-muted">
            <span>{mrpState.productionOrders.length}件</span>
            {criticalInventory.length > 0 && (
              <span className="text-red-400">在庫警告: {criticalInventory.length}品目</span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 overflow-y-auto max-h-[calc(100%-2rem)]">
          {sortedOrders.map(order => (
            <OrderCard
              key={order.orderNo}
              order={order}
              currentDay={currentDay}
              linkedInventory={inventoryMap[order.partNo]}
              lineStatus={lineStatusMap[order.line] ?? 'running'}
            />
          ))}
        </div>
      </div>

      {/* === Row 3: 製造ライン + 部門・サプライヤー === */}
      <div className="grid grid-cols-2 gap-2 flex-shrink-0">
        {/* 製造ライン稼働状況 */}
        <div className="bg-factory-panel border border-factory-border rounded-lg p-2.5">
          <h3 className="text-xs text-factory-amber uppercase tracking-wider mb-1.5 font-bold">
            製造ライン稼働状況
          </h3>
          <div className="space-y-1.5">
            {productionLines.map(line => (
              <div key={line.id} className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  line.status === 'running' ? 'bg-green-500' :
                  line.status === 'down' ? 'bg-red-500' :
                  line.status === 'maintenance' ? 'bg-yellow-500' :
                  'bg-orange-500'
                }`} />
                <span className="text-xs text-factory-text flex-shrink-0">{line.name}</span>
                <span className="text-[10px] text-factory-muted flex-shrink-0">
                  [{ordersPerLine[line.name] ?? 0}件]
                </span>
                <div className="flex-1 h-1.5 bg-factory-border rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      line.status === 'down' ? 'bg-red-500' :
                      line.currentLoad / line.capacity > 0.8 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${line.status === 'down' ? 0 : (line.currentLoad / line.capacity) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-factory-muted flex-shrink-0">
                  {line.currentLoad}/{line.capacity}
                </span>
              </div>
            ))}
          </div>
          {/* 総合能力 */}
          <div className="mt-2 pt-1.5 border-t border-factory-border flex items-center gap-2">
            <span className="text-[10px] text-factory-muted">総合能力</span>
            <div className="flex-1 h-1.5 bg-factory-border rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  workCapacity.overallCapacity < 50 ? 'bg-red-500' :
                  workCapacity.overallCapacity < 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${workCapacity.overallCapacity}%` }}
              />
            </div>
            <span className={`text-[10px] font-bold ${workCapacity.overallCapacity < 70 ? 'text-red-400' : 'text-green-400'}`}>
              {workCapacity.overallCapacity}%
            </span>
            <span className="text-[10px] text-factory-muted">
              出勤{workCapacity.presentWorkers}/{workCapacity.totalWorkers}
            </span>
          </div>
        </div>

        {/* 部門・サプライヤー */}
        <div className="bg-factory-panel border border-factory-border rounded-lg p-2.5">
          <h3 className="text-xs text-factory-amber uppercase tracking-wider mb-1.5 font-bold">
            部門状態
          </h3>
          <div className="space-y-1">
            {(['sales', 'procurement', 'manufacturing'] as const).map(dept => {
              const d = departments[dept]
              if (!d) return null
              const deptColors: Record<string, string> = {
                sales: '#0891b2',
                procurement: '#15803d',
                manufacturing: '#b45309',
              }
              return (
                <div key={dept} className="flex items-center gap-2">
                  <span className="text-xs font-medium w-8 flex-shrink-0" style={{ color: deptColors[dept] }}>
                    {d.label}
                  </span>
                  <div className="flex-1 h-1.5 bg-factory-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${d.load}%`,
                        backgroundColor: d.load > 85 ? '#ef4444' : d.load > 70 ? '#f59e0b' : '#22c55e',
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-factory-muted w-8 text-right">{d.load}%</span>
                  {d.activeIssues > 0 && (
                    <span className="text-[10px] text-red-400">{d.activeIssues}件</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* サプライヤー */}
          <div className="mt-2 pt-1.5 border-t border-factory-border">
            <h4 className="text-[10px] text-factory-amber uppercase tracking-wider mb-1 font-bold">サプライヤー</h4>
            <div className="flex flex-wrap gap-1">
              {suppliers.map(s => (
                <div
                  key={s.id}
                  className="text-[10px] px-1 py-0.5 rounded border border-factory-border/50"
                  title={`${s.name} - 好感度:${s.affinity}`}
                >
                  <span style={{ color: s.avatarColor }}>{s.name.slice(0, 4)}</span>
                  <span className="ml-0.5 text-factory-muted">
                    {s.affinity >= 70 ? '♥' : s.affinity >= 40 ? '♡' : '💔'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
