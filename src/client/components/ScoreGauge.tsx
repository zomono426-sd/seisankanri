// ヘッダー用コンパクトスコアゲージ
interface Props {
  label: string
  value: number
  danger: number
  warn: number
}

export function ScoreGauge({ label, value, danger, warn }: Props) {
  const color = value <= danger ? 'text-red-400' : value <= warn ? 'text-yellow-400' : 'text-green-400'
  const barColor = value <= danger ? 'bg-red-500' : value <= warn ? 'bg-yellow-500' : 'bg-green-500'

  return (
    <div className="text-center w-12">
      <div className="text-[10px] text-factory-muted">{label}</div>
      <div className={`text-xs font-bold ${color}`}>{value}</div>
      <div className="h-1 bg-factory-border rounded-full overflow-hidden mt-0.5">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
