import { useState } from 'react'
import type { InventorySnapshot } from '../../shared/types'

const DAY_NAMES = ['月', '火', '水', '木', '金']

interface Props {
  inventoryHistory: InventorySnapshot[]
  currentWeek: number
  currentDay: number
}

function toAbsoluteDay(week: number, day: number): number {
  return (week - 1) * 5 + day
}

export function InventoryTransition({ inventoryHistory, currentWeek, currentDay }: Props) {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null)

  const snapshotMap = new Map<number, InventorySnapshot>()
  for (const s of inventoryHistory) {
    snapshotMap.set(toAbsoluteDay(s.week, s.day), s)
  }

  const currentAbsDay = toAbsoluteDay(currentWeek, currentDay)

  const maxStock = Math.max(
    1,
    ...inventoryHistory.map(s => s.totalIntermediateStock),
  )

  const chartHeight = 80

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-[10px] text-factory-amber uppercase tracking-wider font-bold">中間品在庫推移</h4>
        <div className="flex items-center gap-3 text-[10px] text-factory-muted">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-blue-500/60 inline-block" />中間品在庫
          </span>
          <span className="flex items-center gap-1">
            <span className="text-green-400">+N</span> 生産
          </span>
          <span className="flex items-center gap-1">
            <span className="text-purple-400">-N</span> 組立
          </span>
        </div>
      </div>

      <div className="flex gap-0">
        {[1, 2, 3, 4].map(week => (
          <div key={week} className={`flex-1 ${week < 4 ? 'border-r border-factory-border/30' : ''}`}>
            <div className={`text-[10px] text-center font-mono mb-1 ${
              week === currentWeek ? 'text-factory-amber font-bold' : 'text-factory-muted/50'
            }`}>
              W{week}
            </div>

            <div className="flex gap-0.5 px-0.5">
              {[1, 2, 3, 4, 5].map(day => {
                const absDay = toAbsoluteDay(week, day)
                const snapshot = snapshotMap.get(absDay)
                const isCurrent = absDay === currentAbsDay
                const isFuture = absDay > currentAbsDay
                const isHovered = hoveredDay === absDay
                const hasEvents = snapshot && snapshot.events.length > 0
                const barHeight = snapshot
                  ? (snapshot.totalIntermediateStock / maxStock) * chartHeight
                  : 0

                return (
                  <div
                    key={day}
                    className="flex-1 flex flex-col items-center relative"
                    onMouseEnter={() => setHoveredDay(absDay)}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    <div className={`text-[9px] font-mono ${
                      isCurrent ? 'text-factory-amber font-bold' :
                      isFuture ? 'text-factory-muted/30' :
                      'text-factory-muted/60'
                    }`}>
                      {DAY_NAMES[day - 1]}
                    </div>

                    <div className="text-[9px] h-3 leading-3">
                      {snapshot && snapshot.dailyProduced > 0 ? (
                        <span className="text-green-400 font-mono">+{snapshot.dailyProduced}</span>
                      ) : (
                        <span className="text-transparent">.</span>
                      )}
                    </div>

                    <div
                      className="w-full flex items-end justify-center"
                      style={{ height: `${chartHeight}px` }}
                    >
                      {snapshot ? (
                        <div
                          className={`w-full rounded-t transition-all ${
                            isCurrent
                              ? 'bg-blue-500/80 ring-1 ring-blue-400'
                              : 'bg-blue-500/40'
                          } ${isHovered ? 'bg-blue-500/70' : ''}`}
                          style={{ height: `${Math.max(barHeight, 2)}px` }}
                        />
                      ) : (
                        <div
                          className={`w-full rounded-t ${isFuture ? 'bg-factory-border/20' : 'bg-factory-border/40'}`}
                          style={{ height: '2px' }}
                        />
                      )}
                    </div>

                    <div className={`text-[9px] font-mono h-3 leading-3 ${
                      isCurrent ? 'text-blue-400 font-bold' :
                      snapshot ? 'text-factory-muted' : 'text-transparent'
                    }`}>
                      {snapshot ? snapshot.totalIntermediateStock : '.'}
                    </div>

                    <div className="h-2 flex items-center justify-center">
                      {hasEvents && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      )}
                    </div>

                    {isHovered && snapshot && (
                      <div className="absolute z-20 bottom-full mb-1 left-1/2 -translate-x-1/2 bg-factory-bg border border-factory-border rounded p-2 shadow-lg whitespace-nowrap pointer-events-none">
                        <div className="text-[10px] text-factory-text font-bold mb-1">
                          W{snapshot.week} {DAY_NAMES[snapshot.day - 1]}曜日
                        </div>
                        <div className="text-[10px] text-factory-muted space-y-0.5">
                          <div>
                            <span className="text-green-400">中間品生産:</span> +{snapshot.dailyProduced}台
                          </div>
                          <div>
                            <span className="text-purple-400">受注組立:</span> -{snapshot.dailyAssembled}台
                          </div>
                          <div>
                            <span className="text-blue-400">中間品在庫:</span> {snapshot.totalIntermediateStock}台
                          </div>
                          {Object.entries(snapshot.intermediateStock).length > 0 && (
                            <div className="mt-1 pt-1 border-t border-factory-border/50">
                              {Object.entries(snapshot.intermediateStock).map(([partNo, qty]) => (
                                <div key={partNo} className="text-factory-muted">
                                  {partNo}: {qty}
                                </div>
                              ))}
                            </div>
                          )}
                          {snapshot.events.length > 0 && (
                            <div className="mt-1 pt-1 border-t border-factory-border/50">
                              {snapshot.events.map((evt, i) => (
                                <div key={i} className="text-red-400">{evt}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
