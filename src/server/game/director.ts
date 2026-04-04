import type { FactoryDirective, Scores } from '../../shared/types.js'

// ============================================================
// 工場長システム — 神的存在としての工場長 村上
// 毎週の頭に1つの大方針（指令）を出す。拒否不可。
// ============================================================

interface DirectiveTemplate {
  id: string
  title: string
  description: string
  targetKpi: keyof Scores
  targetDelta: number  // 現在値からの改善目標
}

const DIRECTIVE_TEMPLATES: DirectiveTemplate[] = [
  {
    id: 'cost_reduction',
    title: 'コスト20%削減命令',
    description: '工場長 村上：「今週はコスト管理を徹底しろ。残業は最小限、外注費も抑えろ。言い訳はいい、数字で見せてくれ。」',
    targetKpi: 'costControl',
    targetDelta: 10,
  },
  {
    id: 'delivery_strict',
    title: '納期厳守命令',
    description: '工場長 村上：「今週の出荷は1台も遅らせるな。客先から催促が来てる。どうするんだ、松田くん。」',
    targetKpi: 'deliveryRate',
    targetDelta: 5,
  },
  {
    id: 'quality_focus',
    title: '品質強化命令',
    description: '工場長 村上：「先月のクレーム件数が多すぎる。今週は品質検査を倍にしろ。不良品は絶対に出すな。」',
    targetKpi: 'customerSatisfaction',
    targetDelta: 8,
  },
  {
    id: 'trust_building',
    title: '現場との連携強化命令',
    description: '工場長 村上：「最近、現場と管理の意思疎通がなってない。今週は現場に足を運んで声を聞け。机の上で管理するな。」',
    targetKpi: 'fieldTrust',
    targetDelta: 10,
  },
]

// 今週の指令を生成
export function generateDirective(weekNumber: number, currentScores: Scores): FactoryDirective {
  // 週番号に基づきつつ、最もスコアが低いKPIを優先する知恵
  const kpiValues: [keyof Scores, number][] = [
    ['deliveryRate', currentScores.deliveryRate],
    ['fieldTrust', currentScores.fieldTrust],
    ['costControl', currentScores.costControl],
    ['customerSatisfaction', currentScores.customerSatisfaction],
  ]
  kpiValues.sort((a, b) => a[1] - b[1])
  const weakestKpi = kpiValues[0][0]

  // 最も弱いKPIに対応するテンプレートを選択（なければローテーション）
  let template = DIRECTIVE_TEMPLATES.find(t => t.targetKpi === weakestKpi)
  if (!template) {
    template = DIRECTIVE_TEMPLATES[(weekNumber - 1) % DIRECTIVE_TEMPLATES.length]
  }

  const currentValue = currentScores[template.targetKpi]
  const targetValue = Math.min(100, currentValue + template.targetDelta)

  return {
    id: `directive_w${weekNumber}_${template.id}`,
    week: weekNumber,
    title: template.title,
    description: template.description,
    targetKpi: template.targetKpi,
    targetValue,
    currentValue,
    isAchieved: false,
  }
}

// 指令の達成度を評価
export function evaluateDirective(directive: FactoryDirective, currentScores: Scores): {
  achieved: boolean
  message: string
  bonusScore: number
} {
  const currentValue = currentScores[directive.targetKpi]
  const achieved = currentValue >= directive.targetValue

  if (achieved) {
    return {
      achieved: true,
      message: `工場長指令「${directive.title}」を達成。村上：「よくやった。引き続き頼むぞ。」`,
      bonusScore: 5,
    }
  }

  const gap = directive.targetValue - currentValue
  if (gap <= 3) {
    return {
      achieved: false,
      message: `工場長指令「${directive.title}」は惜しくも未達。村上：「もう少しだったな。来週に期待する。」`,
      bonusScore: -2,
    }
  }

  return {
    achieved: false,
    message: `工場長指令「${directive.title}」は未達。村上：「話にならん。来週はもっと気合を入れろ。」`,
    bonusScore: -8,
  }
}
