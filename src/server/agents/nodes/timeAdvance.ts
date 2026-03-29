import type { GameGraphState } from '../state.js'
import { getTimeSlot } from '../../game/initialState.js'
import type { GameEvent } from '../../../shared/types.js'
import { EVENT_CATALOG } from '../../game/events.js'

// 次のイベントまでゲーム時間を進める
export async function timeAdvanceNode(
  state: GameGraphState
): Promise<Partial<GameGraphState>> {
  const { gameTime, events, resolvedEventIds, deferredEventIds, lastActionOutcome } = state

  const handledIds = new Set([...resolvedEventIds, ...deferredEventIds])

  // アクションで消費した時間を加算
  const timeConsumed = lastActionOutcome?.timeConsumed ?? 15
  const afterAction = Math.min(gameTime + timeConsumed, 17 * 60 + 30)

  // 次の未処理イベントの時刻を探す
  const upcomingEvent = events
    .filter((e) => e.triggerTime > gameTime && !handledIds.has(e.id))
    .sort((a, b) => a.triggerTime - b.triggerTime)[0]

  // 次のイベントがアクション後より未来なら、そのイベント時刻まで一気に進める
  const nextTime = (upcomingEvent && upcomingEvent.triggerTime > afterAction)
    ? upcomingEvent.triggerTime
    : Math.min(afterAction, 17 * 60 + 30)

  // 連鎖イベント発動チェック（保留ポイントが高い場合）
  const chainEvents = checkChainEvents(state)

  const newEvents = chainEvents.length > 0
    ? [...events, ...chainEvents]
    : events

  return {
    gameTime: nextTime,
    timeSlot: getTimeSlot(nextTime),
    events: newEvents,
    isGameOver: nextTime >= 17 * 60 + 30,
  }
}

// 保留ポイントによる連鎖イベント発動
function checkChainEvents(state: GameGraphState): GameEvent[] {
  const { riskPoints, deferredEventIds, events } = state
  if (riskPoints < 30) return []

  // E4（連鎖危機）がまだ発生していない場合のみ追加
  const e4Exists = events.some((e) => e.id === 'E4_chain_crisis')
  const e4Handled = deferredEventIds.includes('E4_chain_crisis') ||
    state.resolvedEventIds.includes('E4_chain_crisis')

  if (!e4Exists && !e4Handled) {
    const e4 = EVENT_CATALOG.find((e) => e.id === 'E4_chain_crisis')
    if (e4) {
      // 現在時刻 + 5分後にトリガー
      return [{ ...e4, triggerTime: state.gameTime + 5 }]
    }
  }

  return []
}
