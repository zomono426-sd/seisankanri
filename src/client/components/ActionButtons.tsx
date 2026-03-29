import { useState } from 'react'
import type { GameEvent, EventChoice } from '../../shared/types'
import { CHARACTERS } from './characterData'

interface ActionButtonsProps {
  pendingEvent: GameEvent
  onAction: (choice: EventChoice) => void
  isProcessing: boolean
}

function severityColor(severity: GameEvent['severity']): string {
  switch (severity) {
    case 'critical': return 'text-factory-red border-factory-red/40'
    case 'high': return 'text-orange-400 border-orange-400/40'
    case 'medium': return 'text-yellow-400 border-yellow-400/40'
    case 'low': return 'text-factory-green border-factory-green/40'
  }
}

function severityLabel(severity: GameEvent['severity']): string {
  switch (severity) {
    case 'critical': return '【緊急】'
    case 'high': return '【重要】'
    case 'medium': return '【通常】'
    case 'low': return '【軽微】'
  }
}

function actionTypeColor(type: EventChoice['actionType']): string {
  switch (type) {
    case 'self': return 'border-factory-amber hover:bg-factory-amber/10 text-factory-amber'
    case 'dispatch': return 'border-factory-blue hover:bg-factory-blue/10 text-factory-blue'
    case 'defer': return 'border-factory-muted hover:bg-factory-muted/10 text-factory-muted'
  }
}

function actionTypeLabel(type: EventChoice['actionType']): string {
  switch (type) {
    case 'self': return '自分で動く'
    case 'dispatch': return '部下に任せる'
    case 'defer': return '保留'
  }
}

export function ActionButtons({ pendingEvent, onAction, isProcessing }: ActionButtonsProps) {
  const [hovered, setHovered] = useState<string | null>(null)
  const character = CHARACTERS[pendingEvent.characterId]

  return (
    <div className="bg-factory-panel border-t border-factory-border p-4">
      {/* イベント情報 */}
      <div className={`border rounded-lg p-3 mb-4 ${severityColor(pendingEvent.severity)}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-mono font-bold">
            {severityLabel(pendingEvent.severity)}
          </span>
          <span className="text-xs font-mono font-bold">{pendingEvent.title}</span>
          <span
            className="text-xs font-mono ml-auto"
            style={{ color: character?.avatarColor }}
          >
            {character?.displayName}
          </span>
        </div>
        <p className="text-xs text-factory-subtext leading-relaxed">
          {pendingEvent.description}
        </p>
      </div>

      {/* アクションボタン */}
      <div className="text-xs font-mono text-factory-muted mb-2 uppercase tracking-wider">
        — どう対応しますか？
      </div>
      <div className="space-y-2">
        {pendingEvent.choices.map((choice) => {
          const dispatchTarget = choice.dispatchTarget
            ? CHARACTERS[choice.dispatchTarget]
            : null

          return (
            <button
              key={choice.id}
              disabled={isProcessing}
              onClick={() => onAction(choice)}
              onMouseEnter={() => setHovered(choice.id)}
              onMouseLeave={() => setHovered(null)}
              className={`
                w-full text-left border rounded-lg px-4 py-3 transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                ${actionTypeColor(choice.actionType)}
              `}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded border text-current border-current opacity-60">
                  {actionTypeLabel(choice.actionType)}
                </span>
                {dispatchTarget && (
                  <span
                    className="text-xs font-mono px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: dispatchTarget.avatarColor + '22',
                      color: dispatchTarget.avatarColor,
                    }}
                  >
                    → {dispatchTarget.firstName}
                  </span>
                )}
                <span className="text-sm font-medium flex-1">{choice.label}</span>
                <span className="text-xs text-factory-muted font-mono flex-shrink-0">
                  -{choice.timeConsumption}分
                </span>
              </div>
              {hovered === choice.id && choice.context && (
                <div className="mt-2 text-xs text-factory-subtext border-t border-current/20 pt-2 opacity-80">
                  {choice.context}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
