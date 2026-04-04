import type { WeeklyReport } from '../../shared/types'

interface Props {
  report: WeeklyReport
  onContinue: () => void
}

const gradeColors: Record<string, string> = {
  S: '#f59e0b',
  A: '#22c55e',
  B: '#3b82f6',
  C: '#f59e0b',
  D: '#ef4444',
}

export function WeeklyResultScreen({ report, onContinue }: Props) {
  const gradeColor = gradeColors[report.grade] ?? '#94a3b8'

  return (
    <div className="min-h-screen bg-factory-bg text-factory-text flex flex-col items-center justify-center font-mono p-8">
      <div className="max-w-lg w-full">
        <div className="text-center mb-6">
          <div className="text-factory-amber text-lg mb-1">第{report.week}週 終了</div>
          <div className="text-5xl font-bold mb-2" style={{ color: gradeColor }}>
            {report.grade}
          </div>
        </div>

        {/* 工場長指令達成 */}
        <div className={`text-center mb-4 p-3 rounded-lg border ${
          report.directiveAchieved ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'
        }`}>
          <div className="text-xs text-factory-muted mb-1">工場長指令</div>
          <div className="text-sm font-bold">{report.directiveTitle}</div>
          <div className={`text-sm ${report.directiveAchieved ? 'text-green-400' : 'text-red-400'}`}>
            {report.directiveAchieved ? '達成' : '未達'}
          </div>
        </div>

        {/* スコア */}
        <div className="bg-factory-panel border border-factory-border rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '納期達成率', value: report.scores.deliveryRate, weight: '35%' },
              { label: '現場信頼度', value: report.scores.fieldTrust, weight: '25%' },
              { label: 'コスト管理', value: report.scores.costControl, weight: '20%' },
              { label: '顧客満足度', value: report.scores.customerSatisfaction, weight: '20%' },
            ].map(({ label, value, weight }) => (
              <div key={label} className="text-center">
                <div className="text-xs text-factory-muted">{label}</div>
                <div className="text-xl font-bold">{value}</div>
                <div className="text-[10px] text-factory-muted">({weight})</div>
              </div>
            ))}
          </div>
        </div>

        {/* ハイライト */}
        <div className="bg-factory-panel border border-factory-border rounded-lg p-3 mb-4">
          <h4 className="text-xs text-factory-amber mb-2 font-bold">今週のハイライト</h4>
          <ul className="space-y-1 text-xs text-factory-subtext">
            {report.highlights.map((h, i) => <li key={i}>• {h}</li>)}
          </ul>
          <div className="mt-2 flex gap-4 text-xs text-factory-muted">
            <span>処理イベント: {report.eventsHandled}件</span>
            <span>サプライヤー交渉: {report.supplierInteractions}回</span>
          </div>
        </div>

        <button
          onClick={onContinue}
          className="w-full py-3 text-lg font-bold border-2 border-factory-amber text-factory-amber bg-factory-amber/10 hover:bg-factory-amber/20 rounded-lg transition-all"
        >
          次の週へ →
        </button>
      </div>
    </div>
  )
}
