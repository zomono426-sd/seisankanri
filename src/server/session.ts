import type { GameState } from '../shared/types.js'
import { buildGameGraph } from './agents/graph.js'
import type { CompiledGameGraph } from './agents/graph.js'

// インメモリセッション管理
export class SessionStore {
  private sessions = new Map<string, GameState>()
  private graphs = new Map<string, CompiledGameGraph>()
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  get(sessionId: string): GameState | undefined {
    return this.sessions.get(sessionId)
  }

  set(sessionId: string, state: GameState): void {
    this.sessions.set(sessionId, state)
    // グラフがまだない場合は作成
    if (!this.graphs.has(sessionId)) {
      this.graphs.set(sessionId, buildGameGraph(this.apiKey))
    }
  }

  getGraph(sessionId: string): CompiledGameGraph | undefined {
    return this.graphs.get(sessionId)
  }

  delete(sessionId: string): void {
    this.sessions.delete(sessionId)
    this.graphs.delete(sessionId)
  }

  // 古いセッションを定期クリーンアップ（1時間以上アクセスなし）
  cleanup(): void {
    // MVP: 常にクリーンアップ（セッションは最大10件）
    if (this.sessions.size > 10) {
      const firstKey = this.sessions.keys().next().value
      if (firstKey) {
        this.delete(firstKey)
      }
    }
  }
}
