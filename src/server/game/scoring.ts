import type {
  ActionOutcome,
  CharacterId,
  GameState,
  PlayerAction,
  Scores,
} from '../../shared/types.js'
import type { FailureLevel } from './probability.js'

// スコア変動テーブル: イベントID × アクションID → スコア変動
const SCORE_DELTAS: Record<
  string,
  Record<string, Partial<Scores>>
> = {
  // E1: 設備アラーム
  E1_equipment_alarm: {
    self_fix: { costControl: -5, deliveryRate: +3 },
    dispatch_tanaka: { deliveryRate: +2 },
    dispatch_sasaki: { deliveryRate: +1 },
    defer: { deliveryRate: -10, riskPoints: 15 } as Partial<Scores> & { riskPoints?: number },
  },
  // E2: 部品入荷遅れ
  E2_parts_delay: {
    self_alternative: { costControl: -8, deliveryRate: +5 },
    dispatch_wood_change: { deliveryRate: +3 },
    reschedule: { deliveryRate: +2, fieldTrust: +3 },
    defer_e2: { deliveryRate: -15, riskPoints: 20 } as Partial<Scores> & { riskPoints?: number },
  },
  // E3: 仕様変更
  E3_spec_change: {
    accept_change: { costControl: -10, deliveryRate: -5, customerSatisfaction: +5 },
    negotiate_delay: { customerSatisfaction: -5, deliveryRate: -3 },
    dispatch_confirm: { deliveryRate: 0 },
    reject_change: { customerSatisfaction: -15 },
  },
  // E4: 連鎖危機
  E4_chain_crisis: {
    emergency_response: { costControl: -15, deliveryRate: +10 },
    prioritize_orders: { deliveryRate: -5, customerSatisfaction: -5 },
    dispatch_sasaki_resolve: { deliveryRate: +3 },
    defer_e4: { deliveryRate: -20 },
  },
  // E5: 中間デッドライン
  E5_midday_deadline: {
    check_status: { deliveryRate: +2 },
    emergency_meeting: { fieldTrust: +5, deliveryRate: +3 },
  },
  // E6: 外注品質問題
  E6_quality_issue: {
    accept_partial: { customerSatisfaction: -5 },
    urgent_replacement: { customerSatisfaction: +3 },
    dispatch_tanaka_qa: { customerSatisfaction: -3 },
    defer_e6: { customerSatisfaction: -10, riskPoints: 10 } as Partial<Scores> & { riskPoints?: number },
  },
  // E7: コストプレッシャー
  E7_cost_pressure: {
    report_honestly: { fieldTrust: +3 },
    minimize_overtime: { costControl: +10, deliveryRate: -5 },
    delay_answer: { costControl: -3, riskPoints: 5 } as Partial<Scores> & { riskPoints?: number },
  },
  // E8: 最終デッドライン
  E8_final_deadline: {
    finalize_shipping: { deliveryRate: +5 },
    all_hands: { costControl: -15, deliveryRate: +10 },
  },
  // E9: 工場長登場
  E9_factory_manager: {
    show_plan: { fieldTrust: +10, deliveryRate: +5 },
    request_support: { deliveryRate: +8, costControl: -5 },
  },
}

// 関係値変動テーブル
const RELATIONSHIP_DELTAS: Record<
  string,
  Record<string, Partial<Record<CharacterId, number>>>
> = {
  E1_equipment_alarm: {
    self_fix: { workshop: +5 },
    dispatch_tanaka: { workshop: +2 },
    dispatch_sasaki: { workshop: -2 },  // 谷口は佐々木が苦手
    defer: { workshop: -10 },
  },
  E2_parts_delay: {
    self_alternative: { procurement: +5 },
    dispatch_wood_change: { procurement: +3 },
    reschedule: { workshop: +5, procurement: +3 },
    defer_e2: { procurement: -8, workshop: -5 },
  },
  E3_spec_change: {
    accept_change: { sales: +3 },
    negotiate_delay: { sales: -5 },
    dispatch_confirm: { sales: 0 },
    reject_change: { sales: -10, subcontractor: 0 },
  },
  E4_chain_crisis: {
    emergency_response: { workshop: +5 },
    prioritize_orders: { workshop: +3 },
    dispatch_sasaki_resolve: { workshop: -3 },
    defer_e4: { workshop: -15 },
  },
  E5_midday_deadline: {
    check_status: {},
    emergency_meeting: { workshop: +5, procurement: +3 },
  },
  E6_quality_issue: {
    accept_partial: { subcontractor: +5 },
    urgent_replacement: { subcontractor: -8 },
    dispatch_tanaka_qa: { subcontractor: -2 },
    defer_e6: { subcontractor: +5 },
  },
  E7_cost_pressure: {
    report_honestly: { dept_manager: +5 },
    minimize_overtime: { dept_manager: +8, workshop: -5 },
    delay_answer: { dept_manager: -5 },
  },
  E8_final_deadline: {
    finalize_shipping: {},
    all_hands: { workshop: -5 },
  },
  E9_factory_manager: {
    show_plan: { factory_manager: +15 },
    request_support: { factory_manager: +10 },
  },
}

// 失敗時のスコアペナルティ
const FAILURE_PENALTIES: Record<FailureLevel, Partial<Scores>> = {
  minor: { deliveryRate: -3 },
  moderate: { deliveryRate: -7, customerSatisfaction: -3 },
  severe: { deliveryRate: -12, customerSatisfaction: -7, fieldTrust: -5 },
  critical: { deliveryRate: -20, customerSatisfaction: -10, fieldTrust: -10 },
}

// スコア適用（0〜100の範囲にクランプ）
export function applyScoreDelta(
  current: Scores,
  delta: Partial<Scores>
): Scores {
  return {
    deliveryRate: clamp((current.deliveryRate ?? 0) + (delta.deliveryRate ?? 0), 0, 100),
    fieldTrust: clamp((current.fieldTrust ?? 0) + (delta.fieldTrust ?? 0), 0, 100),
    costControl: clamp((current.costControl ?? 0) + (delta.costControl ?? 0), 0, 100),
    customerSatisfaction: clamp(
      (current.customerSatisfaction ?? 0) + (delta.customerSatisfaction ?? 0),
      0,
      100
    ),
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

// アクション結果からスコア変動を計算
export function calcScoreDeltas(
  eventId: string,
  choiceId: string,
  success: boolean,
  failureLevel?: FailureLevel
): Partial<Scores> {
  const base = SCORE_DELTAS[eventId]?.[choiceId] ?? {}
  if (!success && failureLevel) {
    const penalty = FAILURE_PENALTIES[failureLevel]
    return {
      deliveryRate: (base.deliveryRate ?? 0) + (penalty.deliveryRate ?? 0),
      fieldTrust: (base.fieldTrust ?? 0) + (penalty.fieldTrust ?? 0),
      costControl: (base.costControl ?? 0) + (penalty.costControl ?? 0),
      customerSatisfaction:
        (base.customerSatisfaction ?? 0) + (penalty.customerSatisfaction ?? 0),
    }
  }
  return base
}

// 関係値変動を計算
export function calcRelationshipDeltas(
  eventId: string,
  choiceId: string,
  success: boolean,
  failureLevel?: FailureLevel
): Partial<Record<CharacterId, number>> {
  const base = RELATIONSHIP_DELTAS[eventId]?.[choiceId] ?? {}
  if (!success && failureLevel) {
    // 失敗時は関係値がさらに下がる
    const penaltyMultiplier = failureLevel === 'critical' ? 2 : 1
    const adjusted: Partial<Record<CharacterId, number>> = {}
    for (const [key, val] of Object.entries(base)) {
      adjusted[key as CharacterId] = (val ?? 0) - 5 * penaltyMultiplier
    }
    return adjusted
  }
  return base
}

// ゲームオーバー判定
export function checkGameOver(state: GameState): {
  isOver: boolean
  reason?: string
} {
  const { scores, relationships } = state
  if (scores.deliveryRate <= 50) {
    return {
      isOver: true,
      reason: '納期達成率が50%以下になりました。今日の出荷計画は深刻な状態です。',
    }
  }
  if (relationships.workshop <= 20) {
    return {
      isOver: true,
      reason:
        '製造職長 谷口との関係が壊れました。現場からの情報が完全に遮断されました。',
    }
  }
  if (scores.customerSatisfaction <= 0) {
    return {
      isOver: true,
      reason: '顧客満足度がゼロになりました。失注・クレームが確定しました。',
    }
  }
  return { isOver: false }
}

// 保留リスクポイントによる連鎖イベント発動判定
export function shouldTriggerChainEvent(riskPoints: number): boolean {
  return riskPoints >= 30
}

// 最終スコア評価
export function evaluateFinalScore(state: GameState): {
  grade: 'S' | 'A' | 'B' | 'C' | 'D'
  message: string
  totalScore: number
} {
  const { scores, mrpState } = state
  const deliveryActual =
    mrpState.totalPlanned > 0
      ? (mrpState.totalCompleted / mrpState.totalPlanned) * 100
      : 0

  const total =
    scores.deliveryRate * 0.35 +
    scores.fieldTrust * 0.25 +
    scores.costControl * 0.2 +
    scores.customerSatisfaction * 0.2

  let grade: 'S' | 'A' | 'B' | 'C' | 'D'
  let message: string

  if (total >= 85) {
    grade = 'S'
    message = '完璧な生産管理。今日の1日は伝説になる。'
  } else if (total >= 70) {
    grade = 'A'
    message = 'よくやった。大きな問題なく1日を乗り切った。'
  } else if (total >= 55) {
    grade = 'B'
    message = '何とか乗り切ったが、積み残しも多い。'
  } else if (total >= 40) {
    grade = 'C'
    message = '今日は厳しかった。明日への教訓を見つけよう。'
  } else {
    grade = 'D'
    message = 'PRODUCTION HELL——今日の1日はまさに地獄だった。'
  }

  return { grade, message, totalScore: Math.round(total) }
}
