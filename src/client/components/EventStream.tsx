import { useEffect, useRef } from 'react'
import type { EventStreamItem, EventSeverity } from '../../shared/types'

interface Props {
  items: EventStreamItem[]
  isProcessing: boolean
}

const severityColors: Record<EventSeverity, string> = {
  low: 'border-l-gray-500',
  medium: 'border-l-yellow-500',
  high: 'border-l-orange-500',
  critical: 'border-l-red-500',
}

const severityBg: Record<EventSeverity, string> = {
  low: '',
  medium: '',
  high: 'bg-orange-500/5',
  critical: 'bg-red-500/5',
}

const categoryIcons: Record<string, string> = {
  sales: '💼',
  procurement: '📦',
  manufacturing: '🔧',
  capacity: '⚙',
  director: '🏭',
}

export function EventStream({ items, isProcessing }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [items.length])

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-xs text-factory-amber uppercase tracking-wider mb-2 font-bold flex-shrink-0">
        イベントストリーム
      </h3>
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {items.map(item => (
          <div
            key={item.id}
            className={`border-l-2 ${severityColors[item.severity]} ${severityBg[item.severity]} rounded-r p-2 text-xs ${
              item.isDirective ? 'bg-red-500/10 border border-red-500/20 border-l-2 border-l-red-500' : ''
            } ${!item.isRead ? 'bg-factory-panel' : ''}`}
          >
            <div className="flex items-center gap-1 mb-0.5">
              <span>{categoryIcons[item.category] ?? '📋'}</span>
              <span className="text-factory-muted">
                W{item.timestamp.week}D{item.timestamp.day}
              </span>
              {item.isDirective && (
                <span className="text-red-400 font-bold text-[10px] uppercase">指令</span>
              )}
            </div>
            <div className="font-medium text-factory-text mb-0.5">{item.title}</div>
            <div className="text-factory-subtext leading-relaxed">{item.content}</div>
          </div>
        ))}
        {isProcessing && (
          <div className="text-center py-2">
            <span className="text-factory-amber animate-spin inline-block">⚙</span>
            <span className="text-factory-muted text-xs ml-1">処理中...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
