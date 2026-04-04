import { Router } from 'express'
import type { Request, Response } from 'express'
import type {
  ApiResponse,
  GameStartResponse,
  GameActionResponse,
  PlayerAction,
  InvestigateResponse,
  NegotiateResponse,
  NegotiationTone,
  SupplierId,
} from '../../shared/types.js'
import { SessionStore } from '../session.js'
import { createInitialGameState } from '../game/initialState.js'
import { evaluateWeekly, evaluateMonthly } from '../game/scoring.js'
import { runImpactAnalysis } from '../game/impactAnalysis.js'
import { resolveNegotiation, generateNegotiationChoices, getSupplier } from '../game/suppliers.js'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'

export function createRouter(sessions: SessionStore, apiKey: string) {
  const router = Router()

  // AI影響調査用モデル
  const analysisModel = new ChatGoogleGenerativeAI({
    apiKey,
    model: 'gemini-2.0-flash',
    temperature: 0.5,
    maxOutputTokens: 500,
  })

  // ── POST /api/game/start ── ゲーム開始（月次ゲーム）
  router.post('/game/start', (_req: Request, res: Response) => {
    const initialState = createInitialGameState()
    sessions.set(initialState.sessionId, initialState)

    const response: ApiResponse<GameStartResponse> = {
      success: true,
      data: { sessionId: initialState.sessionId, gameState: initialState },
    }
    res.json(response)
  })

  // ── GET /api/game/state/:sessionId ── 現在のゲーム状態
  router.get('/game/state/:sessionId', (req: Request, res: Response) => {
    const state = sessions.get(req.params.sessionId)
    if (!state) {
      res.status(404).json({ success: false, error: 'Session not found' })
      return
    }
    res.json({ success: true, data: state })
  })

  // ── POST /api/game/action ── プレイヤーアクション
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

    const event = state.pendingEvents.find(e => e.id === eventId)
    if (!event) {
      res.status(400).json({ success: false, error: 'No matching pending event' })
      return
    }

    const playerAction: PlayerAction = {
      eventId,
      choiceId,
      actionType: actionType as PlayerAction['actionType'],
      dispatchTarget: dispatchTarget as PlayerAction['dispatchTarget'],
      week: state.currentWeek,
      day: state.currentDay,
    }

    try {
      const graph = sessions.getGraph(sessionId)
      if (!graph) {
        res.status(500).json({ success: false, error: 'Graph not found' })
        return
      }

      const result = await graph.invoke(
        { ...state, playerAction, isWaiting: false },
        { configurable: { thread_id: sessionId } }
      )

      const newState = { ...state, ...result, playerAction: null }
      sessions.set(sessionId, newState)

      const response: ApiResponse<GameActionResponse> = {
        success: true,
        data: {
          gameState: newState,
          characterResponse: result.characterResponse ?? '',
          outcome: {
            success: result.lastActionOutcome?.success ?? true,
            message: result.lastActionOutcome?.message ?? '',
            scoreDeltas: result.lastActionOutcome?.scoreDeltas ?? {},
            relationshipDeltas: {},
            supplierAffinityDeltas: {},
            timeConsumed: (result.lastActionOutcome?.timeConsumed ?? 'none') as 'none' | 'half_day' | 'full_day',
          },
        },
      }
      res.json(response)
    } catch (err) {
      console.error('[ActionError]', err)
      res.status(500).json({ success: false, error: String(err) })
    }
  })

  // ── POST /api/game/advance-day ── 次の日に進める
  router.post('/game/advance-day', async (req: Request, res: Response) => {
    const { sessionId } = req.body as { sessionId: string }
    const state = sessions.get(sessionId)
    if (!state) {
      res.status(404).json({ success: false, error: 'Session not found' })
      return
    }

    if (state.pendingEvents.length > 0) {
      res.status(400).json({ success: false, error: 'Pending events remain' })
      return
    }

    try {
      const graph = sessions.getGraph(sessionId)
      if (!graph) {
        res.status(500).json({ success: false, error: 'Graph not found' })
        return
      }

      const result = await graph.invoke(
        { ...state, isWaiting: false },
        { configurable: { thread_id: sessionId } }
      )

      const newState = { ...state, ...result }
      sessions.set(sessionId, newState)

      res.json({ success: true, data: { gameState: newState } })
    } catch (err) {
      console.error('[AdvanceDayError]', err)
      res.status(500).json({ success: false, error: String(err) })
    }
  })

  // ── POST /api/game/continue-week ── 週次評価後に次の週に進める
  router.post('/game/continue-week', async (req: Request, res: Response) => {
    const { sessionId } = req.body as { sessionId: string }
    const state = sessions.get(sessionId)
    if (!state) {
      res.status(404).json({ success: false, error: 'Session not found' })
      return
    }

    // weekResult画面から再開 → playing に戻す
    const newState = { ...state, phase: 'playing' as const }
    sessions.set(sessionId, newState)

    res.json({ success: true, data: { gameState: newState } })
  })

  // ── POST /api/game/investigate ── AI影響調査
  router.post('/game/investigate', async (req: Request, res: Response) => {
    const { sessionId, eventId, choiceId } = req.body as {
      sessionId: string
      eventId: string
      choiceId: string
    }

    const state = sessions.get(sessionId)
    if (!state) {
      res.status(404).json({ success: false, error: 'Session not found' })
      return
    }

    const event = state.pendingEvents.find(e => e.id === eventId)
    if (!event) {
      res.status(400).json({ success: false, error: 'Event not found' })
      return
    }

    const choice = event.choices.find(c => c.id === choiceId)
    if (!choice) {
      res.status(400).json({ success: false, error: 'Choice not found' })
      return
    }

    try {
      const analysis = await runImpactAnalysis(analysisModel, state, event, choice)

      // 時間コスト適用
      const newState = {
        ...state,
        dayTimeRemaining: Math.max(0, state.dayTimeRemaining - 1),
      }
      sessions.set(sessionId, newState)

      const response: ApiResponse<InvestigateResponse> = {
        success: true,
        data: { analysis, gameState: newState },
      }
      res.json(response)
    } catch (err) {
      console.error('[InvestigateError]', err)
      res.status(500).json({ success: false, error: String(err) })
    }
  })

  // ── POST /api/game/negotiate ── サプライヤー交渉
  router.post('/game/negotiate', async (req: Request, res: Response) => {
    const { sessionId, supplierId, tone } = req.body as {
      sessionId: string
      supplierId: SupplierId
      tone: NegotiationTone
    }

    const state = sessions.get(sessionId)
    if (!state) {
      res.status(404).json({ success: false, error: 'Session not found' })
      return
    }

    const supplier = getSupplier(state.suppliers, supplierId)
    if (!supplier) {
      res.status(400).json({ success: false, error: 'Supplier not found' })
      return
    }

    const result = resolveNegotiation(supplier, tone)

    // サプライヤー状態を更新
    const updatedSuppliers = state.suppliers.map(s => {
      if (s.id === supplierId) {
        return {
          ...s,
          affinity: Math.min(100, Math.max(0, s.affinity + result.affinityChange)),
          currentMood: result.newMood,
          lastInteraction: {
            week: state.currentWeek,
            day: state.currentDay,
            result: result.success ? 'success' as const : 'failure' as const,
          },
        }
      }
      return s
    })

    // 時間コスト適用（polite, negotiate, grateful は半日消費）
    const timeCost = tone === 'urgent' ? 0 : 1
    const newState = {
      ...state,
      suppliers: updatedSuppliers,
      dayTimeRemaining: Math.max(0, state.dayTimeRemaining - timeCost),
      pendingNegotiation: null,
    }
    sessions.set(sessionId, newState)

    const response: ApiResponse<NegotiateResponse> = {
      success: true,
      data: {
        success: result.success,
        supplierResponse: result.response,
        affinityChange: result.affinityChange,
        gameState: newState,
      },
    }
    res.json(response)
  })

  // ── GET /api/game/week-result/:sessionId ── 週次結果
  router.get('/game/week-result/:sessionId', (req: Request, res: Response) => {
    const state = sessions.get(req.params.sessionId)
    if (!state) {
      res.status(404).json({ success: false, error: 'Session not found' })
      return
    }

    const latestReport = state.weeklyScores[state.weeklyScores.length - 1]
    res.json({ success: true, data: { report: latestReport, gameState: state } })
  })

  // ── GET /api/game/month-result/:sessionId ── 月次最終結果
  router.get('/game/month-result/:sessionId', (req: Request, res: Response) => {
    const state = sessions.get(req.params.sessionId)
    if (!state) {
      res.status(404).json({ success: false, error: 'Session not found' })
      return
    }

    const monthlyReport = evaluateMonthly(state.weeklyScores, state.scores)
    res.json({ success: true, data: { report: monthlyReport, gameState: state } })
  })

  return router
}
