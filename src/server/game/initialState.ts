import type { GameState, MrpState, DepartmentStatus, Department } from '../../shared/types.js'
import { CHARACTERS } from './characters.js'
import { INITIAL_SUPPLIERS } from './suppliers.js'
import { INITIAL_CAPACITY, INITIAL_PRODUCTION_LINES } from './capacity.js'
import { scheduleWeeklyEvents } from './events.js'
import { generateDirective } from './director.js'
import { randomUUID } from 'crypto'

// --- 初期MRP（月次生産計画 — 4週間分の受注） ---
const INITIAL_MRP: MrpState = {
  productionOrders: [
    // W1納期 — 早期に対応が必要
    {
      orderNo: 'MO-W1-001',
      partNo: 'TW-CONV-100',
      partName: '搬送コンベア ユニット Type-A',
      customerName: '関東精機',
      quantity: 5,
      dueWeek: 1,
      dueDay: 5,
      completedQuantity: 0,
      status: 'planned',
      line: '第1組立ライン',
      priority: 'high',
      productionLeadTimeDays: 2,
      allocatedQuantity: 0,
    },
    {
      orderNo: 'MO-W1-004',
      partNo: 'TW-FRAME-050',
      partName: '溶接フレームセット',
      customerName: '関東精機',
      quantity: 8,
      dueWeek: 1,
      dueDay: 3,
      completedQuantity: 0,
      status: 'planned',
      line: '溶接ライン',
      priority: 'urgent',
      productionLeadTimeDays: 1,
      allocatedQuantity: 0,
    },
    // W2納期
    {
      orderNo: 'MO-W2-001',
      partNo: 'TW-CONV-101',
      partName: '搬送コンベア ユニット Type-B',
      customerName: '関東精機',
      quantity: 8,
      dueWeek: 2,
      dueDay: 3,
      completedQuantity: 0,
      status: 'planned',
      line: '第1組立ライン',
      priority: 'high',
      productionLeadTimeDays: 2,
      allocatedQuantity: 0,
    },
    {
      orderNo: 'MO-W2-002',
      partNo: 'TW-SERVO-300',
      partName: 'サーボ駆動ユニット',
      customerName: '東海電装',
      quantity: 6,
      dueWeek: 2,
      dueDay: 5,
      completedQuantity: 0,
      status: 'planned',
      line: '第2組立ライン',
      priority: 'normal',
      productionLeadTimeDays: 2,
      allocatedQuantity: 0,
    },
    // W3納期
    {
      orderNo: 'MO-W3-001',
      partNo: 'TW-CTRL-200',
      partName: '制御盤 Type-B',
      customerName: '東日本機械',
      quantity: 10,
      dueWeek: 3,
      dueDay: 4,
      completedQuantity: 0,
      status: 'planned',
      line: '第1組立ライン',
      priority: 'normal',
      productionLeadTimeDays: 3,
      allocatedQuantity: 0,
    },
    {
      orderNo: 'MO-W3-002',
      partNo: 'TW-CONV-110',
      partName: '搬送ユニット Type-C',
      customerName: '名古屋オートメーション',
      quantity: 8,
      dueWeek: 3,
      dueDay: 5,
      completedQuantity: 0,
      status: 'planned',
      line: '第2組立ライン',
      priority: 'normal',
      productionLeadTimeDays: 2,
      allocatedQuantity: 0,
    },
    // W4納期 — 大型受注
    {
      orderNo: 'MO-W4-001',
      partNo: 'TW-FRAME-060',
      partName: '大型溶接フレーム',
      customerName: '関東精機',
      quantity: 12,
      dueWeek: 4,
      dueDay: 4,
      completedQuantity: 0,
      status: 'planned',
      line: '溶接ライン',
      priority: 'high',
      productionLeadTimeDays: 2,
      allocatedQuantity: 0,
    },
    {
      orderNo: 'MO-W4-002',
      partNo: 'TW-CTRL-100',
      partName: '制御盤 Type-A',
      customerName: '東日本機械',
      quantity: 6,
      dueWeek: 4,
      dueDay: 5,
      completedQuantity: 0,
      status: 'planned',
      line: '第2組立ライン',
      priority: 'normal',
      productionLeadTimeDays: 3,
      allocatedQuantity: 0,
    },
  ],
  inventory: [
    // --- 原料 (rawMaterial) ---
    { partNo: 'SV-3000', partName: 'ACサーボモーター SV-3000', itemType: 'rawMaterial', onHand: 12, allocated: 0, free: 12, safetyStock: 4, reorderPoint: 8, leadTimeDays: 3, deliveryQuantity: 20, supplierId: 'daito_denki', nextDeliveryWeek: 1, nextDeliveryDay: 3 },
    { partNo: 'CB-RAL7035', partName: '制御盤パネル RAL7035', itemType: 'rawMaterial', onHand: 10, allocated: 0, free: 10, safetyStock: 3, reorderPoint: 5, leadTimeDays: 2, deliveryQuantity: 10, supplierId: 'maruyama_kinzoku', nextDeliveryWeek: 2, nextDeliveryDay: 1 },
    { partNo: 'BELT-200', partName: '搬送ベルト 200mm', itemType: 'rawMaterial', onHand: 30, allocated: 0, free: 30, safetyStock: 8, reorderPoint: 12, leadTimeDays: 2, deliveryQuantity: 20, supplierId: 'tokai_logistics', nextDeliveryWeek: 2, nextDeliveryDay: 3 },
    { partNo: 'PCB-MAIN', partName: 'メイン制御基板', itemType: 'rawMaterial', onHand: 10, allocated: 0, free: 10, safetyStock: 3, reorderPoint: 6, leadTimeDays: 3, deliveryQuantity: 15, supplierId: 'mikawa_seimitsu', nextDeliveryWeek: 1, nextDeliveryDay: 4 },
    // --- 中間品 (intermediate) ---
    { partNo: 'WF-FRAME-A', partName: '溶接フレーム Type-A', itemType: 'intermediate', onHand: 12, allocated: 0, free: 12, safetyStock: 3, reorderPoint: 8, leadTimeDays: 2, weeklyPlanQuantity: 10, monthlyPlanQuantity: 40 },
    { partNo: 'SUB-DRIVE', partName: 'サーボ駆動サブアセンブリ', itemType: 'intermediate', onHand: 5, allocated: 0, free: 5, safetyStock: 3, reorderPoint: 6, leadTimeDays: 1, weeklyPlanQuantity: 8, monthlyPlanQuantity: 32 },
    { partNo: 'SUB-CTRL', partName: '制御ユニットサブアセンブリ', itemType: 'intermediate', onHand: 4, allocated: 0, free: 4, safetyStock: 2, reorderPoint: 5, leadTimeDays: 1, weeklyPlanQuantity: 6, monthlyPlanQuantity: 24 },
  ],
  // --- BOM（部品構成表） ---
  bom: [
    // 完成品 → 中間品/原材料
    { parentPartNo: 'TW-CONV-100', childPartNo: 'WF-FRAME-A', quantityPer: 1 },
    { parentPartNo: 'TW-CONV-100', childPartNo: 'SUB-DRIVE', quantityPer: 1 },
    { parentPartNo: 'TW-CONV-100', childPartNo: 'BELT-200', quantityPer: 2 },
    { parentPartNo: 'TW-CONV-101', childPartNo: 'WF-FRAME-A', quantityPer: 1 },
    { parentPartNo: 'TW-CONV-101', childPartNo: 'SUB-DRIVE', quantityPer: 1 },
    { parentPartNo: 'TW-CONV-101', childPartNo: 'BELT-200', quantityPer: 3 },
    { parentPartNo: 'TW-CONV-110', childPartNo: 'WF-FRAME-A', quantityPer: 1 },
    { parentPartNo: 'TW-CONV-110', childPartNo: 'SUB-DRIVE', quantityPer: 2 },
    { parentPartNo: 'TW-CONV-110', childPartNo: 'BELT-200', quantityPer: 2 },
    { parentPartNo: 'TW-FRAME-050', childPartNo: 'WF-FRAME-A', quantityPer: 1 },
    { parentPartNo: 'TW-FRAME-060', childPartNo: 'WF-FRAME-A', quantityPer: 2 },
    { parentPartNo: 'TW-SERVO-300', childPartNo: 'SUB-DRIVE', quantityPer: 1 },
    { parentPartNo: 'TW-SERVO-300', childPartNo: 'SUB-CTRL', quantityPer: 1 },
    { parentPartNo: 'TW-CTRL-200', childPartNo: 'SUB-CTRL', quantityPer: 1 },
    { parentPartNo: 'TW-CTRL-200', childPartNo: 'CB-RAL7035', quantityPer: 1 },
    { parentPartNo: 'TW-CTRL-200', childPartNo: 'PCB-MAIN', quantityPer: 2 },
    { parentPartNo: 'TW-CTRL-100', childPartNo: 'SUB-CTRL', quantityPer: 1 },
    { parentPartNo: 'TW-CTRL-100', childPartNo: 'CB-RAL7035', quantityPer: 1 },
    { parentPartNo: 'TW-CTRL-100', childPartNo: 'PCB-MAIN', quantityPer: 1 },
    // 中間品 → 原材料
    { parentPartNo: 'SUB-DRIVE', childPartNo: 'SV-3000', quantityPer: 1 },
    { parentPartNo: 'SUB-CTRL', childPartNo: 'PCB-MAIN', quantityPer: 1 },
    // WF-FRAME-A は社内溶接加工のため原材料なし
  ],
  // --- ラインごとの中間品生産計画 ---
  productionPlans: [
    { lineId: 'line1', targetPartNo: 'SUB-DRIVE', dailyTarget: 4 },
    { lineId: 'line2', targetPartNo: 'SUB-CTRL', dailyTarget: 3 },
    { lineId: 'weld', targetPartNo: 'WF-FRAME-A', dailyTarget: 3 },
  ],
  weeklyPlanned: 63,
  weeklyCompleted: 0,
  inventoryHistory: [],
  totalDailyProduced: 0,
  totalAllocatedToday: 0,
  purchaseOrders: [
    { id: 'PO-001', partNo: 'SV-3000',    supplierId: 'daito_denki',      quantity: 20, orderWeek: 0, orderDay: 0, deliveryWeek: 1, deliveryDay: 3, status: 'in_transit', isEmergency: false },
    { id: 'PO-002', partNo: 'PCB-MAIN',   supplierId: 'mikawa_seimitsu',  quantity: 15, orderWeek: 0, orderDay: 0, deliveryWeek: 1, deliveryDay: 4, status: 'in_transit', isEmergency: false },
    { id: 'PO-003', partNo: 'CB-RAL7035', supplierId: 'maruyama_kinzoku', quantity: 10, orderWeek: 0, orderDay: 0, deliveryWeek: 2, deliveryDay: 1, status: 'in_transit', isEmergency: false },
    { id: 'PO-004', partNo: 'BELT-200',   supplierId: 'tokai_logistics',  quantity: 20, orderWeek: 0, orderDay: 0, deliveryWeek: 2, deliveryDay: 3, status: 'in_transit', isEmergency: false },
  ],
}

// --- 初期部門状態 ---
const INITIAL_DEPARTMENTS: Record<Department, DepartmentStatus> = {
  sales: {
    department: 'sales',
    label: '営業',
    load: 60,
    activeIssues: 0,
    efficiency: 80,
  },
  procurement: {
    department: 'procurement',
    label: '調達',
    load: 50,
    activeIssues: 0,
    efficiency: 85,
  },
  manufacturing: {
    department: 'manufacturing',
    label: '製造',
    load: 70,
    activeIssues: 0,
    efficiency: 75,
  },
}

export function createInitialGameState(sessionId?: string): GameState {
  const id = sessionId ?? randomUUID()

  const relationships = Object.fromEntries(
    Object.values(CHARACTERS).map(c => [c.id, c.relationshipDefault])
  ) as GameState['relationships']

  const initialScores = {
    deliveryRate: 80,
    fieldTrust: 70,
    costControl: 75,
    customerSatisfaction: 80,
  }

  const directive = generateDirective(1, initialScores)
  const weekEvents = scheduleWeeklyEvents(1)

  return {
    sessionId: id,
    phase: 'playing',
    currentWeek: 1,
    currentDay: 1,
    dayTimeRemaining: 2,
    scores: initialScores,
    weeklyScores: [],
    departments: { ...INITIAL_DEPARTMENTS },
    productionLines: INITIAL_PRODUCTION_LINES.map(l => ({ ...l })),
    suppliers: INITIAL_SUPPLIERS.map(s => ({ ...s })),
    workCapacity: { ...INITIAL_CAPACITY },
    activeDirective: directive,
    eventStream: [
      {
        id: randomUUID(),
        timestamp: { week: 1, day: 1 },
        characterId: 'system',
        title: '月次ゲーム開始',
        content: '東和機工株式会社 — 今月の生産管理が始まります。\n4週間で工場を回し、最高の成績を目指せ。\n営業・調達・製造、3部門のバランスを取りながら判断していく1ヶ月。',
        severity: 'low',
        category: 'director',
        isRead: true,
      },
      {
        id: randomUUID(),
        timestamp: { week: 1, day: 1 },
        characterId: 'factory_director',
        title: directive.title,
        content: directive.description,
        severity: 'critical',
        category: 'director',
        isRead: false,
        isDirective: true,
      },
    ],
    pendingEvents: weekEvents.filter(e => e.triggerDay === 1 && e.category !== 'director'),
    pendingNegotiation: null,
    relationships,
    mrpState: { ...INITIAL_MRP, productionOrders: INITIAL_MRP.productionOrders.map(o => ({ ...o })), inventory: INITIAL_MRP.inventory.map(i => ({ ...i })) },
    riskPoints: 0,
    isGameOver: false,
  }
}
