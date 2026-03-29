import type { GameState } from '../../shared/types'

interface StatusPanelProps {
  gameState: GameState
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    planned: { label: '計画', className: 'bg-factory-border text-factory-subtext' },
    in_progress: { label: '作業中', className: 'bg-blue-500/20 text-blue-400' },
    completed: { label: '完了', className: 'bg-factory-green/20 text-factory-green' },
    delayed: { label: '遅延', className: 'bg-yellow-500/20 text-yellow-400' },
    blocked: { label: 'ブロック', className: 'bg-factory-red/20 text-factory-red' },
  }
  const { label, className } = config[status] ?? { label: status, className: 'bg-factory-border text-factory-subtext' }
  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded ${className}`}>
      {label}
    </span>
  )
}

export function StatusPanel({ gameState }: StatusPanelProps) {
  const { mrpState } = gameState
  const completionRate = mrpState.totalPlanned > 0
    ? Math.round((mrpState.totalCompleted / mrpState.totalPlanned) * 100)
    : 0

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      {/* MRP進捗サマリー */}
      <div className="bg-factory-panel border border-factory-border rounded-lg p-4">
        <h3 className="text-xs font-mono text-factory-amber uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>■</span> MRP 進捗
        </h3>
        <div className="flex justify-between text-sm font-mono mb-2">
          <span className="text-factory-subtext">完了</span>
          <span className="text-factory-text">
            <span className="text-factory-green font-bold">{mrpState.totalCompleted}</span>
            <span className="text-factory-muted"> / {mrpState.totalPlanned}台</span>
          </span>
        </div>
        <div className="w-full bg-factory-border rounded-full h-2 mb-1">
          <div
            className="h-2 rounded-full bg-factory-green transition-all duration-700"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <div className="text-xs text-factory-muted font-mono text-right">{completionRate}%</div>
      </div>

      {/* 製造指示一覧 */}
      <div className="bg-factory-panel border border-factory-border rounded-lg p-4 flex-1">
        <h3 className="text-xs font-mono text-factory-amber uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>■</span> 製造指示
        </h3>
        <div className="space-y-2">
          {mrpState.productionOrders.map((order) => (
            <div
              key={order.orderNo}
              className="border border-factory-border rounded p-2 text-xs"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-mono text-factory-muted">{order.orderNo}</span>
                <StatusBadge status={order.status} />
              </div>
              <div className="text-factory-text font-medium truncate">{order.partName}</div>
              <div className="flex justify-between mt-1 text-factory-muted font-mono">
                <span>{order.line}</span>
                <span>×{order.quantity}</span>
                <span>{minutesToTime(order.plannedCompletion)}完了予定</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 在庫ステータス */}
      <div className="bg-factory-panel border border-factory-border rounded-lg p-4">
        <h3 className="text-xs font-mono text-factory-amber uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>■</span> 部品在庫
        </h3>
        <div className="space-y-2">
          {mrpState.inventory.map((item) => {
            const shortage = item.free < 0
            return (
              <div key={item.partNo} className="text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-factory-text truncate flex-1">{item.partName}</span>
                  <span
                    className={`font-mono ml-2 font-bold ${
                      shortage ? 'text-factory-red' : 'text-factory-green'
                    }`}
                  >
                    {item.free >= 0 ? `+${item.free}` : item.free}
                  </span>
                </div>
                <div className="text-factory-muted font-mono">
                  手持:{item.onHand} 引当:{item.allocated}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
