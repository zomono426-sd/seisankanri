import type { GameState, ProductionOrder, LineProductionPlan } from '../../shared/types'
import { InventoryTransition } from './InventoryTransition'

interface Props {
  gameState: GameState
  onStartAssembly: (orderNo: string) => void
  onUpdateProductionPlan: (plans: LineProductionPlan[]) => void
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    running: 'bg-green-500/20 text-green-400 border-green-500/30',
    down: 'bg-red-500/20 text-red-400 border-red-500/30',
    maintenance: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    reduced: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    planned: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    waiting_parts: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    producing: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    completed: 'bg-green-500/20 text-green-400 border-green-500/30',
    delayed: 'bg-red-500/20 text-red-400 border-red-500/30',
    blocked: 'bg-red-500/20 text-red-400 border-red-500/30',
  }
  const labels: Record<string, string> = {
    running: '稼働中', down: '停止', maintenance: 'メンテ中', reduced: '能力低下',
    planned: '計画', waiting_parts: '部品待ち', in_progress: '引当中',
    producing: '組立中', completed: '完了', delayed: '遅延', blocked: 'ブロック',
  }
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded border ${colors[status] ?? 'bg-gray-500/20 text-gray-400'}`}>
      {labels[status] ?? status}
    </span>
  )
}

const DAY_NAMES = ['月', '火', '水', '木', '金']

function toAbsoluteDay(week: number, day: number): number {
  return (week - 1) * 5 + day
}

export function MonitoringDashboard({ gameState, onStartAssembly, onUpdateProductionPlan }: Props) {
  const { productionLines, mrpState, departments, workCapacity, currentDay, currentWeek, suppliers } = gameState

  const intermediates = mrpState.inventory.filter(i => i.itemType === 'intermediate')
  const rawMaterials = mrpState.inventory.filter(i => i.itemType === 'rawMaterial')

  // Sort orders: urgent first, then by absolute due date
  const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2 }
  const sortedOrders = [...mrpState.productionOrders].sort(
    (a, b) =>
      (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2) ||
      toAbsoluteDay(a.dueWeek, a.dueDay) - toAbsoluteDay(b.dueWeek, b.dueDay)
  )

  const totalIntermediateStock = intermediates.reduce((s, i) => s + i.onHand, 0)

  return (
    <div className="flex flex-col gap-2 h-full overflow-y-auto">

      {/* ATOフロー概要 */}
      <div className="bg-factory-panel border border-factory-border rounded-lg p-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs text-factory-amber uppercase tracking-wider font-bold">
            ATO生産フロー
          </h3>
          <div className="text-xs text-factory-muted">
            W{currentWeek} {DAY_NAMES[currentDay - 1]}曜
          </div>
        </div>
        <div className="flex items-center justify-center gap-1 text-[10px] text-factory-muted mb-3">
          <span className="text-cyan-400">原材料</span>
          <span>→</span>
          <span className="text-green-400">中間品生産(見込)</span>
          <span>→</span>
          <span className="text-blue-400">中間品在庫</span>
          <span>→</span>
          <span className="text-purple-400">受注組立(ATO)</span>
          <span>→</span>
          <span className="text-factory-amber">完成・出荷</span>
        </div>

        {/* KPIカード */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="bg-factory-bg/50 rounded p-2 text-center">
            <div className="text-[10px] text-factory-muted mb-0.5">受注計画</div>
            <div className="text-lg font-mono font-bold text-factory-text">{mrpState.weeklyPlanned}</div>
            <div className="text-[10px] text-factory-muted">台</div>
          </div>
          <div className="bg-factory-bg/50 rounded p-2 text-center">
            <div className="text-[10px] text-green-400 mb-0.5">完成済み</div>
            <div className="text-lg font-mono font-bold text-green-400">{mrpState.weeklyCompleted}</div>
            <div className="text-[10px] text-factory-muted">台</div>
          </div>
          <div className="bg-factory-bg/50 rounded p-2 text-center">
            <div className="text-[10px] text-blue-400 mb-0.5">中間品在庫</div>
            <div className="text-lg font-mono font-bold text-blue-400">{totalIntermediateStock}</div>
            <div className="text-[10px] text-factory-muted">合計</div>
          </div>
          <div className="bg-factory-bg/50 rounded p-2 text-center">
            <div className="text-[10px] text-factory-amber mb-0.5">本日生産</div>
            <div className="text-lg font-mono font-bold text-factory-amber">{mrpState.totalDailyProduced}</div>
            <div className="text-[10px] text-factory-muted">台</div>
          </div>
        </div>

        {/* 在庫推移チャート */}
        <InventoryTransition
          inventoryHistory={mrpState.inventoryHistory ?? []}
          currentWeek={currentWeek}
          currentDay={currentDay}
        />
      </div>

      {/* 中間品在庫 + 原材料在庫 + 生産計画 */}
      <div className="grid grid-cols-3 gap-2 flex-shrink-0">
        {/* 中間品在庫 */}
        <div className="bg-factory-panel border border-factory-border rounded-lg p-2.5">
          <h3 className="text-xs text-factory-amber uppercase tracking-wider mb-1.5 font-bold">中間品在庫</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-factory-muted">
                <th className="text-left py-0.5">品番</th>
                <th className="text-right py-0.5">在庫</th>
                <th className="text-right py-0.5">空き</th>
                <th className="text-right py-0.5">安全</th>
              </tr>
            </thead>
            <tbody>
              {intermediates.map(item => {
                const isLow = item.free <= item.safetyStock
                return (
                  <tr key={item.partNo} className={isLow ? 'text-red-400' : 'text-factory-text'}>
                    <td className="py-0.5 truncate max-w-[100px]" title={item.partName}>{item.partName}</td>
                    <td className="text-right py-0.5 font-mono">{item.onHand}</td>
                    <td className="text-right py-0.5 font-mono">{item.free}</td>
                    <td className="text-right py-0.5 font-mono text-factory-muted">{item.safetyStock}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* 原材料在庫 */}
        <div className="bg-factory-panel border border-factory-border rounded-lg p-2.5">
          <h3 className="text-xs text-factory-amber uppercase tracking-wider mb-1.5 font-bold">原材料在庫</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-factory-muted">
                <th className="text-left py-0.5">品番</th>
                <th className="text-right py-0.5">在庫</th>
                <th className="text-right py-0.5">空き</th>
                <th className="text-right py-0.5">安全</th>
              </tr>
            </thead>
            <tbody>
              {rawMaterials.map(item => {
                const isLow = item.free <= item.safetyStock
                return (
                  <tr key={item.partNo} className={isLow ? 'text-red-400' : 'text-factory-text'}>
                    <td className="py-0.5 truncate max-w-[100px]" title={item.partName}>{item.partName}</td>
                    <td className="text-right py-0.5 font-mono">{item.onHand}</td>
                    <td className="text-right py-0.5 font-mono">{item.free}</td>
                    <td className="text-right py-0.5 font-mono text-factory-muted">{item.safetyStock}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* 生産計画 + ライン */}
        <div className="bg-factory-panel border border-factory-border rounded-lg p-2.5">
          <h3 className="text-xs text-factory-amber uppercase tracking-wider mb-1.5 font-bold">生産計画・ライン</h3>
          <div className="space-y-1.5">
            {productionLines.map(line => {
              const plan = mrpState.productionPlans.find(p => p.lineId === line.id)
              return (
                <div key={line.id} className="flex items-center gap-1.5 text-xs">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    line.status === 'running' ? 'bg-green-500' :
                    line.status === 'down' ? 'bg-red-500' :
                    line.status === 'maintenance' ? 'bg-yellow-500' :
                    'bg-orange-500'
                  }`} />
                  <span className="text-factory-text flex-shrink-0 w-24 truncate">{line.name}</span>
                  <span className="text-factory-muted flex-shrink-0">→</span>
                  <span className="text-blue-400 flex-1 truncate">
                    {plan ? `${plan.targetPartNo} (${plan.dailyTarget}台/日)` : '未割当'}
                  </span>
                  <StatusBadge status={line.status} />
                </div>
              )
            })}
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
      </div>

      {/* 受注ボード */}
      <div className="bg-factory-panel border border-factory-border rounded-lg p-3 flex-1 min-h-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs text-factory-amber uppercase tracking-wider font-bold">
            受注ボード（ATO組立）
          </h3>
          <span className="text-xs text-factory-muted">{mrpState.productionOrders.length}件</span>
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 overflow-y-auto max-h-[calc(100%-2rem)]">
          {sortedOrders.map(order => (
            <OrderCardATO
              key={order.orderNo}
              order={order}
              currentWeek={currentWeek}
              currentDay={currentDay}
              onStartAssembly={onStartAssembly}
              bom={mrpState.bom}
              inventory={mrpState.inventory}
            />
          ))}
        </div>
      </div>

      {/* 部門・サプライヤー */}
      <div className="grid grid-cols-2 gap-2 flex-shrink-0">
        <div className="bg-factory-panel border border-factory-border rounded-lg p-2.5">
          <h3 className="text-xs text-factory-amber uppercase tracking-wider mb-1.5 font-bold">部門状態</h3>
          <div className="space-y-1">
            {(['sales', 'procurement', 'manufacturing'] as const).map(dept => {
              const d = departments[dept]
              if (!d) return null
              return (
                <div key={dept} className="flex items-center gap-2">
                  <span className="text-xs font-medium w-8 flex-shrink-0 text-factory-text">{d.label}</span>
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
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-factory-panel border border-factory-border rounded-lg p-2.5">
          <h3 className="text-xs text-factory-amber uppercase tracking-wider mb-1.5 font-bold">サプライヤー</h3>
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
  )
}

// --- 受注カード（ATO版） ---
function OrderCardATO({
  order,
  currentWeek,
  currentDay,
  onStartAssembly,
  bom,
  inventory,
}: {
  order: ProductionOrder
  currentWeek: number
  currentDay: number
  onStartAssembly: (orderNo: string) => void
  bom: GameState['mrpState']['bom']
  inventory: GameState['mrpState']['inventory']
}) {
  const absoluteNow = toAbsoluteDay(currentWeek, currentDay)
  const absoluteDue = toAbsoluteDay(order.dueWeek, order.dueDay)
  const remaining = absoluteDue - absoluteNow
  const isCompleted = order.status === 'completed'
  const isProducing = order.status === 'producing'
  const isWaitingParts = order.status === 'waiting_parts'
  const isOverdue = remaining < 0 || order.status === 'delayed'
  const canStart = order.status === 'planned' || order.status === 'waiting_parts'

  // BOM展開: 必要な部品
  const bomEntries = bom.filter(b => b.parentPartNo === order.partNo)
  const partsStatus = bomEntries.map(entry => {
    const item = inventory.find(i => i.partNo === entry.childPartNo)
    const required = entry.quantityPer * order.quantity
    const available = item?.free ?? 0
    return { partNo: entry.childPartNo, partName: item?.partName ?? entry.childPartNo, required, available, enough: available >= required }
  })
  const allPartsAvailable = partsStatus.every(p => p.enough)

  // リードタイム進捗
  let leadTimeRemainingDays = 0
  if (isProducing && order.productionEndWeek && order.productionEndDay) {
    const absoluteEnd = toAbsoluteDay(order.productionEndWeek, order.productionEndDay)
    leadTimeRemainingDays = Math.max(0, absoluteEnd - absoluteNow)
  }

  const borderClass = order.priority === 'urgent'
    ? 'border-red-500/60 shadow-[0_0_8px_rgba(239,68,68,0.2)]'
    : isOverdue
    ? 'border-red-500/40'
    : 'border-factory-border/50'

  return (
    <div className={`border rounded-lg p-2.5 bg-factory-panel ${borderClass}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-mono font-bold text-factory-text">{order.orderNo}</span>
        <div className="flex items-center gap-1">
          {order.priority !== 'normal' && (
            <span className={`text-xs px-1 py-0.5 rounded border font-bold ${
              order.priority === 'urgent'
                ? 'bg-red-500/30 text-red-300 border-red-500/50 animate-pulse'
                : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
            }`}>
              {order.priority === 'urgent' ? '緊急' : '高'}
            </span>
          )}
          <StatusBadge status={order.status} />
        </div>
      </div>

      {/* Product + Customer */}
      <div className="text-xs text-factory-subtext mb-1 truncate">
        {order.customerName} — {order.partName}
      </div>

      {/* Deadline */}
      <div className="flex items-center justify-between mb-1 text-xs">
        <span className="text-factory-muted">
          納期: W{order.dueWeek} {DAY_NAMES[order.dueDay - 1]}曜
        </span>
        {isCompleted ? (
          <span className="text-green-400">完了</span>
        ) : isOverdue ? (
          <span className="text-red-400 font-bold animate-pulse">遅延 {Math.abs(remaining)}日超過</span>
        ) : remaining === 0 ? (
          <span className="text-orange-400 font-bold">本日納期</span>
        ) : (
          <span className={remaining <= 2 ? 'text-yellow-400' : 'text-factory-muted'}>残り{remaining}日</span>
        )}
      </div>

      {/* 数量 */}
      <div className="text-xs text-factory-muted mb-1">
        数量: <span className="text-factory-text font-mono">{order.completedQuantity}/{order.quantity}台</span>
      </div>

      {/* BOM部品状況（計画/部品待ち時のみ表示） */}
      {canStart && bomEntries.length > 0 && (
        <div className="mt-1 pt-1 border-t border-factory-border/30">
          <div className="text-[10px] text-factory-muted mb-0.5">必要部品:</div>
          {partsStatus.map(p => (
            <div key={p.partNo} className={`text-[10px] flex justify-between ${p.enough ? 'text-green-400' : 'text-red-400'}`}>
              <span className="truncate">{p.partName}</span>
              <span className="font-mono ml-1">{p.available}/{p.required}</span>
            </div>
          ))}
        </div>
      )}

      {/* 組立中: リードタイム表示 */}
      {isProducing && (
        <div className="mt-1 pt-1 border-t border-factory-border/30">
          <div className="text-xs text-purple-400">
            組立中 — 残り{leadTimeRemainingDays}日
          </div>
        </div>
      )}

      {/* 部品待ち表示 */}
      {isWaitingParts && (
        <div className="mt-1 text-[10px] text-yellow-400">
          部品が揃い次第、自動で組立開始します
        </div>
      )}

      {/* ボタン */}
      {canStart && (
        <div className="mt-1.5 pt-1.5 border-t border-factory-border/30">
          <button
            onClick={() => onStartAssembly(order.orderNo)}
            className={`w-full text-xs py-1 px-2 rounded font-bold transition-all ${
              allPartsAvailable
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 hover:bg-purple-500/30 cursor-pointer'
                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 hover:bg-yellow-500/30 cursor-pointer'
            }`}
          >
            {allPartsAvailable ? '組立開始' : '組立開始（部品不足 → 部品待ち）'}
          </button>
        </div>
      )}
    </div>
  )
}
