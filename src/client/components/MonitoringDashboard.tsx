import type { GameState } from '../../shared/types'

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

export function MonitoringDashboard({ gameState }: Props) {
  const { productionLines, mrpState, departments, workCapacity } = gameState

  return (
    <div className="grid grid-cols-2 gap-3 h-full overflow-y-auto">
      {/* 左上: 製造ライン稼働状況 */}
      <div className="bg-factory-panel border border-factory-border rounded-lg p-3">
        <h3 className="text-xs text-factory-amber uppercase tracking-wider mb-2 font-bold">
          製造ライン稼働状況
        </h3>
        <div className="space-y-2">
          {productionLines.map(line => (
            <div key={line.id} className="border border-factory-border rounded p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-factory-text">{line.name}</span>
                <StatusBadge status={line.status} />
              </div>
              <div className="flex items-center gap-2 text-xs text-factory-muted">
                <span>負荷: {line.currentLoad}/{line.capacity}</span>
                <span>作業者: {line.assignedWorkers}/{line.maxWorkers}</span>
              </div>
              <div className="mt-1 h-1.5 bg-factory-border rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    line.status === 'down' ? 'bg-red-500' :
                    line.currentLoad / line.capacity > 0.8 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${line.status === 'down' ? 0 : (line.currentLoad / line.capacity) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        {/* 作業能力 */}
        <div className="mt-3 pt-2 border-t border-factory-border">
          <div className="flex justify-between text-xs text-factory-muted mb-1">
            <span>総合能力</span>
            <span className={workCapacity.overallCapacity < 70 ? 'text-red-400' : 'text-green-400'}>
              {workCapacity.overallCapacity}%
            </span>
          </div>
          <div className="h-2 bg-factory-border rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                workCapacity.overallCapacity < 50 ? 'bg-red-500' :
                workCapacity.overallCapacity < 70 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${workCapacity.overallCapacity}%` }}
            />
          </div>
          <div className="flex gap-3 mt-1 text-xs text-factory-muted">
            <span>出勤: {workCapacity.presentWorkers}/{workCapacity.totalWorkers}</span>
            <span>設備: {workCapacity.equipmentOperational}/{workCapacity.equipmentTotal}</span>
          </div>
        </div>
      </div>

      {/* 右上: 在庫状況 */}
      <div className="bg-factory-panel border border-factory-border rounded-lg p-3">
        <h3 className="text-xs text-factory-amber uppercase tracking-wider mb-2 font-bold">
          在庫状況
        </h3>
        <div className="space-y-1.5">
          {mrpState.inventory.map(item => (
            <div key={item.partNo} className="flex items-center justify-between text-xs border-b border-factory-border/50 pb-1">
              <div className="flex-1 min-w-0">
                <div className="text-factory-text truncate">{item.partName}</div>
                <div className="text-factory-muted">{item.partNo}</div>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <span className="text-factory-muted">手持:{item.onHand}</span>
                <span className={item.free <= item.safetyStock ? 'text-red-400 font-bold' : 'text-green-400'}>
                  空:{item.free}
                </span>
              </div>
            </div>
          ))}
        </div>
        {/* 週次生産実績 */}
        <div className="mt-3 pt-2 border-t border-factory-border">
          <div className="flex justify-between text-xs text-factory-muted mb-1">
            <span>週次生産</span>
            <span>{mrpState.weeklyCompleted}/{mrpState.weeklyPlanned}台</span>
          </div>
          <div className="h-2 bg-factory-border rounded-full overflow-hidden">
            <div
              className="h-full bg-factory-amber rounded-full"
              style={{ width: `${mrpState.weeklyPlanned > 0 ? (mrpState.weeklyCompleted / mrpState.weeklyPlanned) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* 左下: 受注一覧 */}
      <div className="bg-factory-panel border border-factory-border rounded-lg p-3">
        <h3 className="text-xs text-factory-amber uppercase tracking-wider mb-2 font-bold">
          受注一覧
        </h3>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {mrpState.productionOrders.map(order => (
            <div key={order.orderNo} className="border border-factory-border/50 rounded p-1.5 text-xs">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-factory-text font-medium">{order.orderNo}</span>
                <div className="flex items-center gap-1">
                  <StatusBadge status={order.priority} />
                  <StatusBadge status={order.status} />
                </div>
              </div>
              <div className="text-factory-muted">
                {order.partName} | {order.customerName} | {order.completedQuantity}/{order.quantity}台 | 納期:{order.dueDay}日目
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 右下: 部門状態 */}
      <div className="bg-factory-panel border border-factory-border rounded-lg p-3">
        <h3 className="text-xs text-factory-amber uppercase tracking-wider mb-2 font-bold">
          部門状態
        </h3>
        <div className="space-y-3">
          {(['sales', 'procurement', 'manufacturing'] as const).map(dept => {
            const d = departments[dept]
            if (!d) return null
            const deptColors: Record<string, string> = {
              sales: '#0891b2',
              procurement: '#15803d',
              manufacturing: '#b45309',
            }
            return (
              <div key={dept}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium" style={{ color: deptColors[dept] }}>
                    {d.label}
                  </span>
                  <span className="text-xs text-factory-muted">
                    問題: {d.activeIssues}件
                  </span>
                </div>
                <div className="flex gap-2 text-xs text-factory-muted mb-1">
                  <span>負荷: {d.load}%</span>
                  <span>効率: {d.efficiency}%</span>
                </div>
                <div className="h-1.5 bg-factory-border rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${d.load}%`,
                      backgroundColor: d.load > 85 ? '#ef4444' : d.load > 70 ? '#f59e0b' : '#22c55e',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* サプライヤー概要 */}
        <div className="mt-3 pt-2 border-t border-factory-border">
          <h4 className="text-xs text-factory-amber uppercase tracking-wider mb-1 font-bold">サプライヤー</h4>
          <div className="flex flex-wrap gap-1">
            {gameState.suppliers.map(s => (
              <div
                key={s.id}
                className="text-xs px-1.5 py-0.5 rounded border border-factory-border/50"
                title={`${s.name} - 好感度:${s.affinity}`}
              >
                <span style={{ color: s.avatarColor }}>{s.name.slice(0, 4)}</span>
                <span className="ml-1 text-factory-muted">
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
