import type { GameGraphState } from '../state.js'
import type { CharacterId, GameState, EventStreamItem } from '../../../shared/types.js'
import {
  calcDispatchSuccessRate,
  calcSelfSuccessRate,
  getFailureLevel,
  FAILURE_DESCRIPTIONS,
} from '../../game/probability.js'
import {
  calcScoreDeltas,
  calcRelationshipDeltas,
  applyScoreDelta,
  checkGameOver,
} from '../../game/scoring.js'
import { generateCharacterResponse, generateFailureResponse } from '../characters/index.js'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { randomUUID } from 'crypto'

export function createActionResolverNode(model: ChatGoogleGenerativeAI) {
  return async function actionResolverNode(
    state: GameGraphState
  ): Promise<Partial<GameGraphState>> {
    const { playerAction, pendingEvents, scores, relationships, mrpState } = state

    if (!playerAction) return {}

    const event = pendingEvents.find(e => e.id === playerAction.eventId)
    if (!event) return {}

    const choice = event.choices.find(c => c.id === playerAction.choiceId)
    if (!choice) return {}

    let success = false
    let failureLevel: ReturnType<typeof getFailureLevel> | undefined
    let characterResponse = ''
    const newStreamItems: EventStreamItem[] = []

    // 時間コスト計算
    let timeConsumed = choice.timeCost
    let newDayTimeRemaining = state.dayTimeRemaining
    if (timeConsumed === 'half_day') newDayTimeRemaining = Math.max(0, newDayTimeRemaining - 1)
    else if (timeConsumed === 'full_day') newDayTimeRemaining = 0

    // --- アクション処理 ---
    if (choice.actionType === 'defer') {
      success = true
      const newRisk = state.riskPoints + 15
      characterResponse = `【保留】「${choice.context ?? '様子を見る'}」——リスクポイントが蓄積されました。`

      const scoreDeltas = calcScoreDeltas(event.id, choice.id, false, 'minor')
      const relDeltas = calcRelationshipDeltas(event.id, choice.id, false, 'minor')
      const newScores = applyScoreDelta(scores, scoreDeltas)
      const newRelationships = applyRelDelta(relationships, relDeltas)
      const gameOverCheck = checkGameOver({ scores: newScores, relationships: newRelationships } as GameState)

      newStreamItems.push({
        id: randomUUID(),
        timestamp: { week: state.currentWeek, day: state.currentDay },
        characterId: 'system',
        title: '保留',
        content: characterResponse,
        severity: 'medium',
        category: event.category,
        isRead: true,
        eventId: event.id,
      })

      return {
        characterResponse,
        scores: newScores,
        relationships: newRelationships,
        riskPoints: newRisk,
        resolvedEventIds: [...state.resolvedEventIds, event.id],
        pendingEvents: pendingEvents.filter(e => e.id !== event.id),
        eventStream: [...state.eventStream, ...newStreamItems],
        dayTimeRemaining: newDayTimeRemaining,
        isWaiting: pendingEvents.length > 1,
        playerAction: null,
        isGameOver: gameOverCheck.isOver,
        gameOverReason: gameOverCheck.reason,
        lastActionOutcome: {
          success: false,
          message: '保留しました。後でより大きな問題になる可能性があります。',
          scoreDeltas,
          timeConsumed: choice.timeCost,
        },
      }
    }

    if (choice.actionType === 'self' || choice.actionType === 'investigate') {
      const successRate = calcSelfSuccessRate()
      const roll = Math.random()
      success = roll <= successRate

      characterResponse = await generateCharacterResponse(
        event.characterId,
        event.description,
        choice.label,
        buildMiniState(state),
        model
      )
    } else if (choice.actionType === 'dispatch' && choice.dispatchTarget) {
      const dispatcher = choice.dispatchTarget
      const target = event.characterId
      const currentRel = relationships[dispatcher] ?? 50

      const successRate = calcDispatchSuccessRate({
        dispatcher,
        target,
        currentRelationship: currentRel,
        instructionQuality: 0.7,
      })
      const roll = Math.random()
      success = roll <= successRate

      if (success) {
        characterResponse = await generateCharacterResponse(
          dispatcher,
          event.description,
          choice.label,
          buildMiniState(state),
          model
        )
      } else {
        failureLevel = getFailureLevel(successRate, roll)
        characterResponse = await generateFailureResponse(
          dispatcher,
          target,
          FAILURE_DESCRIPTIONS[failureLevel],
          model
        )
      }
    }

    // スコア・関係値更新
    const scoreDeltas = calcScoreDeltas(event.id, choice.id, success, failureLevel)
    const relDeltas = calcRelationshipDeltas(event.id, choice.id, success, failureLevel)
    const newScores = applyScoreDelta(scores, scoreDeltas)
    const newRelationships = applyRelDelta(relationships, relDeltas)

    // イベントストリームに結果追加
    newStreamItems.push({
      id: randomUUID(),
      timestamp: { week: state.currentWeek, day: state.currentDay },
      characterId: event.characterId,
      title: success ? `対応完了: ${event.title}` : `対応失敗: ${event.title}`,
      content: characterResponse,
      severity: success ? 'low' : 'high',
      category: event.category,
      isRead: true,
      eventId: event.id,
    })

    const gameOverCheck = checkGameOver({ scores: newScores, relationships: newRelationships } as GameState)

    // MRP更新
    const newMrpState = updateMrpProgress(mrpState, success)

    // 残りのpendingEvents
    const remainingEvents = pendingEvents.filter(e => e.id !== event.id)

    return {
      characterResponse,
      scores: newScores,
      relationships: newRelationships,
      mrpState: newMrpState,
      resolvedEventIds: [...state.resolvedEventIds, event.id],
      pendingEvents: remainingEvents,
      eventStream: [...state.eventStream, ...newStreamItems],
      dayTimeRemaining: newDayTimeRemaining,
      isWaiting: remainingEvents.length > 0,
      playerAction: null,
      isGameOver: gameOverCheck.isOver,
      gameOverReason: gameOverCheck.reason,
      lastActionOutcome: {
        success,
        message: success
          ? `対応成功。${choice.label}を実行しました。`
          : `対応失敗（${failureLevel ? FAILURE_DESCRIPTIONS[failureLevel] : '不明'}）`,
        scoreDeltas,
        timeConsumed: choice.timeCost,
      },
    }
  }
}

function applyRelDelta(
  current: Record<CharacterId, number>,
  delta: Partial<Record<CharacterId, number>>
): Record<CharacterId, number> {
  const result = { ...current }
  for (const [key, val] of Object.entries(delta)) {
    const k = key as CharacterId
    result[k] = Math.min(100, Math.max(0, (result[k] ?? 50) + (val ?? 0)))
  }
  return result
}

function updateMrpProgress(mrpState: GameGraphState['mrpState'], success: boolean) {
  if (!success) return mrpState
  const bonus = Math.floor(Math.random() * 2) + 1
  return {
    ...mrpState,
    weeklyCompleted: Math.min(mrpState.weeklyPlanned, mrpState.weeklyCompleted + bonus),
  }
}

function buildMiniState(state: GameGraphState): GameState {
  return {
    sessionId: state.sessionId,
    phase: state.phase as GameState['phase'],
    currentWeek: state.currentWeek,
    currentDay: state.currentDay,
    dayTimeRemaining: state.dayTimeRemaining,
    scores: state.scores,
    weeklyScores: state.weeklyScores,
    departments: state.departments,
    productionLines: state.productionLines,
    suppliers: state.suppliers,
    workCapacity: state.workCapacity,
    activeDirective: state.activeDirective,
    eventStream: state.eventStream,
    pendingEvents: state.pendingEvents,
    pendingNegotiation: state.pendingNegotiation,
    relationships: state.relationships,
    mrpState: state.mrpState,
    riskPoints: state.riskPoints,
    isGameOver: state.isGameOver,
    gameOverReason: state.gameOverReason,
  }
}
