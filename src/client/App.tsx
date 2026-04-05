import { useGameState } from './hooks/useGameState'
import { GameLayout } from './components/GameLayout'
import { WeeklyResultScreen } from './components/WeeklyResultScreen'
import type { MonthlyReport } from '../shared/types'

// --- タイトル画面 ---
function TitleScreen({ onStart, isLoading }: { onStart: () => void; isLoading: boolean }) {
  return (
    <div className="min-h-screen bg-factory-bg text-factory-text flex flex-col items-center justify-center font-mono">
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            'linear-gradient(rgba(245, 158, 11, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(245, 158, 11, 0.3) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="relative z-10 text-center max-w-2xl px-8">
        <div className="mb-2 text-xs text-factory-muted tracking-widest uppercase">
          産業機械ATO工場 生産管理シミュレーター
        </div>
        <h1 className="text-7xl font-bold text-factory-amber tracking-tight mb-2">PRODUCTION</h1>
        <h1 className="text-7xl font-bold text-factory-red tracking-tight mb-8">HELL</h1>

        <div className="border border-factory-border bg-factory-panel/50 rounded-lg p-6 mb-8">
          <p className="text-factory-subtext text-sm leading-relaxed mb-4">
            「計画は月曜日に存在する。それが1ヶ月かけて崩れていく。」
          </p>
          <p className="text-factory-text text-sm leading-relaxed">
            あなたは東和機工株式会社の生産管理グループ リーダー。<br />
            4週間、工場を回し続けろ。営業・調達・製造——3部門の調整が鍵だ。<br />
            工場長の指令は絶対。サプライヤーとの関係構築が命綱。<br />
            設備は壊れ、人は休む。完璧な解決はない。
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-8 text-xs">
          {[
            { icon: '🏭', name: '工場長\n村上 克己', color: '#dc2626' },
            { icon: '💼', name: '営業主任\n西村 大輔', color: '#0891b2' },
            { icon: '📦', name: '調達担当\n木村 隆', color: '#15803d' },
            { icon: '🔧', name: '製造職長\n谷口 正', color: '#b45309' },
          ].map(c => (
            <div
              key={c.name}
              className="border rounded-lg p-3 text-center"
              style={{ borderColor: c.color + '44', backgroundColor: c.color + '11' }}
            >
              <div className="text-2xl mb-1">{c.icon}</div>
              <div className="whitespace-pre-line leading-tight font-medium" style={{ color: c.color }}>
                {c.name}
              </div>
            </div>
          ))}
        </div>

        {/* ゲーム概要 */}
        <div className="grid grid-cols-3 gap-3 mb-8 text-xs">
          <div className="border border-factory-border rounded-lg p-3 text-center">
            <div className="text-factory-amber font-bold mb-1">4週間</div>
            <div className="text-factory-muted">月〜金 x 4週 = 20日</div>
          </div>
          <div className="border border-factory-border rounded-lg p-3 text-center">
            <div className="text-factory-amber font-bold mb-1">3部門調整</div>
            <div className="text-factory-muted">営業・調達・製造</div>
          </div>
          <div className="border border-factory-border rounded-lg p-3 text-center">
            <div className="text-factory-amber font-bold mb-1">5社サプライヤー</div>
            <div className="text-factory-muted">関係構築が鍵</div>
          </div>
        </div>

        <button
          onClick={onStart}
          disabled={isLoading}
          className="px-12 py-4 text-lg font-bold border-2 border-factory-amber text-factory-amber bg-factory-amber/10 hover:bg-factory-amber/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 rounded-lg hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
        >
          {isLoading ? (
            <span className="flex items-center gap-3">
              <span className="animate-spin">⚙</span> ゲームを準備中...
            </span>
          ) : (
            '今月の勤務を開始する'
          )}
        </button>
        <div className="mt-4 text-xs text-factory-muted">
          ※ .envファイルに GOOGLE_API_KEY を設定してください
        </div>
      </div>
    </div>
  )
}

// --- 月次結果画面 ---
function MonthlyResultScreen({
  report,
  onReset,
}: {
  report: MonthlyReport
  onReset: () => void
}) {
  const gradeColors: Record<string, string> = {
    S: '#f59e0b', A: '#22c55e', B: '#3b82f6', C: '#f59e0b', D: '#ef4444',
  }
  const gradeColor = gradeColors[report.grade] ?? '#94a3b8'

  return (
    <div className="min-h-screen bg-factory-bg text-factory-text flex flex-col items-center justify-center font-mono p-8">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-6">
          <div className="text-factory-amber text-2xl mb-2">1ヶ月終了 — 総合評価</div>
        </div>

        <div className="text-center mb-6">
          <div className="text-9xl font-bold" style={{ color: gradeColor }}>{report.grade}</div>
          <div className="text-2xl font-bold mt-2" style={{ color: gradeColor }}>{report.totalScore}点</div>
          <div className="text-factory-subtext text-sm mt-3">{report.message}</div>
        </div>

        {/* 週ごとの評価 */}
        <div className="bg-factory-panel border border-factory-border rounded-lg p-4 mb-6">
          <h3 className="text-xs text-factory-amber uppercase tracking-wider mb-3 font-bold">週別評価</h3>
          <div className="grid grid-cols-4 gap-2">
            {report.weeklyReports.map(w => (
              <div key={w.week} className="text-center border border-factory-border rounded-lg p-2">
                <div className="text-xs text-factory-muted mb-1">第{w.week}週</div>
                <div className="text-2xl font-bold" style={{ color: gradeColors[w.grade] ?? '#94a3b8' }}>{w.grade}</div>
                <div className={`text-xs mt-1 ${w.directiveAchieved ? 'text-green-400' : 'text-red-400'}`}>
                  指令{w.directiveAchieved ? '達成' : '未達'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 最終スコア */}
        <div className="bg-factory-panel border border-factory-border rounded-lg p-4 mb-6">
          <h3 className="text-xs text-factory-amber uppercase tracking-wider mb-3 font-bold">最終スコア内訳</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '納期達成率', value: report.finalScores.deliveryRate, weight: '35%' },
              { label: '現場信頼度', value: report.finalScores.fieldTrust, weight: '25%' },
              { label: 'コスト管理', value: report.finalScores.costControl, weight: '20%' },
              { label: '顧客満足度', value: report.finalScores.customerSatisfaction, weight: '20%' },
            ].map(({ label, value, weight }) => (
              <div key={label} className="text-center">
                <div className="text-xs text-factory-muted">{label}</div>
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-xs text-factory-muted">({weight})</div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onReset}
          className="w-full py-4 text-lg font-bold border-2 border-factory-amber text-factory-amber bg-factory-amber/10 hover:bg-factory-amber/20 rounded-lg transition-all duration-200"
        >
          もう一度プレイする
        </button>
      </div>
    </div>
  )
}

// --- メインApp ---
export default function App() {
  const {
    phase,
    gameState,
    characterResponse,
    error,
    isProcessing,
    weeklyReport,
    monthlyReport,
    impactAnalysis,
    startGame,
    performAction,
    advanceDay,
    continueToNextWeek,
    investigate,
    startAssembly,
    updateProductionPlan,
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

  if (phase === 'weekResult' && weeklyReport) {
    return <WeeklyResultScreen report={weeklyReport} onContinue={continueToNextWeek} />
  }

  if (phase === 'monthResult' && monthlyReport) {
    return <MonthlyResultScreen report={monthlyReport} onReset={resetGame} />
  }

  if (phase === 'playing' && gameState) {
    return (
      <GameLayout
        gameState={gameState}
        characterResponse={characterResponse}
        impactAnalysis={impactAnalysis}
        isProcessing={isProcessing}
        onAction={performAction}
        onInvestigate={investigate}
        onAdvanceDay={advanceDay}
        onStartAssembly={startAssembly}
        onUpdateProductionPlan={updateProductionPlan}
      />
    )
  }

  return null
}
