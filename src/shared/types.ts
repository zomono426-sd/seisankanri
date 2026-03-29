// ============================================================
// PRODUCTION HELL — 共有型定義
// ============================================================

// --- キャラクターID ---
export type CharacterId =
  | 'factory_manager'   // 工場長 村上 克己
  | 'dept_manager'      // 製造部長 橋本 賢二
  | 'sales'             // 営業主任 西村 大輔
  | 'workshop'          // 製造職長 谷口 正
  | 'procurement'       // 調達担当 木村 隆
  | 'subcontractor'     // 外注先社長 坂本 義雄
  | 'subordinate1'      // 部下 田中 美咲
  | 'subordinate2'      // 部下 佐々木 健太
  | 'system'            // システム通知

// --- キャラクター定義 ---
export interface Character {
  id: CharacterId
  displayName: string       // 役職＋名前（例: 製造職長 谷口 正）
  role: string              // 役職
  firstName: string         // 名前
  age: number
  catchphrase: string       // 口癖
  personality: string       // 性格の簡潔な説明
  avatarColor: string       // UIカラー
  relationshipDefault: number  // デフォルト関係値 (0-100)
}

// --- ゲームフェーズ ---
export type GamePhase = 'title' | 'playing' | 'result'

// --- 時間帯 ---
export type TimeSlot = 'morning' | 'midday' | 'afternoon' | 'closing'

// --- イベント重要度 ---
export type EventSeverity = 'low' | 'medium' | 'high' | 'critical'

// --- イベント定義 ---
export interface GameEvent {
  id: string
  triggerTime: number        // 発火時刻（分単位 480=08:00）
  characterId: CharacterId
  title: string
  description: string        // イベントの状況説明
  severity: EventSeverity
  isProbabilistic: boolean   // 確率イベントか
  triggerProbability: number // 発火確率 (0-1)
  choices: EventChoice[]
  isChainEvent: boolean      // 連鎖イベントか
  chainTrigger?: string      // どのイベントIDの結果が引き金になるか
  chainCondition?: 'deferred' | 'failed_dispatch'  // 連鎖条件
}

// --- 選択肢 ---
export interface EventChoice {
  id: string
  label: string              // 表示テキスト
  actionType: ActionType
  dispatchTarget?: CharacterId  // 部下に任せる場合の対象
  timeConsumption: number    // 時間消費（分）
  context?: string           // プレイヤーが指示する内容の補足
}

// --- アクションタイプ ---
export type ActionType = 'self' | 'dispatch' | 'defer'

// --- プレイヤーアクション ---
export interface PlayerAction {
  eventId: string
  choiceId: string
  actionType: ActionType
  dispatchTarget?: CharacterId
  timestamp: number          // ゲーム内時刻
}

// --- スコア ---
export interface Scores {
  deliveryRate: number       // 納期達成率 (0-100)
  fieldTrust: number         // 現場信頼度 (0-100)
  costControl: number        // コスト管理 (0-100)
  customerSatisfaction: number  // 顧客満足度 (0-100)
}

// --- MRP状態 ---
export interface MrpItem {
  orderNo: string            // 製造指示番号
  partNo: string             // 品番
  partName: string           // 品名
  quantity: number           // 数量
  plannedCompletion: number  // 計画完了時刻（分）
  actualCompletion?: number  // 実績完了時刻（分）
  status: 'planned' | 'in_progress' | 'completed' | 'delayed' | 'blocked'
  line: string               // 担当ライン
}

export interface MrpState {
  productionOrders: MrpItem[]
  inventory: InventoryItem[]
  totalPlanned: number       // 今日の出荷計画台数
  totalCompleted: number     // 実績完了台数
}

export interface InventoryItem {
  partNo: string
  partName: string
  onHand: number             // 手持ち在庫
  allocated: number          // 引当済み
  free: number               // フリー在庫
  safetyStock: number        // 安全在庫
}

// --- 会話メッセージ ---
export interface ConversationMessage {
  id: string
  characterId: CharacterId
  content: string
  isPlayer: boolean
  timestamp: number          // ゲーム内時刻（分）
  realTimestamp: string      // 実際の時刻
  eventId?: string
}

// --- ゲーム状態 ---
export interface GameState {
  sessionId: string
  phase: GamePhase
  gameTime: number           // ゲーム内時刻（分）480=08:00 〜 1050=17:30
  timeSlot: TimeSlot
  scores: Scores
  relationships: Record<CharacterId, number>
  mrpState: MrpState
  events: GameEvent[]        // 全イベントリスト（スケジュール済み含む）
  pendingEvent: GameEvent | null  // 現在対応待ちのイベント
  resolvedEventIds: string[] // 解決済みイベントID
  deferredEventIds: string[] // 保留中イベントID
  conversations: ConversationMessage[]
  riskPoints: number         // 蓄積リスクポイント（保留で増加）
  lastCharacterResponse: string | null
  isGameOver: boolean
  gameOverReason?: string
}

// --- APIレスポンス ---
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface GameStartResponse {
  sessionId: string
  gameState: GameState
}

export interface GameActionResponse {
  gameState: GameState
  characterResponse: string
  outcome: ActionOutcome
}

// --- アクション結果 ---
export interface ActionOutcome {
  success: boolean
  message: string
  scoreDeltas: Partial<Scores>
  relationshipDeltas: Partial<Record<CharacterId, number>>
  triggeredEvents: string[]  // 連鎖発生したイベントID
  timeConsumed: number
}

// --- 部下派遣成功確率の入力 ---
export interface DispatchParams {
  dispatcher: CharacterId    // 派遣する部下
  target: CharacterId        // 対応する相手
  currentRelationship: number
  instructionQuality: number // 0-1: 指示の明確さ
}
