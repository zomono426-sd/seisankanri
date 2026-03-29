import { useGameState } from './hooks/useGameState'
import { GameLayout } from './components/GameLayout'

function TitleScreen({ onStart, isLoading }: { onStart: () => void; isLoading: boolean }) {
  return (
    <div className="min-h-screen bg-factory-bg text-factory-text flex flex-col items-center justify-center font-mono">
      {/* 背景グリッド */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            'linear-gradient(rgba(245, 158, 11, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(245, 158, 11, 0.3) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 text-center max-w-2xl px-8">
        {/* タイトル */}
        <div className="mb-2 text-xs text-factory-muted tracking-widest uppercase">
          産業機械ATO工場 生産管理シミュレーター
        </div>
        <h1 className="text-7xl font-bold text-factory-amber tracking-tight mb-2">
          PRODUCTION
        </h1>
        <h1 className="text-7xl font-bold text-factory-red tracking-tight mb-8">
          HELL
        </h1>

        {/* キャッチコピー */}
        <div className="border border-factory-border bg-factory-panel/50 rounded-lg p-6 mb-10">
          <p className="text-factory-subtext text-sm leading-relaxed mb-4">
            「計画は朝に存在する。それが1日かけて崩れていく。」
          </p>
          <p className="text-factory-text text-sm leading-relaxed">
            あなたは東和機工株式会社の生産管理グループ リーダー。<br />
            今日の出荷計画を守りながら、降り注ぐ問題を捌き続けろ。<br />
            08:00〜17:30——完璧な解決はない。
          </p>
        </div>

        {/* 登場人物プレビュー */}
        <div className="grid grid-cols-4 gap-2 mb-10 text-xs">
          {[
            { icon: '🏭', name: '工場長\n村上 克己', color: '#dc2626' },
            { icon: '👔', name: '製造部長\n橋本 賢二', color: '#7c3aed' },
            { icon: '💼', name: '営業主任\n西村 大輔', color: '#0891b2' },
            { icon: '🔧', name: '製造職長\n谷口 正', color: '#b45309' },
          ].map((c) => (
            <div
              key={c.name}
              className="border rounded-lg p-3 text-center"
              style={{ borderColor: c.color + '44', backgroundColor: c.color + '11' }}
            >
              <div className="text-2xl mb-1">{c.icon}</div>
              <div
                className="whitespace-pre-line leading-tight font-medium"
                style={{ color: c.color }}
              >
                {c.name}
              </div>
            </div>
          ))}
        </div>

        {/* スタートボタン */}
        <button
          onClick={onStart}
          disabled={isLoading}
          className="
            px-12 py-4 text-lg font-bold border-2 border-factory-amber text-factory-amber
            bg-factory-amber/10 hover:bg-factory-amber/20
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200 rounded-lg
            hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]
          "
        >
          {isLoading ? (
            <span className="flex items-center gap-3">
              <span className="animate-spin">⚙</span>
              ゲームを準備中...
            </span>
          ) : (
            '今日の勤務を開始する'
          )}
        </button>

        <div className="mt-6 text-xs text-factory-muted">
          ※ .envファイルに GOOGLE_API_KEY を設定してください
        </div>
      </div>
    </div>
  )
}

function ResultScreen({
  evaluation,
  gameState,
  onReset,
}: {
  evaluation: { grade: string; message: string; totalScore: number }
  gameState: NonNullable<ReturnType<typeof useGameState>['gameState']>
  onReset: () => void
}) {
  const gradeColors: Record<string, string> = {
    S: '#f59e0b',
    A: '#22c55e',
    B: '#3b82f6',
    C: '#f59e0b',
    D: '#ef4444',
  }
  const gradeColor = gradeColors[evaluation.grade] ?? '#94a3b8'
  const { scores } = gameState

  return (
    <div className="min-h-screen bg-factory-bg text-factory-text flex flex-col items-center justify-center font-mono p-8">
      <div className="max-w-2xl w-full">
        {/* ゲームオーバー or 通常終了 */}
        {gameState.isGameOver && gameState.gameOverReason ? (
          <div className="text-center mb-8">
            <div className="text-factory-red text-4xl font-bold mb-2">GAME OVER</div>
            <div className="text-factory-subtext text-sm">{gameState.gameOverReason}</div>
          </div>
        ) : (
          <div className="text-center mb-8">
            <div className="text-factory-amber text-2xl mb-2">17:30 — 終業</div>
            <div className="text-factory-text text-sm">今日の生産管理が終わりました</div>
          </div>
        )}

        {/* グレード */}
        <div className="text-center mb-8">
          <div
            className="text-9xl font-bold"
            style={{ color: gradeColor }}
          >
            {evaluation.grade}
          </div>
          <div className="text-2xl font-bold mt-2" style={{ color: gradeColor }}>
            {evaluation.totalScore}点
          </div>
          <div className="text-factory-subtext text-sm mt-3">{evaluation.message}</div>
        </div>

        {/* スコア内訳 */}
        <div className="bg-factory-panel border border-factory-border rounded-lg p-6 mb-8">
          <h3 className="text-xs text-factory-amber uppercase tracking-wider mb-4">
            ■ 最終スコア内訳
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: '納期達成率', value: scores.deliveryRate, weight: '35%' },
              { label: '現場信頼度', value: scores.fieldTrust, weight: '25%' },
              { label: 'コスト管理', value: scores.costControl, weight: '20%' },
              { label: '顧客満足度', value: scores.customerSatisfaction, weight: '20%' },
            ].map(({ label, value, weight }) => (
              <div key={label} className="text-center">
                <div className="text-xs text-factory-muted">{label}</div>
                <div className="text-2xl font-bold text-factory-text">{value}</div>
                <div className="text-xs text-factory-muted">（ウェイト {weight}）</div>
              </div>
            ))}
          </div>
        </div>

        {/* MRP達成 */}
        <div className="bg-factory-panel border border-factory-border rounded-lg p-4 mb-8 text-center">
          <div className="text-xs text-factory-muted mb-1">今日の出荷実績</div>
          <div className="text-3xl font-bold text-factory-green">
            {gameState.mrpState.totalCompleted}
            <span className="text-factory-muted text-lg"> / {gameState.mrpState.totalPlanned}台</span>
          </div>
        </div>

        <button
          onClick={onReset}
          className="
            w-full py-4 text-lg font-bold border-2 border-factory-amber text-factory-amber
            bg-factory-amber/10 hover:bg-factory-amber/20 rounded-lg
            transition-all duration-200
          "
        >
          もう一度プレイする
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const {
    phase,
    gameState,
    characterResponse,
    error,
    isProcessing,
    evaluation,
    startGame,
    performAction,
    resetGame,
  } = useGameState()

  if (error) {
    return (
      <div className="min-h-screen bg-factory-bg text-factory-red flex flex-col items-center justify-center font-mono p-8">
        <div className="text-4xl mb-4">⚠</div>
        <div className="text-lg mb-2">エラーが発生しました</div>
        <div className="text-sm text-factory-subtext mb-8 max-w-lg text-center">{error}</div>
        <button
          onClick={resetGame}
          className="px-8 py-3 border border-factory-red text-factory-red hover:bg-factory-red/10 rounded-lg font-mono transition-all"
        >
          タイトルに戻る
        </button>
      </div>
    )
  }

  if (phase === 'title' || phase === 'loading') {
    return <TitleScreen onStart={startGame} isLoading={phase === 'loading'} />
  }

  if (phase === 'result' && gameState && evaluation) {
    return (
      <ResultScreen
        evaluation={evaluation}
        gameState={gameState}
        onReset={resetGame}
      />
    )
  }

  if (phase === 'playing' && gameState) {
    return (
      <GameLayout
        gameState={gameState}
        characterResponse={characterResponse}
        isProcessing={isProcessing}
        onAction={performAction}
      />
    )
  }

  return null
}
