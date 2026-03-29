import type {
  ApiResponse,
  GameStartResponse,
  GameActionResponse,
  GameState,
} from '../../shared/types'

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data: ApiResponse<T> = await res.json()
  if (!data.success || !data.data) {
    throw new Error(data.error ?? 'Unknown API error')
  }
  return data.data
}

export const api = {
  startGame: () =>
    request<GameStartResponse>('/game/start', { method: 'POST' }),

  getState: (sessionId: string) =>
    request<GameState>(`/game/state/${sessionId}`),

  performAction: (params: {
    sessionId: string
    eventId: string
    choiceId: string
    actionType: string
    dispatchTarget?: string
  }) =>
    request<GameActionResponse>('/game/action', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  getResult: (sessionId: string) =>
    request<{
      gameState: GameState
      evaluation: { grade: string; message: string; totalScore: number }
    }>(`/game/result/${sessionId}`),
}
