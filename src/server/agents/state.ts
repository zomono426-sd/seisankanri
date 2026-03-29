import { Annotation } from '@langchain/langgraph'
import type { GameState, PlayerAction, ConversationMessage, GameEvent } from '../../shared/types.js'

// LangGraph の GameState Annotation 定義
export const GameStateAnnotation = Annotation.Root({
  // セッション情報
  sessionId: Annotation<string>,

  // ゲーム進行
  gameTime: Annotation<number>,
  timeSlot: Annotation<GameState['timeSlot']>,
  phase: Annotation<GameState['phase']>,

  // イベント管理
  events: Annotation<GameEvent[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  pendingEvent: Annotation<GameEvent | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  resolvedEventIds: Annotation<string[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  deferredEventIds: Annotation<string[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),

  // スコア・関係値
  scores: Annotation<GameState['scores']>({
    reducer: (_prev, next) => next,
    default: () => ({
      deliveryRate: 100,
      fieldTrust: 70,
      costControl: 80,
      customerSatisfaction: 90,
    }),
  }),
  relationships: Annotation<GameState['relationships']>({
    reducer: (_prev, next) => next,
    default: () => ({} as GameState['relationships']),
  }),

  // MRP状態
  mrpState: Annotation<GameState['mrpState']>({
    reducer: (_prev, next) => next,
    default: () => ({
      productionOrders: [],
      inventory: [],
      totalPlanned: 0,
      totalCompleted: 0,
    }),
  }),

  // プレイヤーアクション
  playerAction: Annotation<PlayerAction | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  // 会話履歴
  conversations: Annotation<ConversationMessage[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),

  // キャラクターの返答
  characterResponse: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => '',
  }),

  // 結果情報
  lastActionOutcome: Annotation<{
    success: boolean
    message: string
    scoreDeltas: Partial<GameState['scores']>
    timeConsumed: number
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
