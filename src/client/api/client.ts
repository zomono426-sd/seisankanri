import type {
  ApiResponse,
  GameStartResponse,
  GameActionResponse,
  GameState,
  InvestigateResponse,
  NegotiateResponse,
  NegotiationTone,
  SupplierId,
  WeeklyReport,
  MonthlyReport,
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

  advanceDay: (sessionId: string) =>
    request<{ gameState: GameState }>('/game/advance-day', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }),

  continueWeek: (sessionId: string) =>
    request<{ gameState: GameState }>('/game/continue-week', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }),

  investigate: (params: { sessionId: string; eventId: string; choiceId: string }) =>
    request<InvestigateResponse>('/game/investigate', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  negotiate: (params: { sessionId: string; supplierId: SupplierId; tone: NegotiationTone }) =>
    request<NegotiateResponse>('/game/negotiate', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  getWeekResult: (sessionId: string) =>
    request<{ report: WeeklyReport; gameState: GameState }>(`/game/week-result/${sessionId}`),

  getMonthResult: (sessionId: string) =>
    request<{ report: MonthlyReport; gameState: GameState }>(`/game/month-result/${sessionId}`),
}
