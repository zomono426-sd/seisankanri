import type { CharacterId, DispatchParams } from '../../shared/types.js'

// 関係値マトリクス: dispatcher × target → ベース成功率
// 値は 0.0〜1.0
const RELATIONSHIP_MATRIX: Record<string, Record<string, number>> = {
  subordinate1: {  // 田中 美咲
    workshop: 0.40,       // 萎縮する
    dept_manager: 0.50,
    sales: 0.35,          // 押し切られやすい
    procurement: 0.55,
    subcontractor: 0.35,  // 面識薄い
    factory_manager: 0.35,
    subordinate2: 0.70,
    subordinate1: 0.80,
  },
  subordinate2: {  // 佐々木 健太
    workshop: 0.40,       // 苦手
    dept_manager: 0.55,
    sales: 0.80,          // 同期で仲がいい
    procurement: 0.75,    // 高い
    subcontractor: 0.60,
    factory_manager: 0.45,
    subordinate1: 0.70,
    subordinate2: 0.80,
  },
}

// ベース確率取得（マトリクス定義にない場合は0.5）
function getBaseRate(dispatcher: CharacterId, target: CharacterId): number {
  return RELATIONSHIP_MATRIX[dispatcher]?.[target] ?? 0.5
}

// 部下派遣の成功確率を計算する
export function calcDispatchSuccessRate(params: DispatchParams): number {
  const { dispatcher, target, currentRelationship, instructionQuality } = params

  const baseRate = getBaseRate(dispatcher, target)

  // 関係値による補正（現在の関係値が高いほどベースに加算）
  const relationshipBonus = ((currentRelationship - 50) / 100) * 0.2

  // 指示の明確さによる補正（0-1 → -0.1〜+0.1）
  const instructionBonus = (instructionQuality - 0.5) * 0.2

  // ランダム揺らぎ（±12.5%）
  const noise = (Math.random() - 0.5) * 0.25

  const rate = baseRate + relationshipBonus + instructionBonus + noise
  return Math.min(1.0, Math.max(0.0, rate))
}

// 自分で動く場合の成功率（プレイヤーは常に高い）
export function calcSelfSuccessRate(): number {
  const noise = (Math.random() - 0.5) * 0.1
  return Math.min(1.0, 0.92 + noise)
}

// 失敗レベルの判定
export type FailureLevel = 'minor' | 'moderate' | 'severe' | 'critical'

export function getFailureLevel(successRate: number, rolledRate: number): FailureLevel {
  const gap = successRate - rolledRate
  if (gap < 0.15) return 'minor'
  if (gap < 0.35) return 'moderate'
  if (gap < 0.55) return 'severe'
  return 'critical'
}

// 失敗レベルの日本語説明
export const FAILURE_DESCRIPTIONS: Record<FailureLevel, string> = {
  minor: '伝わらなかった（再送が必要）',
  moderate: '相手が不機嫌になった',
  severe: '間違えて伝えた（誤情報が広がる）',
  critical: '相手に断られた',
}
