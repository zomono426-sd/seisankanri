import type { GameState } from '../../shared/types'
import { ScoreGauge } from './ScoreGauge'

interface TimelinePanelProps {
  gameState: GameState
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// タイムラインのマイルストーン
const MILESTONES = [
  { time: 8 * 60, label: '始業' },
  { time: 9 * 60, label: '午前' },
  { time: 12 * 60, label: '昼休み' },
  { time: 13 * 60, label: '中間〆切' },
  { time: 15 * 60, label: '午後' },
  { time: 16 * 60 + 30, label: '最終〆切' },
  { time: 17 * 60 + 30, label: '終業' },
]

const GAME_START = 8 * 60
const GAME_END = 17 * 60 + 30
const GAME_DURATION = GAME_END - GAME_START

function RelationshipBadge({
  name,
  value,
}: {
  name: string
  value: number
}) {
  const color =
    value >= 70
      ? 'border-factory-green text-factory-green'
      : value >= 40
      ? 'border-factory-amber text-factory-amber'
      : 'border-factory-red text-factory-red'

  return (
    <div className={`flex items-center justify-between text-xs border-l-2 pl-2 mb-1 ${color}`}>
      <span className="truncate">{name}</span>
      <span className="font-mono font-bold ml-2">{value}</span>
    </div>
  )
}

export function TimelinePanel({ gameState }: TimelinePanelProps) {
  const { gameTime, scores, relationships } = gameState
  const progress = ((gameTime - GAME_START) / GAME_DURATION) * 100

  const characterRelations = [
    { id: 'workshop', name: '製造職長 谷口' },
    { id: 'dept_manager', name: '製造部長 橋本' },
    { id: 'sales', name: '営業主任 西村' },
    { id: 'procurement', name: '調達担当 木村' },
    { id: 'subcontractor', name: '外注先社長 坂本' },
    { id: 'subordinate1', name: '部下 田中' },
    { id: 'subordinate2', name: '部下 佐々木' },
  ] as const

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* 時刻表示 */}
      <div className="bg-factory-panel border border-factory-border rounded-lg p-4">
        <div className="text-center">
          <div className="text-4xl font-mono font-bold text-factory-amber tracking-widest">
            {minutesToTime(gameTime)}
          </div>
          <div className="text-xs text-factory-subtext mt-1 font-mono">
            {gameState.timeSlot === 'morning' && '午前 — 問題が噴出する時間帯'}
            {gameState.timeSlot === 'midday' && '昼 — 問題は積み上がる'}
            {gameState.timeSlot === 'afternoon' && '午後 — 外注・品質問題タイム'}
            {gameState.timeSlot === 'closing' && '締め — 最終判断の時間'}
          </div>
        </div>

        {/* タイムラインバー */}
        <div className="mt-4 relative">
          <div className="w-full bg-factory-border rounded-full h-3">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-factory-amber to-orange-500 transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          {/* マイルストーンマーカー */}
          <div className="relative mt-1">
            {MILESTONES.map((m) => {
              const pos = ((m.time - GAME_START) / GAME_DURATION) * 100
              const isPassed = gameTime >= m.time
              return (
                <div
                  key={m.time}
                  className="absolute transform -translate-x-1/2"
                  style={{ left: `${pos}%` }}
                >
                  <div
                    className={`w-1 h-2 mx-auto ${isPassed ? 'bg-factory-amber' : 'bg-factory-border'}`}
                  />
                  <div
                    className={`text-[9px] font-mono mt-0.5 whitespace-nowrap ${
                      isPassed ? 'text-factory-amber' : 'text-factory-muted'
                    }`}
                  >
                    {m.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* スコアゲージ */}
      <ScoreGauge scores={scores} />

      {/* リスクポイント */}
      {gameState.riskPoints > 0 && (
        <div className="bg-factory-panel border border-factory-red/50 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono text-factory-red">⚠ リスクポイント</span>
            <span className="text-sm font-bold font-mono text-factory-red">
              {gameState.riskPoints}
            </span>
          </div>
          <div className="text-xs text-factory-subtext mt-1">
            保留が積み上がっています
          </div>
        </div>
      )}

      {/* 関係値 */}
      <div className="bg-factory-panel border border-factory-border rounded-lg p-4 flex-1">
        <h3 className="text-xs font-mono text-factory-amber uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>■</span> 関係値
        </h3>
        {characterRelations.map(({ id, name }) => (
          <RelationshipBadge
            key={id}
            name={name}
            value={relationships[id] ?? 50}
          />
        ))}
      </div>
    </div>
  )
}
