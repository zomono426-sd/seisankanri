import type { GameGraphState } from '../state.js'
import { getTimeSlot } from '../../game/initialState.js'

// 現在のゲーム時刻でトリガーすべきイベントを判定し pendingEvent にセットする
export async function eventSchedulerNode(
  state: GameGraphState
): Promise<Partial<GameGraphState>> {
  const { gameTime, events, resolvedEventIds, deferredEventIds, pendingEvent } = state

  // すでに対応待ちのイベントがある場合はそのまま
  if (pendingEvent) {
    return {}
  }

  // 解決済み・保留中のIDセット
  const handledIds = new Set([...resolvedEventIds, ...deferredEventIds])

  // 現在時刻以前にトリガーされるべきイベントを時刻順で検索
  const nextEvent = events
    .filter((e) => e.triggerTime <= gameTime && !handledIds.has(e.id))
    .sort((a, b) => a.triggerTime - b.triggerTime)[0]

  if (!nextEvent) {
    // ゲーム終了時刻を超えた場合
    if (gameTime >= 17 * 60 + 30) {
      return { isGameOver: true }
    }
    return {}
  }

  return {
    pendingEvent: nextEvent,
    timeSlot: getTimeSlot(gameTime),
    isWaiting: true,
  }
}
