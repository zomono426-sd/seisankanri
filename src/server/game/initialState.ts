import type { GameState, MrpState } from '../../shared/types.js'
import { CHARACTERS } from './characters.js'
import { scheduleEvents } from './events.js'
import { randomUUID } from 'crypto'

const INITIAL_MRP: MrpState = {
  productionOrders: [
    {
      orderNo: 'MO-2024-087',
      partNo: 'TW-CONV-100',
      partName: '搬送コンベア ユニット Type-A',
      quantity: 2,
      plannedCompletion: 14 * 60,  // 14:00
      status: 'planned',
      line: '第1組立ライン',
    },
    {
      orderNo: 'MO-2024-088',
      partNo: 'TW-CTRL-200',
      partName: '制御盤 Type-B（関東精機向け）',
      quantity: 1,
      plannedCompletion: 15 * 60,  // 15:00
      status: 'planned',
      line: '第1組立ライン',
    },
    {
      orderNo: 'MO-2024-089',
      partNo: 'TW-CONV-110',
      partName: '搬送ユニット Type-C',
      quantity: 3,
      plannedCompletion: 16 * 60,  // 16:00
      status: 'planned',
      line: '第2組立ライン',
    },
    {
      orderNo: 'MO-2024-090',
      partNo: 'TW-FRAME-050',
      partName: '溶接フレームセット',
      quantity: 5,
      plannedCompletion: 13 * 60,  // 13:00
      status: 'planned',
      line: '溶接ライン',
    },
    {
      orderNo: 'MO-2024-091',
      partNo: 'TW-SERVO-300',
      partName: 'サーボ駆動ユニット（ACサーボ使用）',
      quantity: 2,
      plannedCompletion: 17 * 60,  // 17:00
      status: 'planned',
      line: '第2組立ライン',
    },
  ],
  inventory: [
    {
      partNo: 'SV-3000',
      partName: 'ACサーボモーター SV-3000',
      onHand: 0,
      allocated: 2,
      free: 0,
      safetyStock: 2,
    },
    {
      partNo: 'CB-RAL7035',
      partName: '制御盤パネル RAL7035（ライトグレー）',
      onHand: 3,
      allocated: 1,
      free: 2,
      safetyStock: 1,
    },
    {
      partNo: 'CB-RAL9005',
      partName: '制御盤パネル RAL9005（ジェットブラック）',
      onHand: 0,
      allocated: 0,
      free: 0,
      safetyStock: 1,
    },
    {
      partNo: 'WF-FRAME-A',
      partName: '溶接フレーム Type-A',
      onHand: 10,
      allocated: 5,
      free: 5,
      safetyStock: 3,
    },
  ],
  totalPlanned: 13,
  totalCompleted: 0,
}

export function createInitialGameState(sessionId?: string): GameState {
  const id = sessionId ?? randomUUID()

  // 全キャラクターの初期関係値を設定
  const relationships = Object.fromEntries(
    Object.values(CHARACTERS).map((c) => [c.id, c.relationshipDefault])
  ) as GameState['relationships']

  const scheduledEvents = scheduleEvents()

  return {
    sessionId: id,
    phase: 'playing',
    gameTime: 8 * 60,   // 08:00 = 480分
    timeSlot: 'morning',
    scores: {
      deliveryRate: 100,
      fieldTrust: 70,
      costControl: 80,
      customerSatisfaction: 90,
    },
    relationships,
    mrpState: INITIAL_MRP,
    events: scheduledEvents,
    pendingEvent: scheduledEvents[0] ?? null,
    resolvedEventIds: [],
    deferredEventIds: [],
    conversations: [
      {
        id: randomUUID(),
        characterId: 'system',
        content:
          '東和機工株式会社 — 今日の生産管理が始まります。\n\nMRP計画：今日の出荷台数 13台（5案件）\n08:00 朝礼完了。各ラインに作業者配置完了。\nさあ、今日も乗り切れるか——',
        isPlayer: false,
        timestamp: 8 * 60,
        realTimestamp: new Date().toISOString(),
      },
    ],
    riskPoints: 0,
    lastCharacterResponse: null,
    isGameOver: false,
  }
}

// 分単位の時刻を HH:MM 形式に変換
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// 時刻 HH:MM を分単位に変換
export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

// 現在の時間帯を返す
export function getTimeSlot(minutes: number): GameState['timeSlot'] {
  if (minutes < 12 * 60) return 'morning'
  if (minutes < 13 * 60) return 'midday'
  if (minutes < 16 * 60 + 30) return 'afternoon'
  return 'closing'
}
