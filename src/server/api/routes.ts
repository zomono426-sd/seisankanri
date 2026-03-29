import { Router } from 'express'
import type { Request, Response } from 'express'
import type { ApiResponse, GameStartResponse, GameActionResponse, PlayerAction } from '../../shared/types.js'
import { SessionStore } from '../session.js'
import { createInitialGameState } from '../game/initialState.js'
import { evaluateFinalScore } from '../game/scoring.js'

export function createRouter(sessions: SessionStore) {
  const router = Router()

  // ── POST /api/game/start ── ゲーム開始
  router.post('/game/start', (req: Request, res: Response) => {
    const initialState = createInitialGameState()
    sessions.set(initialState.sessionId, initialState)

    const response: ApiResponse<GameStartResponse> = {
      success: true,
      data: {
        sessionId: initialState.sessionId,
        gameState: initialState,
      },
    }
    res.json(response)
  })

  // ── GET /api/game/state/:sessionId ── 現在のゲーム状態を取得
  router.get('/game/state/:sessionId', (req: Request, res: Response) => {
    const { sessionId } = req.params
    const state = sessions.get(sessionId)
    if (!state) {
      res.status(404).json({ success: false, error: 'Session not found' })
      return
    }
    res.json({ success: true, data: state })
  })

  // ── POST /api/game/action ── プレイヤーアクションを処理
  router.post('/game/action', async (req: Request, res: Response) => {
    const { sessionId, eventId, choiceId, actionType, dispatchTarget } = req.body as {
      sessionId: string
      eventId: string
      choiceId: string
      actionType: string
      dispatchTarget?: string
    }

    const state = sessions.get(sessionId)
    if (!state) {
      res.status(404).json({ success: false, error: 'Session not found' })
      return
    }

    if (!state.pendingEvent || state.pendingEvent.id !== eventId) {
      res.status(400).json({ success: false, error: 'No matching pending event' })
      return
    }

    const playerAction: PlayerAction = {
      eventId,
      choiceId,
      actionType: actionType as PlayerAction['actionType'],
      dispatchTarget: dispatchTarget as PlayerAction['dispatchTarget'],
      timestamp: state.gameTime,
    }

    try {
      const graph = sessions.getGraph(sessionId)
      if (!graph) {
        res.status(500).json({ success: false, error: 'Graph not found' })
        return
      }

      // グラフを再開（playerActionをセットして actionResolver から実行）
      const result = await graph.invoke(
        { ...state, playerAction, isWaiting: false },
        { configurable: { thread_id: sessionId } }
      )

      // セッション更新
      const newState = {
        ...state,
        ...result,
        playerAction: null,
      }
      sessions.set(sessionId, newState)

      const response: ApiResponse<GameActionResponse> = {
        success: true,
        data: {
          gameState: newState,
          characterResponse: result.characterResponse ?? '',
          outcome: result.lastActionOutcome
            ? {
                ...result.lastActionOutcome,
                relationshipDeltas: {},
                triggeredEvents: [],
              }
            : {
                success: true,
                message: '',
                scoreDeltas: {},
                relationshipDeltas: {},
                triggeredEvents: [],
                timeConsumed: 0,
              },
        },
      }
      res.json(response)
    } catch (err) {
      console.error('[ActionError]', err)
      res.status(500).json({ success: false, error: String(err) })
    }
  })

  // ── GET /api/game/result/:sessionId ── ゲーム終了結果
  router.get('/game/result/:sessionId', (req: Request, res: Response) => {
    const { sessionId } = req.params
    const state = sessions.get(sessionId)
    if (!state) {
      res.status(404).json({ success: false, error: 'Session not found' })
      return
    }

    const evaluation = evaluateFinalScore(state)
    res.json({ success: true, data: { gameState: state, evaluation } })
  })

  return router
}
