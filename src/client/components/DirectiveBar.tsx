import type { FactoryDirective, Scores } from '../../shared/types'

interface Props {
  directive: FactoryDirective | null
  currentScores: Scores
}

export function DirectiveBar({ directive, currentScores }: Props) {
  if (!directive) return null

  const currentValue = currentScores[directive.targetKpi]
  const progress = Math.min(100, (currentValue / directive.targetValue) * 100)
  const isAchieved = currentValue >= directive.targetValue

  return (
    <div className={`border rounded-lg px-3 py-2 flex items-center gap-3 text-xs ${
      isAchieved ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'
    }`}>
      <span className="text-lg">🏭</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-red-400 font-bold uppercase text-[10px]">工場長指令</span>
          <span className="text-factory-text font-medium truncate">{directive.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-factory-border rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isAchieved ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className={isAchieved ? 'text-green-400' : 'text-red-400'}>
            {currentValue}/{directive.targetValue}
          </span>
        </div>
      </div>
      {isAchieved && <span className="text-green-400 text-lg">✓</span>}
    </div>
  )
}
