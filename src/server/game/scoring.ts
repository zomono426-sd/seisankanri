import type {
  GameState,
  Scores,
  WeeklyReport,
  MonthlyReport,
  CharacterId,
  FactoryDirective,
} from '../../shared/types.js'
import type { FailureLevel } from './probability.js'
import { evaluateDirective } from './director.js'

// ============================================================
// スコアリング — 週次評価 + 月次総合評価
// ============================================================

// --- スコア変動テーブル（イベントID × 選択ID） ---
const SCORE_DELTAS: Record<string, Record<string, Partial<Scores>>> = {
  // 営業系
  S1_rush_order: {
    accept_rush: { costControl: -8, deliveryRate: -3, customerSatisfaction: +8 },
    negotiate_deadline: { customerSatisfaction: -3, deliveryRate: 0 },
    reject_rush: { customerSatisfaction: -12 },
  },
  S2_spec_change: {
    accept_spec: { costControl: -10, deliveryRate: -5, customerSatisfaction: +5 },
    investigate_spec: { deliveryRate: 0 },
    delegate_confirm: { deliveryRate: 0 },
    reject_spec: { customerSatisfaction: -15 },
  },
  S3_customer_complaint: {
    self_handle_complaint: { customerSatisfaction: +5, fieldTrust: +3 },
    dispatch_sasaki_complaint: { customerSatisfaction: +2 },
    defer_complaint: { customerSatisfaction: -15 },
  },
  S4_new_inquiry: {
    capacity_study: { customerSatisfaction: +3, deliveryRate: +2 },
    optimistic_reply: { customerSatisfaction: +5, deliveryRate: -5 },
    defer_inquiry: { customerSatisfaction: -5 },
  },
  // 調達系
  P1_parts_delay: {
    find_alternative: { costControl: -5, deliveryRate: +5 },
    delegate_procurement: { deliveryRate: +3 },
    reschedule_production: { deliveryRate: +2, fieldTrust: +3 },
    defer_delay: { deliveryRate: -15 },
  },
  P2_price_increase: {
    negotiate_price: { costControl: +3 },
    find_cheaper: { costControl: +5, customerSatisfaction: -3 },
    accept_increase: { costControl: -8 },
  },
  P3_quality_issue: {
    accept_partial: { deliveryRate: -3, customerSatisfaction: -3 },
    demand_urgent: { deliveryRate: +3, customerSatisfaction: +2 },
    delegate_qa: { customerSatisfaction: -2 },
  },
  // 製造系
  M1_line_trouble: {
    stop_and_fix: { deliveryRate: -5, costControl: -5, fieldTrust: +5 },
    manual_switch: { deliveryRate: +2, fieldTrust: -3 },
    delegate_workshop: { deliveryRate: +2 },
    defer_trouble: { deliveryRate: -10, fieldTrust: -5 },
  },
  M2_bottleneck: {
    add_workers: { deliveryRate: +3, fieldTrust: +2 },
    reprioritize: { deliveryRate: +2, fieldTrust: +3 },
    overtime: { deliveryRate: +5, costControl: -8, fieldTrust: -3 },
  },
  M3_quality_escape: {
    rework_priority: { deliveryRate: -3, customerSatisfaction: +5 },
    delegate_rework: { customerSatisfaction: +3 },
    defer_rework: { customerSatisfaction: -10 },
  },
  // 能力系
  C1_equipment_breakdown: {
    call_repair: { costControl: -10, deliveryRate: +5 },
    manual_weld: { deliveryRate: +2, fieldTrust: -3 },
    reassign_work: { deliveryRate: +3 },
  },
  C2_worker_absence: {
    reassign_workers: { deliveryRate: +3, fieldTrust: +2 },
    reduce_plan: { deliveryRate: -5 },
    overtime_others: { deliveryRate: +3, costControl: -5, fieldTrust: -3 },
  },
  C3_overtime_limit: {
    accept_limit: { costControl: +10, deliveryRate: -5 },
    request_exception: { costControl: -3 },
    efficiency_up: { costControl: +5, fieldTrust: +5 },
  },
  C4_maintenance_due: {
    do_maintenance: { deliveryRate: -5, fieldTrust: +5 },
    postpone_maintenance: { deliveryRate: +3, fieldTrust: -3 },
    partial_maintenance: { deliveryRate: -2, fieldTrust: +2 },
  },
  // 在庫系
  INV1_lead_time_overrun: {
    overtime_production: { costControl: -8, deliveryRate: +5 },
    transfer_workers: { deliveryRate: +3, fieldTrust: -3 },
    negotiate_delivery: { deliveryRate: -3, customerSatisfaction: -5 },
  },
  INV2_custom_spec: {
    add_special_process: { costControl: -12, customerSatisfaction: +8 },
    propose_standard: { customerSatisfaction: -5, costControl: +3 },
    delegate_design: { deliveryRate: -2 },
  },
  INV3_safety_stock_breach: {
    emergency_production: { deliveryRate: +5, costControl: -5, fieldTrust: -3 },
    accelerate_plan: { deliveryRate: +3, costControl: -3 },
    defer_safety: { deliveryRate: -10 },
  },
  INV4_weekly_plan_review: {
    replan_self: { deliveryRate: +5, costControl: +3 },
    delegate_replan: { deliveryRate: +2 },
    keep_plan: { deliveryRate: -5, costControl: -3 },
  },
  INV5_excess_inventory: {
    slow_production: { costControl: +5, deliveryRate: -3 },
    push_sales: { costControl: +3, customerSatisfaction: +2 },
    defer_excess: { costControl: -5 },
  },
  INV6_material_delay: {
    urgent_delivery: { costControl: -5, deliveryRate: +5 },
    use_alternative: { deliveryRate: +2, customerSatisfaction: -3 },
    wait_resequence: { deliveryRate: -5, costControl: +2 },
  },
  INV7_incoming_rejection: {
    demand_replacement: { deliveryRate: +3, costControl: -3 },
    sort_and_use: { deliveryRate: +2, customerSatisfaction: -5 },
    delegate_analysis: { deliveryRate: -2 },
  },
  INV8_raw_safety_alert: {
    order_urgent: { costControl: -5, deliveryRate: +3 },
    increase_next_order: { costControl: -2 },
    run_lean: { deliveryRate: -5, costControl: +3 },
  },
  // 工場長指令（受領のみ）
  D1_cost_reduction: { acknowledge_cost: {} },
  D2_delivery_push: { acknowledge_delivery: {} },
  D3_quality_focus: { acknowledge_quality: {} },
  D4_capacity_increase: { acknowledge_increase: {} },
}

// --- 関係値変動テーブル ---
const RELATIONSHIP_DELTAS: Record<string, Record<string, Partial<Record<CharacterId, number>>>> = {
  S1_rush_order: {
    accept_rush: { sales: +5, workshop: -3 },
    negotiate_deadline: { sales: -5 },
    reject_rush: { sales: -10 },
  },
  S2_spec_change: {
    accept_spec: { sales: +3 },
    investigate_spec: {},
    delegate_confirm: {},
    reject_spec: { sales: -10 },
  },
  S3_customer_complaint: {
    self_handle_complaint: { sales: +5, workshop: +3 },
    dispatch_sasaki_complaint: { subordinate2: +3 },
    defer_complaint: { sales: -8 },
  },
  M1_line_trouble: {
    stop_and_fix: { workshop: +5 },
    manual_switch: { workshop: -5 },
    delegate_workshop: { workshop: +3 },
    defer_trouble: { workshop: -10 },
  },
  M2_bottleneck: {
    add_workers: { workshop: +3 },
    reprioritize: { workshop: +5 },
    overtime: { workshop: -5 },
  },
  P1_parts_delay: {
    find_alternative: { procurement: +5 },
    delegate_procurement: { procurement: +3 },
    reschedule_production: { workshop: +3, procurement: +2 },
    defer_delay: { procurement: -8, workshop: -5 },
  },
  P3_quality_issue: {
    accept_partial: {},
    demand_urgent: {},
    delegate_qa: { subordinate1: +2 },
  },
  C1_equipment_breakdown: {
    call_repair: { workshop: +3 },
    manual_weld: { workshop: -3 },
    reassign_work: { workshop: +2 },
  },
  C2_worker_absence: {
    reassign_workers: { workshop: +3 },
    reduce_plan: {},
    overtime_others: { workshop: -5 },
  },
  // 在庫系
  INV1_lead_time_overrun: {
    overtime_production: { workshop: -5 },
    transfer_workers: { workshop: -3 },
    negotiate_delivery: { sales: -3 },
  },
  INV2_custom_spec: {
    add_special_process: { sales: +3 },
    propose_standard: { sales: -3 },
    delegate_design: { subordinate1: +2 },
  },
  INV3_safety_stock_breach: {
    emergency_production: { workshop: -3 },
    accelerate_plan: { workshop: +2 },
    defer_safety: { procurement: -5 },
  },
  INV4_weekly_plan_review: {
    replan_self: { dept_manager: +3 },
    delegate_replan: { subordinate2: +3 },
    keep_plan: { dept_manager: -5 },
  },
  INV5_excess_inventory: {
    slow_production: { workshop: +2, dept_manager: +3 },
    push_sales: { sales: +3 },
    defer_excess: { dept_manager: -3 },
  },
  INV6_material_delay: {
    urgent_delivery: { procurement: +3 },
    use_alternative: {},
    wait_resequence: { workshop: -3 },
  },
  INV7_incoming_rejection: {
    demand_replacement: { procurement: +2 },
    sort_and_use: {},
    delegate_analysis: { subordinate1: +2 },
  },
  INV8_raw_safety_alert: {
    order_urgent: { procurement: +3 },
    increase_next_order: {},
    run_lean: { procurement: -3 },
  },
}

// 失敗時のスコアペナルティ
const FAILURE_PENALTIES: Record<FailureLevel, Partial<Scores>> = {
  minor: { deliveryRate: -3 },
  moderate: { deliveryRate: -7, customerSatisfaction: -3 },
  severe: { deliveryRate: -12, customerSatisfaction: -7, fieldTrust: -5 },
  critical: { deliveryRate: -20, customerSatisfaction: -10, fieldTrust: -10 },
}

// --- スコア適用（0〜100） ---
export function applyScoreDelta(current: Scores, delta: Partial<Scores>): Scores {
  return {
    deliveryRate: clamp((current.deliveryRate ?? 0) + (delta.deliveryRate ?? 0), 0, 100),
    fieldTrust: clamp((current.fieldTrust ?? 0) + (delta.fieldTrust ?? 0), 0, 100),
    costControl: clamp((current.costControl ?? 0) + (delta.costControl ?? 0), 0, 100),
    customerSatisfaction: clamp((current.customerSatisfaction ?? 0) + (delta.customerSatisfaction ?? 0), 0, 100),
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

// スコア変動を計算
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
      customerSatisfaction: (base.customerSatisfaction ?? 0) + (penalty.customerSatisfaction ?? 0),
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
    const penaltyMultiplier = failureLevel === 'critical' ? 2 : 1
    const adjusted: Partial<Record<CharacterId, number>> = {}
    for (const [key, val] of Object.entries(base)) {
      adjusted[key as CharacterId] = (val ?? 0) - 5 * penaltyMultiplier
    }
    return adjusted
  }
  return base
}

// --- ゲームオーバー判定 ---
export function checkGameOver(state: GameState): {
  isOver: boolean
  reason?: string
} {
  const { scores, relationships } = state
  if (scores.deliveryRate <= 30) {
    return { isOver: true, reason: '納期達成率が30%以下になりました。出荷計画は壊滅的な状態です。' }
  }
  if (relationships.workshop <= 15) {
    return { isOver: true, reason: '製造職長 谷口との関係が壊れました。現場からの協力が得られません。' }
  }
  if (scores.customerSatisfaction <= 10) {
    return { isOver: true, reason: '顧客満足度が危機的水準に。主要顧客からの取引停止通告。' }
  }
  return { isOver: false }
}

// --- 週次評価 ---
export function evaluateWeekly(state: GameState): WeeklyReport {
  const { scores } = state
  const directive = state.activeDirective

  const directiveResult = directive
    ? evaluateDirective(directive, scores)
    : { achieved: false, message: '', bonusScore: 0 }

  const total = calcTotalScore(scores) + directiveResult.bonusScore

  return {
    week: state.currentWeek,
    scores: { ...scores },
    directiveAchieved: directiveResult.achieved,
    directiveTitle: directive?.title ?? '',
    highlights: generateHighlights(state),
    supplierInteractions: state.suppliers.filter(s => s.lastInteraction?.week === state.currentWeek).length,
    eventsHandled: state.eventStream.filter(e => e.timestamp.week === state.currentWeek && e.isRead).length,
    eventsDeferred: state.riskPoints > 20 ? Math.floor(state.riskPoints / 10) : 0,
    grade: getGrade(total),
  }
}

// --- 月次総合評価 ---
export function evaluateMonthly(weeklyReports: WeeklyReport[], finalScores: Scores): MonthlyReport {
  // 週ごとの重み: W1=15%, W2=20%, W3=25%, W4=40%
  const weights = [0.15, 0.20, 0.25, 0.40]

  let weightedTotal = 0
  for (let i = 0; i < weeklyReports.length; i++) {
    const weekScore = calcTotalScore(weeklyReports[i].scores)
    const weight = weights[i] ?? 0.25
    weightedTotal += weekScore * weight
  }

  // 指令達成ボーナス
  const directiveBonus = weeklyReports.filter(r => r.directiveAchieved).length * 3
  const totalScore = Math.round(weightedTotal + directiveBonus)

  const grade = getGrade(totalScore)
  const message = getMonthlyMessage(grade)

  return {
    weeklyReports,
    finalScores,
    totalScore,
    grade,
    message,
  }
}

function calcTotalScore(scores: Scores): number {
  return (
    scores.deliveryRate * 0.35 +
    scores.fieldTrust * 0.25 +
    scores.costControl * 0.2 +
    scores.customerSatisfaction * 0.2
  )
}

function getGrade(total: number): 'S' | 'A' | 'B' | 'C' | 'D' {
  if (total >= 85) return 'S'
  if (total >= 70) return 'A'
  if (total >= 55) return 'B'
  if (total >= 40) return 'C'
  return 'D'
}

function getMonthlyMessage(grade: string): string {
  switch (grade) {
    case 'S': return '完璧な1ヶ月。あなたは伝説の生産管理リーダーだ。工場長 村上も満足げに頷いている。'
    case 'A': return 'よくやった。大きなトラブルを乗り越え、工場を回し続けた。来月も期待している。'
    case 'B': return '何とか乗り切った1ヶ月。課題は残るが、経験は確実に積めた。'
    case 'C': return '厳しい1ヶ月だった。改善の余地は多い。来月は巻き返せ。'
    default: return 'PRODUCTION HELL——この1ヶ月は地獄だった。しかし、ここから学べることは多い。'
  }
}

function generateHighlights(state: GameState): string[] {
  const highlights: string[] = []
  if (state.scores.deliveryRate >= 90) highlights.push('納期達成率が高水準を維持')
  if (state.scores.deliveryRate <= 60) highlights.push('納期達成率が低下傾向')
  if (state.scores.costControl >= 80) highlights.push('コスト管理が良好')
  if (state.scores.costControl <= 50) highlights.push('コスト超過が発生')
  if (state.workCapacity.overallCapacity < 70) highlights.push('作業能力が低下中')
  const goodSuppliers = state.suppliers.filter(s => s.affinity >= 70).length
  if (goodSuppliers >= 3) highlights.push('サプライヤーとの良好な関係を構築')
  return highlights.length > 0 ? highlights : ['特記事項なし']
}

// 保留リスクポイントによる連鎖イベント発動判定
export function shouldTriggerChainEvent(riskPoints: number): boolean {
  return riskPoints >= 30
}
