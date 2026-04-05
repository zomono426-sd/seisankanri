import type { GameGraphState } from '../state.js'
import { scheduleWeeklyEvents, getEventsForDay } from '../../game/events.js'
import { generateDirective } from '../../game/director.js'
import { evaluateWeekly } from '../../game/scoring.js'
import { dailyCapacityUpdate, produceLineStock } from '../../game/capacity.js'
import { randomUUID } from 'crypto'
import type { EventStreamItem, GameState, InventorySnapshot, ProductionOrder } from '../../../shared/types.js'

// 日 → 次の日 or 週末 → 次の週 or 月末 に進める
export async function timeAdvanceNode(
  state: GameGraphState
): Promise<Partial<GameGraphState>> {
  const { currentDay, currentWeek, pendingEvents } = state

  // まだpendingEventsが残っている場合は進めない
  if (pendingEvents.length > 0) {
    return { isWaiting: true }
  }

  // --- 日終了処理 ---
  const { lines: updatedLines, capacity: updatedCapacity } =
    dailyCapacityUpdate(state.productionLines, state.workCapacity)

  // MRP進捗: ラインの日産能力をラインストックに蓄積（受注への引当はユーザー操作）
  const { updatedStock, dailyProduced } = produceLineStock(updatedLines, state.mrpState.lineStock)

  // 受注ステータス更新（製造リードタイム消化 + 納期チェック）
  const absoluteNow = (currentWeek - 1) * 5 + currentDay
  const updatedOrders = state.mrpState.productionOrders.map(o => {
    if (o.status === 'completed') return o

    // 生産中（producing）: リードタイム完了チェック
    if (o.status === 'producing' && o.productionEndWeek != null && o.productionEndDay != null) {
      const absoluteEnd = (o.productionEndWeek - 1) * 5 + o.productionEndDay
      if (absoluteNow >= absoluteEnd) {
        // リードタイム経過 → 完成品として completedQuantity に反映
        const completed = o.allocatedQuantity ?? o.quantity
        return {
          ...o,
          completedQuantity: completed,
          status: (completed >= o.quantity ? 'completed' : 'in_progress') as ProductionOrder['status'],
        }
      }
      // リードタイム未経過 → producing のまま（ただし納期超過チェック）
      const absoluteDue = (o.dueWeek - 1) * 5 + o.dueDay
      if (absoluteNow > absoluteDue) {
        return { ...o, status: 'delayed' as const }
      }
      return o
    }

    // 通常の納期超過チェック
    const absoluteDue = (o.dueWeek - 1) * 5 + o.dueDay
    if (absoluteNow > absoluteDue && o.completedQuantity < o.quantity) {
      return { ...o, status: 'delayed' as const }
    }
    return o
  })

  // 日次スナップショット: 生産量・引当量・在庫レベル・イベント影響を記録
  const snapshot: InventorySnapshot = {
    week: currentWeek,
    day: currentDay,
    lineStock: { ...updatedStock },
    totalStock: Object.values(updatedStock).reduce((s, v) => s + v, 0),
    dailyProduced,
    dailyAllocated: state.mrpState.totalAllocatedToday,
    events: state.eventStream
      .filter(e => e.timestamp.week === currentWeek && e.timestamp.day === currentDay
        && (e.category === 'manufacturing' || e.category === 'capacity'))
      .map(e => e.title),
  }

  const newMrp = {
    ...state.mrpState,
    lineStock: updatedStock,
    productionOrders: updatedOrders,
    weeklyCompleted: updatedOrders.reduce((sum, o) => sum + o.completedQuantity, 0),
    inventoryHistory: [...(state.mrpState.inventoryHistory ?? []), snapshot],
    totalDailyProduced: dailyProduced,
    totalAllocatedToday: 0,
  }

  if (currentDay < 5) {
    // --- 次の日へ ---
    const nextDay = currentDay + 1
    const nextDayEvents = getEventsForDay(state.allWeekEvents, nextDay)
      .filter(e => !state.resolvedEventIds.includes(e.id))

    const newStreamItems: EventStreamItem[] = [{
      id: randomUUID(),
      timestamp: { week: currentWeek, day: nextDay },
      characterId: 'system',
      title: `${currentWeek}週目 ${getDayName(nextDay)}`,
      content: `${getDayName(nextDay)}が始まりました。今日も工場を回していきましょう。`,
      severity: 'low',
      category: 'manufacturing',
      isRead: true,
    }]

    // 次の日のイベント通知をストリームに追加
    for (const e of nextDayEvents) {
      newStreamItems.push({
        id: randomUUID(),
        timestamp: { week: currentWeek, day: nextDay },
        characterId: e.characterId,
        title: e.title,
        content: e.description,
        severity: e.severity,
        category: e.category,
        isRead: false,
        eventId: e.id,
        isDirective: e.category === 'director',
      })
    }

    return {
      currentDay: nextDay,
      dayTimeRemaining: 2,
      pendingEvents: nextDayEvents,
      eventStream: [...state.eventStream, ...newStreamItems],
      productionLines: updatedLines,
      workCapacity: updatedCapacity,
      mrpState: newMrp,
      isWaiting: nextDayEvents.length > 0,
    }
  }

  // --- 週末処理（金曜日終了） ---
  const weeklyReport = evaluateWeekly({
    ...state,
    productionLines: updatedLines,
    workCapacity: updatedCapacity,
    mrpState: newMrp,
  } as unknown as GameState)

  const newWeeklyScores = [...state.weeklyScores, weeklyReport]

  if (currentWeek >= 4) {
    // --- 月末 → ゲーム終了 ---
    return {
      phase: 'monthResult',
      weeklyScores: newWeeklyScores,
      productionLines: updatedLines,
      workCapacity: updatedCapacity,
      mrpState: newMrp,
      isGameOver: true,
    }
  }

  // --- 次の週へ ---
  const nextWeek = currentWeek + 1
  const newDirective = generateDirective(nextWeek, state.scores)
  const newWeekEvents = scheduleWeeklyEvents(nextWeek)
  const day1Events = getEventsForDay(newWeekEvents, 1)
    .filter(e => e.category !== 'director')

  const weekStartStream: EventStreamItem[] = [
    {
      id: randomUUID(),
      timestamp: { week: nextWeek, day: 1 },
      characterId: 'system',
      title: `第${nextWeek}週開始`,
      content: `第${nextWeek}週が始まりました。`,
      severity: 'low',
      category: 'manufacturing',
      isRead: true,
    },
    {
      id: randomUUID(),
      timestamp: { week: nextWeek, day: 1 },
      characterId: 'factory_director',
      title: newDirective.title,
      content: newDirective.description,
      severity: 'critical',
      category: 'director',
      isRead: false,
      isDirective: true,
    },
  ]

  return {
    phase: 'weekResult',
    currentWeek: nextWeek,
    currentDay: 1,
    dayTimeRemaining: 2,
    weeklyScores: newWeeklyScores,
    activeDirective: newDirective,
    allWeekEvents: newWeekEvents,
    pendingEvents: day1Events,
    resolvedEventIds: [],
    eventStream: [...state.eventStream, ...weekStartStream],
    productionLines: updatedLines,
    workCapacity: updatedCapacity,
    mrpState: newMrp,
    riskPoints: Math.max(0, state.riskPoints - 10), // 週またぎでリスク少し減少
    isWaiting: false,
  }
}

function getDayName(day: number): string {
  const names = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日']
  return names[day - 1] ?? `${day}日目`
}
