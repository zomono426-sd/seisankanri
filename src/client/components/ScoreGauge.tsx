import type { Scores } from '../../shared/types'

interface ScoreGaugeProps {
  scores: Scores
}

interface GaugeItemProps {
  label: string
  value: number
  dangerThreshold: number
  warningThreshold: number
}

function GaugeItem({ label, value, dangerThreshold, warningThreshold }: GaugeItemProps) {
  const color =
    value <= dangerThreshold
      ? 'bg-factory-red'
      : value <= warningThreshold
      ? 'bg-yellow-500'
      : 'bg-factory-green'

  const textColor =
    value <= dangerThreshold
      ? 'text-factory-red'
      : value <= warningThreshold
      ? 'text-yellow-400'
      : 'text-factory-green'

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-factory-subtext font-mono">{label}</span>
        <span className={`text-sm font-bold font-mono ${textColor}`}>{value}</span>
      </div>
      <div className="w-full bg-factory-border rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  )
}

export function ScoreGauge({ scores }: ScoreGaugeProps) {
  return (
    <div className="bg-factory-panel border border-factory-border rounded-lg p-4">
      <h3 className="text-xs font-mono text-factory-amber uppercase tracking-wider mb-4 flex items-center gap-2">
        <span>■</span> KPI STATUS
      </h3>
      <GaugeItem
        label="納期達成率"
        value={scores.deliveryRate}
        dangerThreshold={50}
        warningThreshold={70}
      />
      <GaugeItem
        label="現場信頼度"
        value={scores.fieldTrust}
        dangerThreshold={20}
        warningThreshold={40}
      />
      <GaugeItem
        label="コスト管理"
        value={scores.costControl}
        dangerThreshold={40}
        warningThreshold={60}
      />
      <GaugeItem
        label="顧客満足度"
        value={scores.customerSatisfaction}
        dangerThreshold={30}
        warningThreshold={50}
      />
    </div>
  )
}
