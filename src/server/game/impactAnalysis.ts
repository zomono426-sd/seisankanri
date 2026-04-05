import type { GameState, ImpactAnalysis, GameEvent, EventChoice } from '../../shared/types.js'
import type { ChatGoogleGenerativeAI } from '@langchain/google-genai'

// ============================================================
// AI影響調査 — Gemini APIで意思決定の影響を予測
// 時間コスト: 半日消費。回数制限なし。
// ============================================================

// AI影響調査を実行
export async function runImpactAnalysis(
  model: ChatGoogleGenerativeAI,
  gameState: GameState,
  event: GameEvent,
  choice: EventChoice
): Promise<ImpactAnalysis> {
  const prompt = buildAnalysisPrompt(gameState, event, choice)

  try {
    const response = await model.invoke([
      {
        role: 'system',
        content: `あなたは生産管理のAIアドバイザーです。工場の生産管理シミュレーションゲームにおいて、プレイヤーの意思決定の影響を分析します。
以下のJSON形式で回答してください。日本語で回答してください。
{
  "deliveryRate": {"delta": 数値(-20〜+20), "confidence": "low"|"medium"|"high"},
  "fieldTrust": {"delta": 数値(-20〜+20), "confidence": "low"|"medium"|"high"},
  "costControl": {"delta": 数値(-20〜+20), "confidence": "low"|"medium"|"high"},
  "customerSatisfaction": {"delta": 数値(-20〜+20), "confidence": "low"|"medium"|"high"},
  "risks": ["リスク1", "リスク2"],
  "recommendation": "短い推奨文（100文字以内）"
}`,
      },
      { role: 'user', content: prompt },
    ])

    const text = typeof response.content === 'string' ? response.content : JSON.stringify(response.content)
    const parsed = parseAnalysisResponse(text)

    return {
      eventId: event.id,
      choiceId: choice.id,
      prediction: parsed.prediction,
      risks: parsed.risks,
      recommendation: parsed.recommendation,
      timeCost: 'half_day',
    }
  } catch {
    // フォールバック: AI呼び出しが失敗した場合はヒューリスティック分析
    return generateFallbackAnalysis(event, choice)
  }
}

function buildAnalysisPrompt(state: GameState, event: GameEvent, choice: EventChoice): string {
  return `## 現在の工場状況
- 週: ${state.currentWeek}週目 / 日: ${state.currentDay}日目
- 納期達成率: ${state.scores.deliveryRate}
- 現場信頼度: ${state.scores.fieldTrust}
- コスト管理: ${state.scores.costControl}
- 顧客満足度: ${state.scores.customerSatisfaction}
- 作業能力: ${state.workCapacity.overallCapacity}%
- 出勤率: ${state.workCapacity.presentWorkers}/${state.workCapacity.totalWorkers}
- リスクポイント: ${state.riskPoints}
- 工場長指令: ${state.activeDirective?.title ?? 'なし'}

## 発生イベント
タイトル: ${event.title}
カテゴリ: ${event.category}
重要度: ${event.severity}
説明: ${event.description}

## 検討中の選択肢
選択: ${choice.label}
タイプ: ${choice.actionType}
時間コスト: ${choice.timeCost}
詳細: ${choice.context ?? ''}

この選択肢を実行した場合の影響を分析してください。`
}

function parseAnalysisResponse(text: string): {
  prediction: ImpactAnalysis['prediction']
  risks: string[]
  recommendation: string
} {
  try {
    // JSONブロックを抽出
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        prediction: {
          deliveryRate: parsed.deliveryRate ?? { delta: 0, confidence: 'low' },
          fieldTrust: parsed.fieldTrust ?? { delta: 0, confidence: 'low' },
          costControl: parsed.costControl ?? { delta: 0, confidence: 'low' },
          customerSatisfaction: parsed.customerSatisfaction ?? { delta: 0, confidence: 'low' },
        },
        risks: Array.isArray(parsed.risks) ? parsed.risks : ['分析データ不足'],
        recommendation: parsed.recommendation ?? '慎重に判断してください。',
      }
    }
  } catch {
    // パース失敗
  }

  return {
    prediction: {
      deliveryRate: { delta: 0, confidence: 'low' },
      fieldTrust: { delta: 0, confidence: 'low' },
      costControl: { delta: 0, confidence: 'low' },
      customerSatisfaction: { delta: 0, confidence: 'low' },
    },
    risks: ['AI分析が完了できませんでした'],
    recommendation: '手動で影響を判断してください。',
  }
}

// フォールバック分析（ヒューリスティック）
function generateFallbackAnalysis(event: GameEvent, choice: EventChoice): ImpactAnalysis {
  const isDefer = choice.actionType === 'defer'
  const isSelf = choice.actionType === 'self'
  const isHighCost = choice.timeCost === 'full_day'

  return {
    eventId: event.id,
    choiceId: choice.id,
    prediction: {
      deliveryRate: {
        delta: isDefer ? -5 : isSelf ? 3 : 1,
        confidence: 'low',
      },
      fieldTrust: {
        delta: isDefer ? -3 : isSelf ? 2 : 0,
        confidence: 'low',
      },
      costControl: {
        delta: isHighCost ? -5 : isSelf ? -2 : 0,
        confidence: 'medium',
      },
      customerSatisfaction: {
        delta: isDefer ? -5 : 0,
        confidence: 'low',
      },
    },
    risks: isDefer
      ? ['先送りによるリスク蓄積', '問題の悪化']
      : ['時間コストによる他タスクへの影響'],
    recommendation: isDefer
      ? '先送りはリスクが蓄積します。できるだけ早期に対応することを推奨。'
      : '状況に応じた適切な対応です。',
    timeCost: 'half_day',
  }
}
