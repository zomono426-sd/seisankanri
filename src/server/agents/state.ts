import { Annotation } from '@langchain/langgraph'
import type {
  GameState,
  PlayerAction,
  GameEvent,
  EventStreamItem,
  Supplier,
  ProductionLine,
  WorkCapacity,
  DepartmentStatus,
  Department,
  FactoryDirective,
  WeeklyReport,
  SupplierNegotiation,
  Scores,
  CharacterId,
  MrpState,
  ProductionOrder,
  InventoryItem,
} from '../../shared/types.js'

// LangGraph v2 — 週次/月次ゲームの State Annotation 定義
export const GameStateAnnotation = Annotation.Root({
  // セッション情報
  sessionId: Annotation<string>,

  // ゲーム進行
  phase: Annotation<GameState['phase']>({
    reducer: (_prev, next) => next,
    default: () => 'playing' as GameState['phase'],
  }),
  currentWeek: Annotation<number>({
    reducer: (_prev, next) => next,
    default: () => 1,
  }),
  currentDay: Annotation<number>({
    reducer: (_prev, next) => next,
    default: () => 1,
  }),
  dayTimeRemaining: Annotation<number>({
    reducer: (_prev, next) => next,
    default: () => 2,
  }),

  // スコア・関係値
  scores: Annotation<Scores>({
    reducer: (_prev, next) => next,
    default: () => ({
      deliveryRate: 80,
      fieldTrust: 70,
      costControl: 75,
      customerSatisfaction: 80,
    }),
  }),
  weeklyScores: Annotation<WeeklyReport[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  relationships: Annotation<Record<CharacterId, number>>({
    reducer: (_prev, next) => next,
    default: () => ({} as Record<CharacterId, number>),
  }),

  // 部門状態
  departments: Annotation<Record<Department, DepartmentStatus>>({
    reducer: (_prev, next) => next,
    default: () => ({} as Record<Department, DepartmentStatus>),
  }),

  // 製造ライン
  productionLines: Annotation<ProductionLine[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),

  // サプライヤー
  suppliers: Annotation<Supplier[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),

  // 作業能力
  workCapacity: Annotation<WorkCapacity>({
    reducer: (_prev, next) => next,
    default: () => ({
      totalWorkers: 24,
      presentWorkers: 24,
      equipmentTotal: 6,
      equipmentOperational: 6,
      overallCapacity: 100,
    }),
  }),

  // 工場長指令
  activeDirective: Annotation<FactoryDirective | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  // イベント管理
  eventStream: Annotation<EventStreamItem[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  pendingEvents: Annotation<GameEvent[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  pendingNegotiation: Annotation<SupplierNegotiation | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  allWeekEvents: Annotation<GameEvent[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  resolvedEventIds: Annotation<string[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),

  // MRP状態
  mrpState: Annotation<MrpState>({
    reducer: (_prev, next) => next,
    default: () => ({
      productionOrders: [],
      inventory: [],
      bom: [],
      productionPlans: [],
      weeklyPlanned: 0,
      weeklyCompleted: 0,
      inventoryHistory: [],
      totalDailyProduced: 0,
      totalAllocatedToday: 0,
      purchaseOrders: [],
    }),
  }),

  // プレイヤーアクション
  playerAction: Annotation<PlayerAction | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  // キャラクター応答
  characterResponse: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => '',
  }),

  // 結果情報
  lastActionOutcome: Annotation<{
    success: boolean
    message: string
    scoreDeltas: Partial<Scores>
    timeConsumed: string
  } | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  // リスクポイント
  riskPoints: Annotation<number>({
    reducer: (_prev, next) => next,
    default: () => 0,
  }),

  // フラグ
  isWaiting: Annotation<boolean>({
    reducer: (_prev, next) => next,
    default: () => false,
  }),
  isGameOver: Annotation<boolean>({
    reducer: (_prev, next) => next,
    default: () => false,
  }),
  gameOverReason: Annotation<string | undefined>({
    reducer: (_prev, next) => next,
    default: () => undefined,
  }),
})

export type GameGraphState = typeof GameStateAnnotation.State
