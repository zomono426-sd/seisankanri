import type { GameState, EventChoice, GameEvent, ImpactAnalysis, LineProductionPlan } from '../../shared/types'
import { MonitoringDashboard } from './MonitoringDashboard'
import { EventStream } from './EventStream'
import { DecisionPanel } from './DecisionPanel'
import { DirectiveBar } from './DirectiveBar'
import { ScoreGauge } from './ScoreGauge'

interface GameLayoutProps {
  gameState: GameState
  characterResponse: string | null
  impactAnalysis: ImpactAnalysis | null
  isProcessing: boolean
  onAction: (event: GameEvent, choice: EventChoice) => void
  onInvestigate: (eventId: string, choiceId: string) => void
  onAdvanceDay: () => void
  onStartAssembly: (orderNo: string) => void
  onUpdateProductionPlan: (plans: LineProductionPlan[]) => void
}

function getDayName(day: number): string {
  const names = ['月', '火', '水', '木', '金']
  return names[day - 1] ?? `${day}`
}

export function GameLayout({
  gameState,
  characterResponse,
  impactAnalysis,
  isProcessing,
  onAction,
  onInvestigate,
  onAdvanceDay,
  onStartAssembly,
  onUpdateProductionPlan,
}: GameLayoutProps) {
  return (
    <div className="h-screen bg-factory-bg text-factory-text flex flex-col overflow-hidden">
      {/* ヘッダー */}
      <header className="flex items-center justify-between px-4 py-2 bg-factory-panel border-b border-factory-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-factory-amber font-mono font-bold text-base">⚙ PRODUCTION HELL</span>
          <span className="text-factory-muted font-mono text-xs border border-factory-border px-2 py-0.5 rounded">
            東和機工株式会社
          </span>
        </div>

        <div className="flex items-center gap-4 font-mono text-sm">
          {/* 週・日 */}
          <div className="text-center">
            <div className="text-[10px] text-factory-muted">現在</div>
            <div className="text-factory-amber font-bold">
              W{gameState.currentWeek} {getDayName(gameState.currentDay)}曜
            </div>
          </div>

          {/* スコアバー（コンパクト） */}
          <div className="flex items-center gap-2">
            <ScoreGauge label="納期" value={gameState.scores.deliveryRate} danger={50} warn={70} />
            <ScoreGauge label="信頼" value={gameState.scores.fieldTrust} danger={20} warn={40} />
            <ScoreGauge label="コスト" value={gameState.scores.costControl} danger={40} warn={60} />
            <ScoreGauge label="顧客" value={gameState.scores.customerSatisfaction} danger={30} warn={50} />
          </div>

          {/* リスク */}
          <div className="text-center">
            <div className="text-[10px] text-factory-muted">リスク</div>
            <div className={`font-bold ${gameState.riskPoints >= 30 ? 'text-factory-red animate-pulse' : 'text-factory-muted'}`}>
              {gameState.riskPoints}pt
            </div>
          </div>
        </div>
      </header>

      {/* 工場長指令バー */}
      <div className="px-4 py-1 flex-shrink-0">
        <DirectiveBar directive={gameState.activeDirective} currentScores={gameState.scores} />
      </div>

      {/* メインコンテンツ */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左サイド: イベントストリーム */}
        <aside className="w-72 border-r border-factory-border p-3 flex-shrink-0 flex flex-col">
          <EventStream items={gameState.eventStream} isProcessing={isProcessing} />
        </aside>

        {/* 中央: モニタリングダッシュボード + 意思決定パネル */}
        <main className="flex-1 flex flex-col overflow-hidden p-3 gap-3">
          {/* モニタリングダッシュボード */}
          <div className="flex-1 overflow-hidden">
            <MonitoringDashboard gameState={gameState} onStartAssembly={onStartAssembly} onUpdateProductionPlan={onUpdateProductionPlan} />
          </div>

          {/* 意思決定パネル（下部） */}
          <div className="flex-shrink-0">
            <DecisionPanel
              gameState={gameState}
              pendingEvents={gameState.pendingEvents}
              impactAnalysis={impactAnalysis}
              isProcessing={isProcessing}
              onAction={onAction}
              onInvestigate={onInvestigate}
              onAdvanceDay={onAdvanceDay}
            />
          </div>

          {/* キャラクター応答 */}
          {characterResponse && (
            <div className="flex-shrink-0 bg-factory-panel border border-factory-border rounded-lg p-2 text-xs text-factory-subtext">
              {characterResponse}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
