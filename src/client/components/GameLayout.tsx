import type { GameState, EventChoice } from '../../shared/types'
import { TimelinePanel } from './TimelinePanel'
import { ChatPanel } from './ChatPanel'
import { ActionButtons } from './ActionButtons'
import { StatusPanel } from './StatusPanel'

interface GameLayoutProps {
  gameState: GameState
  characterResponse: string | null
  isProcessing: boolean
  onAction: (choice: EventChoice) => void
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function GameLayout({
  gameState,
  characterResponse,
  isProcessing,
  onAction,
}: GameLayoutProps) {
  const remainingMinutes = 17 * 60 + 30 - gameState.gameTime

  return (
    <div className="h-screen bg-factory-bg text-factory-text flex flex-col overflow-hidden">
      {/* ヘッダー */}
      <header className="flex items-center justify-between px-6 py-3 bg-factory-panel border-b border-factory-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-factory-amber font-mono font-bold text-lg">⚙ PRODUCTION HELL</span>
          <span className="text-factory-muted font-mono text-xs border border-factory-border px-2 py-0.5 rounded">
            東和機工株式会社
          </span>
        </div>

        <div className="flex items-center gap-6 font-mono text-sm">
          <div className="text-center">
            <div className="text-xs text-factory-muted">ゲーム内時刻</div>
            <div className="text-factory-amber font-bold text-lg">
              {minutesToTime(gameState.gameTime)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-factory-muted">残り時間</div>
            <div
              className={`font-bold ${
                remainingMinutes < 60 ? 'text-factory-red animate-pulse' : 'text-factory-text'
              }`}
            >
              {Math.floor(remainingMinutes / 60)}h{remainingMinutes % 60}m
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-factory-muted">リスク</div>
            <div
              className={`font-bold ${
                gameState.riskPoints >= 30 ? 'text-factory-red' : 'text-factory-muted'
              }`}
            >
              {gameState.riskPoints}pt
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左パネル: タイムライン・スコア */}
        <aside className="w-64 border-r border-factory-border p-4 overflow-y-auto flex-shrink-0">
          <TimelinePanel gameState={gameState} />
        </aside>

        {/* 中央パネル: チャット + アクション */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <ChatPanel
              conversations={gameState.conversations}
              isProcessing={isProcessing}
              characterResponse={characterResponse}
            />
          </div>

          {/* アクションパネル（イベント待ちのとき表示） */}
          {gameState.pendingEvent && !gameState.isGameOver && (
            <div className="flex-shrink-0">
              <ActionButtons
                pendingEvent={gameState.pendingEvent}
                onAction={onAction}
                isProcessing={isProcessing}
              />
            </div>
          )}

          {/* 次のイベント待ちメッセージ */}
          {!gameState.pendingEvent && !gameState.isGameOver && !isProcessing && (
            <div className="flex-shrink-0 p-4 border-t border-factory-border text-center text-factory-muted font-mono text-sm">
              <span className="animate-pulse">次のイベントを待っています...</span>
            </div>
          )}
        </main>

        {/* 右パネル: MRP状況 */}
        <aside className="w-72 border-l border-factory-border p-4 flex-shrink-0">
          <StatusPanel gameState={gameState} />
        </aside>
      </div>
    </div>
  )
}
