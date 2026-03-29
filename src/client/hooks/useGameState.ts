import { useState, useCallback } from 'react'
import type { GameState, EventChoice } from '../../shared/types'
import { api } from '../api/client'

type GamePhaseUI = 'title' | 'playing' | 'result' | 'loading'

export function useGameState() {
  const [phase, setPhase] = useState<GamePhaseUI>('title')
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [characterResponse, setCharacterResponse] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [evaluation, setEvaluation] = useState<{
    grade: string
    message: string
    totalScore: number
  } | null>(null)

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
    async (choice: EventChoice) => {
      if (!sessionId || !gameState?.pendingEvent || isProcessing) return
      setIsProcessing(true)
      setError(null)
      try {
        const result = await api.performAction({
          sessionId,
          eventId: gameState.pendingEvent.id,
          choiceId: choice.id,
          actionType: choice.actionType,
          dispatchTarget: choice.dispatchTarget,
        })
        setGameState(result.gameState)
        setCharacterResponse(result.characterResponse)

        if (result.gameState.isGameOver) {
          // ゲームオーバー or 通常終了
          const evalResult = await api.getResult(sessionId)
          setEvaluation(evalResult.evaluation)
          setPhase('result')
        }
      } catch (err) {
        setError(String(err))
      } finally {
        setIsProcessing(false)
      }
    },
    [sessionId, gameState, isProcessing]
  )

  const resetGame = useCallback(() => {
    setPhase('title')
    setGameState(null)
    setSessionId(null)
    setCharacterResponse(null)
    setError(null)
    setEvaluation(null)
  }, [])

  return {
    phase,
    gameState,
    sessionId,
    characterResponse,
    error,
    isProcessing,
    evaluation,
    startGame,
    performAction,
    resetGame,
  }
}
