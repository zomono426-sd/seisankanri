import { StateGraph, START, END } from '@langchain/langgraph'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { GameStateAnnotation } from './state.js'
import { eventSchedulerNode } from './nodes/eventScheduler.js'
import { createActionResolverNode } from './nodes/actionResolver.js'
import { timeAdvanceNode } from './nodes/timeAdvance.js'

// ゲームグラフの構築
export function buildGameGraph(apiKey: string) {
  const model = new ChatGoogleGenerativeAI({
    apiKey,
    model: 'gemini-2.0-flash',
    temperature: 0.8,  // キャラクターの発話に適度なランダム性を持たせる
    maxOutputTokens: 300,
  })

  const actionResolver = createActionResolverNode(model)

  const graph = new StateGraph(GameStateAnnotation)
    // ノード定義
    .addNode('eventScheduler', eventSchedulerNode)
    .addNode('actionResolver', actionResolver)
    .addNode('timeAdvance', timeAdvanceNode)

    // エントリーポイント
    .addEdge(START, 'eventScheduler')

    // eventScheduler → 条件分岐
    .addConditionalEdges('eventScheduler', (state) => {
      if (state.isGameOver) return END
      if (state.playerAction) return 'actionResolver'  // プレイヤーがアクションを選択済み
      if (state.isWaiting) return END                  // プレイヤー入力待ち
      return 'timeAdvance'                             // イベントがない場合は時間を進める
    })

    // actionResolver → timeAdvance（アクション処理後は時間を進める）
    .addEdge('actionResolver', 'timeAdvance')

    // timeAdvance → 条件分岐
    .addConditionalEdges('timeAdvance', (state) => {
      if (state.isGameOver) return END
      return 'eventScheduler'
    })

  return graph.compile({
    // チェックポインター（インメモリ）でヒューマンインザループを実現
    // 本番ではSqliteCheckpointerを使う
  })
}

export type CompiledGameGraph = ReturnType<typeof buildGameGraph>
