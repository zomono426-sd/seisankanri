import type { GameGraphState } from '../state.js'
import { getEventsForDay } from '../../game/events.js'
import { randomUUID } from 'crypto'
import type { EventStreamItem } from '../../../shared/types.js'

// 当日のイベントをスケジュールし、pendingEventsにセットする
export async function eventSchedulerNode(
  state: GameGraphState
): Promise<Partial<GameGraphState>> {
  const { currentDay, currentWeek, allWeekEvents, resolvedEventIds, pendingEvents } = state

  // すでに当日のイベントがpendingに入っている場合はスキップ
  if (pendingEvents.length > 0) {
    return { isWaiting: true }
  }

  // 当日のイベントを取得
  const resolvedSet = new Set(resolvedEventIds)
  const todayEvents = getEventsForDay(allWeekEvents, currentDay)
    .filter(e => !resolvedSet.has(e.id))

  if (todayEvents.length === 0) {
    // イベントがない場合 → 日終了へ
    return { pendingEvents: [], isWaiting: false }
  }

  // イベントストリームに通知追加
  const newStreamItems: EventStreamItem[] = todayEvents.map(e => ({
    id: randomUUID(),
    timestamp: { week: currentWeek, day: currentDay },
    characterId: e.characterId,
    title: e.title,
    content: e.description,
    severity: e.severity,
    category: e.category,
    isRead: false,
    eventId: e.id,
    isDirective: e.category === 'director',
  }))

  return {
    pendingEvents: todayEvents,
    eventStream: [...state.eventStream, ...newStreamItems],
    isWaiting: true,
  }
}
