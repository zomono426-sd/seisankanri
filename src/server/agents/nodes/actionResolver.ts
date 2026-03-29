import type { GameGraphState } from '../state.js'
import type { CharacterId, ConversationMessage, GameState } from '../../../shared/types.js'
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
  shouldTriggerChainEvent,
} from '../../game/scoring.js'
import { generateCharacterResponse, generateFailureResponse } from '../characters/index.js'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { randomUUID } from 'crypto'
import { minutesToTime } from '../../game/initialState.js'

export function createActionResolverNode(model: ChatGoogleGenerativeAI) {
  return async function actionResolverNode(
    state: GameGraphState
  ): Promise<Partial<GameGraphState>> {
    const { playerAction, pendingEvent, scores, relationships, mrpState, conversations } = state

    if (!playerAction || !pendingEvent) {
      return {}
    }

    const choice = pendingEvent.choices.find((c) => c.id === playerAction.choiceId)
    if (!choice) return {}

    let success = false
    let failureLevel: ReturnType<typeof getFailureLevel> | undefined
    let characterResponse = ''
    const newConversations: ConversationMessage[] = []

    // ── アクションタイプ別処理 ──
    if (choice.actionType === 'defer') {
      // 保留: 常に「一時的成功」だが後でリスクが爆発
      success = true
      const newRisk = state.riskPoints + 15
      characterResponse = `【保留】「${choice.context ?? '様子を見る'}」——リスクポイントが蓄積されました。`

      const scoreDeltas = calcScoreDeltas(pendingEvent.id, choice.id, false, 'minor')
      const relDeltas = calcRelationshipDeltas(pendingEvent.id, choice.id, false, 'minor')
      const newScores = applyScoreDelta(scores, scoreDeltas)
      const newRelationships = applyRelationshipDelta(relationships, relDeltas)
      const gameOverCheck = checkGameOver({
        scores: newScores,
        relationships: newRelationships,
      } as GameState)

      newConversations.push({
        id: randomUUID(),
        characterId: 'system',
        content: characterResponse,
        isPlayer: false,
        timestamp: state.gameTime,
        realTimestamp: new Date().toISOString(),
        eventId: pendingEvent.id,
      })

      return {
        characterResponse,
        scores: newScores,
        relationships: newRelationships,
        riskPoints: newRisk,
        resolvedEventIds: [pendingEvent.id],
        deferredEventIds: [pendingEvent.id],
        pendingEvent: null,
        isWaiting: false,
        conversations: newConversations,
        isGameOver: gameOverCheck.isOver,
        gameOverReason: gameOverCheck.reason,
        lastActionOutcome: {
          success: false,
          message: '保留しました。後でより大きな問題になる可能性があります。',
          scoreDeltas,
          timeConsumed: choice.timeConsumption,
        },
      }
    }

    if (choice.actionType === 'self') {
      // プレイヤー直接対応
      const successRate = calcSelfSuccessRate()
      const roll = Math.random()
      success = roll <= successRate

      const situation = pendingEvent.description
      const actionDesc = choice.label

      characterResponse = await generateCharacterResponse(
        pendingEvent.characterId,
        situation,
        actionDesc,
        {
          ...state,
          phase: 'playing',
          sessionId: state.sessionId,
          lastCharacterResponse: null,
          isGameOver: state.isGameOver,
        } as GameState,
        model
      )
    } else if (choice.actionType === 'dispatch' && choice.dispatchTarget) {
      // 部下派遣
      const dispatcher = choice.dispatchTarget
      const target = pendingEvent.characterId
      const currentRel = relationships[dispatcher] ?? 50

      const successRate = calcDispatchSuccessRate({
        dispatcher,
        target,
        currentRelationship: currentRel,
        instructionQuality: 0.7, // MVP: 指示品質は固定
      })
      const roll = Math.random()
      success = roll <= successRate

      if (success) {
        characterResponse = await generateCharacterResponse(
          dispatcher,
          pendingEvent.description,
          choice.label,
          {
            ...state,
            phase: 'playing',
            sessionId: state.sessionId,
            lastCharacterResponse: null,
            isGameOver: state.isGameOver,
          } as GameState,
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
    const scoreDeltas = calcScoreDeltas(pendingEvent.id, choice.id, success, failureLevel)
    const relDeltas = calcRelationshipDeltas(pendingEvent.id, choice.id, success, failureLevel)
    const newScores = applyScoreDelta(scores, scoreDeltas)
    const newRelationships = applyRelationshipDelta(relationships, relDeltas)

    // 会話ログに追加
    newConversations.push({
      id: randomUUID(),
      characterId: pendingEvent.characterId,
      content: characterResponse,
      isPlayer: false,
      timestamp: state.gameTime,
      realTimestamp: new Date().toISOString(),
      eventId: pendingEvent.id,
    })

    // ゲームオーバーチェック
    const gameOverCheck = checkGameOver({
      scores: newScores,
      relationships: newRelationships,
    } as GameState)

    // 連鎖イベント確認
    const triggeredChain = shouldTriggerChainEvent(state.riskPoints)

    // MRP実績更新（簡易: 成功したアクションが進行に繋がる）
    const newMrpState = updateMrpState(mrpState, pendingEvent.id, success)

    return {
      characterResponse,
      scores: newScores,
      relationships: newRelationships,
      mrpState: newMrpState,
      resolvedEventIds: [pendingEvent.id],
      pendingEvent: null,
      isWaiting: false,
      playerAction: null,
      conversations: newConversations,
      isGameOver: gameOverCheck.isOver,
      gameOverReason: gameOverCheck.reason,
      lastActionOutcome: {
        success,
        message: success
          ? `対応成功。${choice.label}を実行しました。`
          : `対応失敗（${failureLevel ? FAILURE_DESCRIPTIONS[failureLevel] : '不明'}）`,
        scoreDeltas,
        timeConsumed: choice.timeConsumption,
      },
    }
  }
}

// 関係値をクランプして更新
function applyRelationshipDelta(
  current: GameState['relationships'],
  delta: Partial<Record<CharacterId, number>>
): GameState['relationships'] {
  const result = { ...current }
  for (const [key, val] of Object.entries(delta)) {
    const k = key as CharacterId
    result[k] = Math.min(100, Math.max(0, (result[k] ?? 50) + (val ?? 0)))
  }
  return result
}

// MRP実績を簡易更新
function updateMrpState(
  mrpState: GameState['mrpState'],
  eventId: string,
  success: boolean
): GameState['mrpState'] {
  if (!success) return mrpState

  // 成功したアクションに応じて完了台数を増やす（簡易ロジック）
  const completionBonus: Record<string, number> = {
    self_fix: 1,
    reschedule: 1,
    accept_change: 0,
    emergency_response: 2,
    prioritize_orders: 1,
    finalize_shipping: 2,
    all_hands: 3,
  }

  return {
    ...mrpState,
    totalCompleted: Math.min(
      mrpState.totalPlanned,
      mrpState.totalCompleted + (completionBonus[eventId] ?? 0)
    ),
  }
}
