import type { GameEvent, EventChoice, GameState, ImpactAnalysis } from '../../shared/types'

interface Props {
  gameState: GameState
  pendingEvents: GameEvent[]
  impactAnalysis: ImpactAnalysis | null
  isProcessing: boolean
  onAction: (event: GameEvent, choice: EventChoice) => void
  onInvestigate: (eventId: string, choiceId: string) => void
  onAdvanceDay: () => void
}

const actionTypeLabels: Record<string, { label: string; color: string }> = {
  self: { label: '自分で動く', color: 'text-blue-400' },
  dispatch: { label: '部下に任せる', color: 'text-purple-400' },
  defer: { label: '保留', color: 'text-yellow-400' },
  investigate: { label: 'AI調査', color: 'text-cyan-400' },
}

const timeCostLabels: Record<string, string> = {
  none: '',
  half_day: '-半日',
  full_day: '-1日',
}

export function DecisionPanel({
  gameState,
  pendingEvents,
  impactAnalysis,
  isProcessing,
  onAction,
  onInvestigate,
  onAdvanceDay,
}: Props) {
  if (pendingEvents.length === 0) {
    return (
      <div className="bg-factory-panel border border-factory-border rounded-lg p-4">
        <div className="text-center">
          <div className="text-factory-muted text-sm mb-3">
            本日のイベントは全て処理済みです
          </div>
          <div className="text-xs text-factory-muted mb-2">
            残り時間: {gameState.dayTimeRemaining === 2 ? '1日' : gameState.dayTimeRemaining === 1 ? '半日' : '0'}
          </div>
          <button
            onClick={onAdvanceDay}
            disabled={isProcessing}
            className="px-6 py-2 bg-factory-amber/20 border border-factory-amber text-factory-amber rounded hover:bg-factory-amber/30 transition-all text-sm font-bold disabled:opacity-50"
          >
            {isProcessing ? '処理中...' : '次の日へ進む →'}
          </button>
        </div>
      </div>
    )
  }

  const currentEvent = pendingEvents[0]
  const severityColors: Record<string, string> = {
    low: 'border-gray-500',
    medium: 'border-yellow-500',
    high: 'border-orange-500',
    critical: 'border-red-500',
  }

  return (
    <div className="bg-factory-panel border border-factory-border rounded-lg p-3">
      {/* イベント表示 */}
      <div className={`border-l-4 ${severityColors[currentEvent.severity]} pl-3 mb-3`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-factory-muted uppercase">{currentEvent.category}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded ${
            currentEvent.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
            currentEvent.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
            'bg-yellow-500/20 text-yellow-400'
          }`}>{currentEvent.severity}</span>
          {pendingEvents.length > 1 && (
            <span className="text-xs text-factory-muted">残り{pendingEvents.length}件</span>
          )}
        </div>
        <h4 className="text-sm font-bold text-factory-text mb-1">{currentEvent.title}</h4>
        <p className="text-xs text-factory-subtext leading-relaxed">{currentEvent.description}</p>
      </div>

      {/* AI影響調査結果 */}
      {impactAnalysis && impactAnalysis.eventId === currentEvent.id && (
        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded p-2 mb-3 text-xs">
          <div className="text-cyan-400 font-bold mb-1">AI影響調査結果</div>
          <div className="grid grid-cols-2 gap-1 mb-1">
            {(['deliveryRate', 'fieldTrust', 'costControl', 'customerSatisfaction'] as const).map(key => {
              const p = impactAnalysis.prediction[key]
              const labels: Record<string, string> = {
                deliveryRate: '納期', fieldTrust: '信頼', costControl: 'コスト', customerSatisfaction: '顧客',
              }
              return (
                <div key={key} className="flex justify-between">
                  <span className="text-factory-muted">{labels[key]}</span>
                  <span className={p.delta >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {p.delta >= 0 ? '+' : ''}{p.delta} ({p.confidence})
                  </span>
                </div>
              )
            })}
          </div>
          <div className="text-factory-subtext">{impactAnalysis.recommendation}</div>
        </div>
      )}

      {/* 選択肢 */}
      <div className="space-y-1.5">
        {currentEvent.choices.map(choice => {
          const actionInfo = actionTypeLabels[choice.actionType] ?? { label: choice.actionType, color: 'text-gray-400' }
          return (
            <div key={choice.id} className="flex items-center gap-1.5">
              <button
                onClick={() => onAction(currentEvent, choice)}
                disabled={isProcessing || (choice.timeCost !== 'none' && gameState.dayTimeRemaining <= 0)}
                className="flex-1 text-left px-3 py-2 border border-factory-border rounded hover:bg-factory-border/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[10px] font-bold uppercase ${actionInfo.color}`}>
                    {actionInfo.label}
                  </span>
                  {choice.dispatchTarget && (
                    <span className="text-[10px] text-purple-400">
                      → {choice.dispatchTarget === 'subordinate1' ? '田中' : choice.dispatchTarget === 'subordinate2' ? '佐々木' : choice.dispatchTarget}
                    </span>
                  )}
                  {choice.timeCost !== 'none' && (
                    <span className="text-[10px] text-factory-muted">{timeCostLabels[choice.timeCost]}</span>
                  )}
                </div>
                <div className="text-xs text-factory-text">{choice.label}</div>
                {choice.context && (
                  <div className="text-[10px] text-factory-muted mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {choice.context}
                  </div>
                )}
              </button>
              {/* AI影響調査ボタン */}
              <button
                onClick={() => onInvestigate(currentEvent.id, choice.id)}
                disabled={isProcessing || gameState.dayTimeRemaining <= 0}
                className="px-2 py-2 border border-cyan-500/30 text-cyan-400 rounded hover:bg-cyan-500/10 transition-all disabled:opacity-30 text-xs flex-shrink-0"
                title="AI影響調査（半日消費）"
              >
                🔍
              </button>
            </div>
          )
        })}
      </div>

      {/* 残り時間 */}
      <div className="mt-2 text-xs text-factory-muted text-right">
        残り時間枠: {gameState.dayTimeRemaining === 2 ? '●●' : gameState.dayTimeRemaining === 1 ? '●○' : '○○'}
        {gameState.dayTimeRemaining <= 0 && (
          <span className="text-red-400 ml-1">（時間切れ: 時間のかかる行動は不可）</span>
        )}
      </div>
    </div>
  )
}
