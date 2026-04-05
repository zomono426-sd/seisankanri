import type { Supplier, SupplierId, SupplierNegotiation, NegotiationChoice, NegotiationTone } from '../../shared/types.js'

// ============================================================
// サプライヤー関係管理 — 恋愛シミュレーション風
// 調達部・木村が候補を提示 → プレイヤーがトーンを選んでお願い
// ============================================================

// --- 初期サプライヤー一覧（5社） ---
export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'daito_denki',
    name: '大東電機',
    specialty: '電装部品',
    parts: ['ACサーボモーター', '制御基板', 'インバーター'],
    affinity: 60,
    reliability: 85,
    priceLevel: 'high',
    personality: '実直な社長。約束は守るが融通は利かない。長年の取引関係を重視。',
    avatarColor: '#2563eb',
    currentMood: 'neutral',
  },
  {
    id: 'sakamoto_ss',
    name: '坂本製作所',
    specialty: '溶接フレーム',
    parts: ['溶接フレーム', '架台', 'ブラケット'],
    affinity: 70,
    reliability: 75,
    priceLevel: 'medium',
    personality: '義理堅い二代目社長。技術力は高いがキャパに限界。恩義を感じると無理をしてくれる。',
    avatarColor: '#0369a1',
    currentMood: 'good',
  },
  {
    id: 'mikawa_seimitsu',
    name: '三河精密',
    specialty: '精密部品',
    parts: ['精密シャフト', 'ベアリングホルダー', '位置決めピン'],
    affinity: 45,
    reliability: 95,
    priceLevel: 'high',
    personality: '品質にこだわる気難しい社長。雑な依頼を嫌う。好感度が成否に大きく影響する。',
    avatarColor: '#7c3aed',
    currentMood: 'neutral',
  },
  {
    id: 'maruyama_kinzoku',
    name: '丸山金属',
    specialty: '板金加工',
    parts: ['カバー', 'パネル', 'ダクト'],
    affinity: 65,
    reliability: 60,
    priceLevel: 'low',
    personality: '気さくな社長。何でも引き受けるが品質にばらつき。頼みやすいが注意が必要。',
    avatarColor: '#d97706',
    currentMood: 'good',
  },
  {
    id: 'tokai_logistics',
    name: '東海ロジスティクス',
    specialty: '物流・配送',
    parts: ['配送手配', '緊急便', '倉庫保管'],
    affinity: 55,
    reliability: 80,
    priceLevel: 'medium',
    personality: '効率重視の物流担当。関係が良いと配送優先度を上げてくれる。ルール厳守。',
    avatarColor: '#059669',
    currentMood: 'neutral',
  },
]

// --- 交渉トーン選択肢の生成 ---
export function generateNegotiationChoices(
  supplier: Supplier,
  requestDescription: string
): NegotiationChoice[] {
  const hasRecentSuccess = supplier.lastInteraction?.result === 'success'

  const choices: NegotiationChoice[] = [
    {
      tone: 'polite',
      label: '丁寧にお願いする',
      description: `「${supplier.name}さん、いつもお世話になっております。大変恐縮ですが、${requestDescription}...」`,
      affinityDelta: 3,
      timeCost: 'half_day',
      available: true,
    },
    {
      tone: 'urgent',
      label: '急ぎで頼む',
      description: `「${supplier.name}さん、申し訳ないのですが至急お願いしたいことが...」`,
      affinityDelta: -5,
      timeCost: 'none',
      available: true,
    },
    {
      tone: 'negotiate',
      label: '条件を提示して交渉する',
      description: `「${supplier.name}さん、今回の件について条件を相談させてください...」`,
      affinityDelta: 0,
      timeCost: 'half_day',
      available: true,
    },
    {
      tone: 'grateful',
      label: '前回のお礼を伝えつつ依頼',
      description: `「${supplier.name}さん、前回は本当に助かりました。実はまたお力を借りたいのですが...」`,
      affinityDelta: 8,
      timeCost: 'half_day',
      available: hasRecentSuccess,
    },
  ]

  return choices
}

// --- 交渉の成功判定 ---
export function resolveNegotiation(
  supplier: Supplier,
  tone: NegotiationTone
): {
  success: boolean
  affinityChange: number
  newMood: Supplier['currentMood']
  response: string
} {
  // 基礎成功率 = 好感度/100 * 信頼性/100
  let baseRate = (supplier.affinity / 100) * (supplier.reliability / 100)

  // トーンによる補正
  const toneModifiers: Record<NegotiationTone, number> = {
    polite: 0.15,
    urgent: -0.10,
    negotiate: 0.05,
    grateful: 0.25,
  }
  baseRate += toneModifiers[tone]

  // ムードによる補正
  const moodModifiers: Record<Supplier['currentMood'], number> = {
    good: 0.10,
    neutral: 0,
    annoyed: -0.15,
    angry: -0.30,
  }
  baseRate += moodModifiers[supplier.currentMood]

  // ランダム揺らぎ
  const noise = (Math.random() - 0.5) * 0.2
  const finalRate = Math.min(1.0, Math.max(0.0, baseRate + noise))
  const success = Math.random() < finalRate

  // 好感度変化
  let affinityChange: number
  if (success) {
    affinityChange = tone === 'grateful' ? 8 : tone === 'polite' ? 3 : tone === 'negotiate' ? 1 : -3
  } else {
    affinityChange = tone === 'urgent' ? -8 : tone === 'polite' ? -1 : -3
  }

  // 新しいムード
  let newMood: Supplier['currentMood']
  const newAffinity = supplier.affinity + affinityChange
  if (newAffinity >= 75) newMood = 'good'
  else if (newAffinity >= 50) newMood = 'neutral'
  else if (newAffinity >= 30) newMood = 'annoyed'
  else newMood = 'angry'

  // 応答テキスト
  const responses = getSupplierResponse(supplier, tone, success)

  return { success, affinityChange, newMood, response: responses }
}

function getSupplierResponse(supplier: Supplier, tone: NegotiationTone, success: boolean): string {
  const name = supplier.name
  if (success) {
    switch (tone) {
      case 'polite': return `${name}：「丁寧にお話しいただきありがとうございます。何とか対応させていただきます。」`
      case 'urgent': return `${name}：「急ぎですか...今回は特別に対応しますが、次回からはもう少し早めにお願いします。」`
      case 'negotiate': return `${name}：「その条件なら承知しました。お互いにとって良い形にしましょう。」`
      case 'grateful': return `${name}：「そう言っていただけると嬉しいですね。今回もお任せください！」`
    }
  } else {
    switch (tone) {
      case 'polite': return `${name}：「申し訳ありませんが、今回はちょっと厳しいです...」`
      case 'urgent': return `${name}：「急に言われても困ります。うちにも段取りがあるんですよ。」`
      case 'negotiate': return `${name}：「その条件ではちょっと...もう少し検討していただけませんか。」`
      case 'grateful': return `${name}：「お気持ちは嬉しいですが、今回は本当に無理なんです。すみません。」`
    }
  }
}

// --- 調達部・木村がサプライヤー候補を提案 ---
export function suggestSuppliers(
  suppliers: Supplier[],
  requiredParts: string[]
): SupplierId[] {
  // 必要部品を供給できるサプライヤーを抽出し、好感度順に2-3社提案
  const candidates = suppliers
    .filter(s => s.parts.some(p => requiredParts.some(rp => p.includes(rp) || rp.includes(p))))
    .sort((a, b) => b.affinity - a.affinity)
    .slice(0, 3)

  return candidates.map(s => s.id)
}

export function getSupplier(suppliers: Supplier[], id: SupplierId): Supplier | undefined {
  return suppliers.find(s => s.id === id)
}
