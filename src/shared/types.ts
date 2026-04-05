// ============================================================
// PRODUCTION HELL v2 — 共有型定義（モニタリング中心・月次ゲーム）
// ============================================================

// --- 部門 ---
export type Department = 'sales' | 'procurement' | 'manufacturing'

// --- キャラクターID ---
export type CharacterId =
  | 'factory_director'   // 工場長 村上 克己（神的存在）
  | 'dept_manager'       // 製造部長 橋本 賢二
  | 'sales'              // 営業主任 西村 大輔
  | 'workshop'           // 製造職長 谷口 正
  | 'procurement'        // 調達担当 木村 隆
  | 'subordinate1'       // 部下 田中 美咲
  | 'subordinate2'       // 部下 佐々木 健太
  | 'system'             // システム通知

// --- サプライヤーID ---
export type SupplierId =
  | 'daito_denki'        // 大東電機
  | 'sakamoto_ss'        // 坂本製作所
  | 'mikawa_seimitsu'    // 三河精密
  | 'maruyama_kinzoku'   // 丸山金属
  | 'tokai_logistics'    // 東海ロジスティクス

// --- キャラクター定義 ---
export interface Character {
  id: CharacterId
  displayName: string
  role: string
  firstName: string
  age: number
  catchphrase: string
  personality: string
  avatarColor: string
  relationshipDefault: number
}

// --- ゲームフェーズ ---
export type GamePhase = 'title' | 'playing' | 'weekResult' | 'monthResult'

// --- イベント重要度 ---
export type EventSeverity = 'low' | 'medium' | 'high' | 'critical'

// --- イベントカテゴリ ---
export type EventCategory =
  | 'sales'           // 営業系（受注変更、急ぎ注文、顧客クレーム）
  | 'procurement'     // 調達系（部品遅延、価格変動、サプライヤー問題）
  | 'manufacturing'   // 製造系（ライン問題、品質不良、工程遅れ）
  | 'capacity'        // 能力系（設備故障、人員欠勤、残業制限）
  | 'inventory'       // 在庫系（安全在庫割れ、納入遅延、計画見直し）
  | 'director'        // 工場長指令

// --- イベント定義（v2: 週次プール型） ---
export interface GameEvent {
  id: string
  category: EventCategory
  characterId: CharacterId
  title: string
  description: string
  severity: EventSeverity
  triggerDay: number              // 何日目に発生 (1-5)
  triggerProbability: number      // 発火確率 (0-1)
  choices: EventChoice[]
  requiresSupplierNegotiation?: boolean  // サプライヤー交渉が必要なイベント
  affectedDepartment: Department  // 主に影響する部門
}

// --- 選択肢 ---
export interface EventChoice {
  id: string
  label: string
  actionType: ActionType
  dispatchTarget?: CharacterId
  timeCost: 'none' | 'half_day' | 'full_day'  // 時間コスト
  context?: string
}

// --- アクションタイプ ---
export type ActionType = 'self' | 'dispatch' | 'defer' | 'investigate'

// --- プレイヤーアクション ---
export interface PlayerAction {
  eventId: string
  choiceId: string
  actionType: ActionType
  dispatchTarget?: CharacterId
  week: number
  day: number
}

// --- スコア ---
export interface Scores {
  deliveryRate: number        // 納期達成率 (0-100)
  fieldTrust: number          // 現場信頼度 (0-100)
  costControl: number         // コスト管理 (0-100)
  customerSatisfaction: number // 顧客満足度 (0-100)
}

// --- 部門状態 ---
export interface DepartmentStatus {
  department: Department
  label: string                // 表示名
  load: number                 // 負荷率 (0-100)
  activeIssues: number         // 未解決問題数
  efficiency: number           // 効率 (0-100)
}

// --- 製造ライン ---
export interface ProductionLine {
  id: string
  name: string
  capacity: number             // 最大能力（台/日）
  currentLoad: number          // 現在負荷（台/日）
  status: 'running' | 'down' | 'maintenance' | 'reduced'
  assignedWorkers: number
  maxWorkers: number
}

// --- 作業能力 ---
export interface WorkCapacity {
  totalWorkers: number         // 在籍人数
  presentWorkers: number       // 出勤人数
  equipmentTotal: number       // 設備総数
  equipmentOperational: number // 稼働設備数
  overallCapacity: number      // 総合能力 (0-100%)
}

// --- サプライヤー ---
export interface Supplier {
  id: SupplierId
  name: string
  specialty: string            // 得意分野
  parts: string[]              // 供給部品
  affinity: number             // 好感度 (0-100)
  reliability: number          // 信頼性 (0-100)
  priceLevel: 'low' | 'medium' | 'high'
  personality: string          // 性格の説明
  avatarColor: string
  currentMood: 'good' | 'neutral' | 'annoyed' | 'angry'
  lastInteraction?: {
    week: number
    day: number
    result: 'success' | 'failure'
  }
}

// --- サプライヤー交渉 ---
export type NegotiationTone = 'polite' | 'urgent' | 'negotiate' | 'grateful'

export interface SupplierNegotiation {
  supplierId: SupplierId
  requestDescription: string   // 依頼内容
  suggestedBy: 'procurement'   // 木村が提案
  toneChoices: NegotiationChoice[]
}

export interface NegotiationChoice {
  tone: NegotiationTone
  label: string
  description: string
  affinityDelta: number        // 好感度変動（予想）
  timeCost: 'none' | 'half_day' | 'full_day'
  available: boolean           // 選択可能か（例: grateful は前回成功時のみ）
}

// --- 工場長指令 ---
export interface FactoryDirective {
  id: string
  week: number
  title: string                // 「今週はコスト20%削減だ」
  description: string
  targetKpi: keyof Scores      // 主に影響するKPI
  targetValue: number          // 目標値
  currentValue: number         // 現在値
  isAchieved: boolean
}

// --- MRP状態 ---
export interface ProductionOrder {
  orderNo: string
  partNo: string
  partName: string
  customerName: string
  quantity: number
  dueWeek: number              // 納期の週（1-4）
  dueDay: number               // 納期の日（1-5、dueWeek内の曜日）
  completedQuantity: number
  status: 'planned' | 'in_progress' | 'producing' | 'completed' | 'delayed' | 'blocked'
  line: string
  priority: 'normal' | 'high' | 'urgent'
  // --- 製造リードタイム関連（ATO: 受注組立生産） ---
  productionLeadTimeDays: number       // 製造リードタイム（日数）
  allocatedQuantity: number            // 引当済み数量（生産中の数）
  productionStartWeek?: number         // 生産開始週（全数引当完了時）
  productionStartDay?: number          // 生産開始日（全数引当完了時）
  productionEndWeek?: number           // 生産完了予定週
  productionEndDay?: number            // 生産完了予定日
}

export type InventoryItemType = 'product' | 'intermediate' | 'rawMaterial'

export interface InventoryItem {
  partNo: string
  partName: string
  itemType: InventoryItemType
  onHand: number
  allocated: number
  free: number
  safetyStock: number
  reorderPoint: number
  leadTimeDays: number
  supplierId?: SupplierId
  nextDeliveryWeek?: number
  nextDeliveryDay?: number
  weeklyPlanQuantity?: number
  monthlyPlanQuantity?: number
}

export interface InventorySnapshot {
  week: number
  day: number
  lineStock: Record<string, number>
  totalStock: number
  dailyProduced: number
  dailyAllocated: number
  events: string[]
}

export interface MrpState {
  productionOrders: ProductionOrder[]
  inventory: InventoryItem[]
  lineStock: Record<string, number>  // ライン名 → 利用可能在庫数
  weeklyPlanned: number        // 全受注の計画台数合計
  weeklyCompleted: number      // 全受注の完了台数合計
  inventoryHistory: InventorySnapshot[]  // 日次スナップショット
  totalDailyProduced: number   // 本日生産量
  totalAllocatedToday: number  // 本日引当量
}

// --- イベントストリームアイテム ---
export interface EventStreamItem {
  id: string
  timestamp: { week: number; day: number }
  characterId: CharacterId | SupplierId
  title: string
  content: string
  severity: EventSeverity
  category: EventCategory
  isRead: boolean
  eventId?: string             // 関連イベントID
  isDirective?: boolean        // 工場長指令か
}

// --- AI影響調査 ---
export interface ImpactAnalysis {
  eventId: string
  choiceId: string
  prediction: {
    deliveryRate: { delta: number; confidence: 'low' | 'medium' | 'high' }
    fieldTrust: { delta: number; confidence: 'low' | 'medium' | 'high' }
    costControl: { delta: number; confidence: 'low' | 'medium' | 'high' }
    customerSatisfaction: { delta: number; confidence: 'low' | 'medium' | 'high' }
  }
  risks: string[]
  recommendation: string
  timeCost: 'half_day'
}

// --- 週次レポート ---
export interface WeeklyReport {
  week: number
  scores: Scores
  directiveAchieved: boolean
  directiveTitle: string
  highlights: string[]         // 今週のハイライト
  supplierInteractions: number
  eventsHandled: number
  eventsDeferred: number
  grade: 'S' | 'A' | 'B' | 'C' | 'D'
}

// --- 月次レポート ---
export interface MonthlyReport {
  weeklyReports: WeeklyReport[]
  finalScores: Scores
  totalScore: number
  grade: 'S' | 'A' | 'B' | 'C' | 'D'
  message: string
}

// --- ゲーム状態 ---
export interface GameState {
  sessionId: string
  phase: GamePhase
  currentWeek: number          // 1-4
  currentDay: number           // 1-5 (月-金)
  dayTimeRemaining: number     // 当日の残り時間枠 (0-2: 0=行動不可, 1=半日, 2=1日)
  scores: Scores
  weeklyScores: WeeklyReport[] // 各週の評価を蓄積
  departments: Record<Department, DepartmentStatus>
  productionLines: ProductionLine[]
  suppliers: Supplier[]
  workCapacity: WorkCapacity
  activeDirective: FactoryDirective | null
  eventStream: EventStreamItem[]
  pendingEvents: GameEvent[]   // 当日の未処理イベント
  pendingNegotiation: SupplierNegotiation | null
  relationships: Record<CharacterId, number>
  mrpState: MrpState
  riskPoints: number
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

export interface InvestigateResponse {
  analysis: ImpactAnalysis
  gameState: GameState         // dayTimeRemaining が減少
}

export interface NegotiateResponse {
  success: boolean
  supplierResponse: string
  affinityChange: number
  gameState: GameState
}

// --- アクション結果 ---
export interface ActionOutcome {
  success: boolean
  message: string
  scoreDeltas: Partial<Scores>
  relationshipDeltas: Partial<Record<CharacterId, number>>
  supplierAffinityDeltas: Partial<Record<SupplierId, number>>
  timeConsumed: 'none' | 'half_day' | 'full_day'
}

// --- 部下派遣成功確率の入力 ---
export interface DispatchParams {
  dispatcher: CharacterId
  target: CharacterId
  currentRelationship: number
  instructionQuality: number
}
