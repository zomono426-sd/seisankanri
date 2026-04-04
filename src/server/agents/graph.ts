import { StateGraph, START, END } from '@langchain/langgraph'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { GameStateAnnotation } from './state.js'
import { eventSchedulerNode } from './nodes/eventScheduler.js'
import { createActionResolverNode } from './nodes/actionResolver.js'
import { timeAdvanceNode } from './nodes/timeAdvance.js'

// ゲームグラフの構築（v2: 週次/月次対応）
export function buildGameGraph(apiKey: string) {
  const model = new ChatGoogleGenerativeAI({
    apiKey,
    model: 'gemini-2.0-flash',
    temperature: 0.8,
    maxOutputTokens: 300,
  })

  const actionResolver = createActionResolverNode(model)

  const graph = new StateGraph(GameStateAnnotation)
    .addNode('eventScheduler', eventSchedulerNode)
    .addNode('actionResolver', actionResolver)
    .addNode('timeAdvance', timeAdvanceNode)

    .addEdge(START, 'eventScheduler')

    .addConditionalEdges('eventScheduler', (state) => {
      if (state.isGameOver) return END
      if (state.playerAction) return 'actionResolver'
      if (state.isWaiting) return END  // プレイヤー入力待ち
      return 'timeAdvance'
    })

    .addEdge('actionResolver', 'timeAdvance')

    .addConditionalEdges('timeAdvance', (state) => {
      if (state.isGameOver) return END
      if (state.phase === 'weekResult') return END  // 週次評価画面へ
      if (state.phase === 'monthResult') return END  // 月次結果画面へ
      if (state.isWaiting) return END  // 次のイベント待ち
      return 'eventScheduler'
    })

  return graph.compile()
}

export type CompiledGameGraph = ReturnType<typeof buildGameGraph>
