import { useState, useCallback } from 'react'
import type {
  GameState,
  EventChoice,
  GameEvent,
  ImpactAnalysis,
  WeeklyReport,
  MonthlyReport,
  NegotiationTone,
  SupplierId,
} from '../../shared/types'
import { api } from '../api/client'

type GamePhaseUI = 'title' | 'loading' | 'playing' | 'weekResult' | 'monthResult'

export function useGameState() {
  const [phase, setPhase] = useState<GamePhaseUI>('title')
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [characterResponse, setCharacterResponse] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null)
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null)
  const [impactAnalysis, setImpactAnalysis] = useState<ImpactAnalysis | null>(null)

  const startGame = useCallback(async () => {
    setPhase('loading')
    setError(null)
    try {
      const { sessionId: sid, gameState: state } = await api.startGame()
      setSessionId(sid)
      setGameState(state)
      setCharacterResponse(null)
      setPhase('playing')
    } catch (err) {
      setError(String(err))
      setPhase('title')
    }
  }, [])

  const performAction = useCallback(
    async (event: GameEvent, choice: EventChoice) => {
      if (!sessionId || isProcessing) return
      setIsProcessing(true)
      setError(null)
      setImpactAnalysis(null)
      try {
        const result = await api.performAction({
          sessionId,
          eventId: event.id,
          choiceId: choice.id,
          actionType: choice.actionType,
          dispatchTarget: choice.dispatchTarget,
        })
        setGameState(result.gameState)
        setCharacterResponse(result.characterResponse)

        // フェーズチェック
        if (result.gameState.phase === 'weekResult') {
          const weekResult = await api.getWeekResult(sessionId)
          setWeeklyReport(weekResult.report)
          setPhase('weekResult')
        } else if (result.gameState.phase === 'monthResult' || result.gameState.isGameOver) {
          const monthResult = await api.getMonthResult(sessionId)
          setMonthlyReport(monthResult.report)
          setPhase('monthResult')
        }
      } catch (err) {
        setError(String(err))
      } finally {
        setIsProcessing(false)
      }
    },
    [sessionId, isProcessing]
  )

  const advanceDay = useCallback(async () => {
    if (!sessionId || isProcessing) return
    setIsProcessing(true)
    try {
      const result = await api.advanceDay(sessionId)
      setGameState(result.gameState)

      if (result.gameState.phase === 'weekResult') {
        const weekResult = await api.getWeekResult(sessionId)
        setWeeklyReport(weekResult.report)
        setPhase('weekResult')
      } else if (result.gameState.phase === 'monthResult') {
        const monthResult = await api.getMonthResult(sessionId)
        setMonthlyReport(monthResult.report)
        setPhase('monthResult')
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setIsProcessing(false)
    }
  }, [sessionId, isProcessing])

  const continueToNextWeek = useCallback(async () => {
    if (!sessionId) return
    try {
      const result = await api.continueWeek(sessionId)
      setGameState(result.gameState)
      setWeeklyReport(null)
      setPhase('playing')
    } catch (err) {
      setError(String(err))
    }
  }, [sessionId])

  const investigate = useCallback(
    async (eventId: string, choiceId: string) => {
      if (!sessionId || isProcessing) return
      setIsProcessing(true)
      try {
        const result = await api.investigate({ sessionId, eventId, choiceId })
        setImpactAnalysis(result.analysis)
        setGameState(result.gameState)
      } catch (err) {
        setError(String(err))
      } finally {
        setIsProcessing(false)
      }
    },
    [sessionId, isProcessing]
  )

  const negotiate = useCallback(
    async (supplierId: SupplierId, tone: NegotiationTone) => {
      if (!sessionId || isProcessing) return
      setIsProcessing(true)
      try {
        const result = await api.negotiate({ sessionId, supplierId, tone })
        setGameState(result.gameState)
        setCharacterResponse(result.supplierResponse)
      } catch (err) {
        setError(String(err))
      } finally {
        setIsProcessing(false)
      }
    },
    [sessionId, isProcessing]
  )

  const allocateOrder = useCallback(
    async (orderNo: string, quantity: number) => {
      if (!sessionId || isProcessing) return
      setIsProcessing(true)
      try {
        const result = await api.allocateOrder({ sessionId, orderNo, quantity })
        setGameState(result.gameState)
      } catch (err) {
        setError(String(err))
      } finally {
        setIsProcessing(false)
      }
    },
    [sessionId, isProcessing]
  )

  const resetGame = useCallback(() => {
    setPhase('title')
    setGameState(null)
    setSessionId(null)
    setCharacterResponse(null)
    setError(null)
    setWeeklyReport(null)
    setMonthlyReport(null)
    setImpactAnalysis(null)
  }, [])

  return {
    phase,
    gameState,
    sessionId,
    characterResponse,
    error,
    isProcessing,
    weeklyReport,
    monthlyReport,
    impactAnalysis,
    startGame,
    performAction,
    advanceDay,
    continueToNextWeek,
    investigate,
    negotiate,
    allocateOrder,
    resetGame,
  }
}
