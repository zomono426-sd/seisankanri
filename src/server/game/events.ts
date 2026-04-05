import type { GameEvent } from '../../shared/types.js'

// ============================================================
// 週次イベントプール（カテゴリ別）
// 各週の開始時にプールからランダムに選択・日ごとに配置
// ============================================================

// --- 営業系イベント ---
const SALES_EVENTS: GameEvent[] = [
  {
    id: 'S1_rush_order',
    category: 'sales',
    characterId: 'sales',
    title: '特急注文の飛び込み',
    description: '営業主任 西村から連絡。「大口顧客の関東精機から特急注文が入りました。今週中に搬送ユニット3台追加できないかって。"御社なら対応してくれると思って"だそうです。あとはよろしくです。」',
    severity: 'high',
    triggerDay: 1,
    triggerProbability: 0.7,
    affectedDepartment: 'sales',
    choices: [
      { id: 'accept_rush', label: '受注して製造計画を組み直す', actionType: 'self', timeCost: 'half_day', context: '現場に追加負荷がかかるが、顧客満足度UP。コスト管理に影響。' },
      { id: 'negotiate_deadline', label: '西村に納期交渉を指示する', actionType: 'dispatch', dispatchTarget: 'sales', timeCost: 'none', context: '来週納品で交渉させる。顧客満足度が少し下がるかも。' },
      { id: 'reject_rush', label: '今週は対応不可と断る', actionType: 'self', timeCost: 'none', context: 'キャパオーバーを理由に断る。顧客満足度に大きく影響。' },
    ],
  },
  {
    id: 'S2_spec_change',
    category: 'sales',
    characterId: 'sales',
    title: '仕様変更依頼',
    description: '営業主任 西村から連絡。「関東精機の関口さんから、制御盤の仕様を変えてほしいと。塗装色変更と配線ルート変更です。"できますよね？"って答えちゃいました。」',
    severity: 'critical',
    triggerDay: 2,
    triggerProbability: 0.8,
    affectedDepartment: 'sales',
    choices: [
      { id: 'accept_spec', label: '受け入れて現場に指示変更を出す', actionType: 'self', timeCost: 'half_day', context: '仕様変更を受け入れ、資材発注変更と工程変更指示。コストと時間がかかる。' },
      { id: 'investigate_spec', label: 'AI影響調査を実施する', actionType: 'investigate', timeCost: 'half_day', context: 'AIエージェントに影響範囲を分析させてから判断。' },
      { id: 'delegate_confirm', label: '田中に現場影響調査を任せる', actionType: 'dispatch', dispatchTarget: 'subordinate1', timeCost: 'none', context: '田中に影響範囲を調べさせて時間を稼ぐ。' },
      { id: 'reject_spec', label: '仕様変更を断る', actionType: 'self', timeCost: 'none', context: '工程上無理と伝える。顧客満足度に大きく影響。' },
    ],
  },
  {
    id: 'S3_customer_complaint',
    category: 'sales',
    characterId: 'sales',
    title: '顧客クレーム対応',
    description: '営業主任 西村が青い顔で来た。「先週出荷した搬送ユニット、お客様から"動作が不安定"ってクレームが来ました。至急対応しないと取引に影響しそうです。」',
    severity: 'critical',
    triggerDay: 3,
    triggerProbability: 0.5,
    affectedDepartment: 'sales',
    choices: [
      { id: 'self_handle_complaint', label: '自分で顧客対応を主導する', actionType: 'self', timeCost: 'full_day', context: '直接対応で信頼回復。ただし1日潰れる。' },
      { id: 'dispatch_sasaki_complaint', label: '佐々木に現地調査を任せる', actionType: 'dispatch', dispatchTarget: 'subordinate2', timeCost: 'none', context: '佐々木の経験を活かす。独自判断のリスクあり。' },
      { id: 'defer_complaint', label: '来週対応に回す', actionType: 'defer', timeCost: 'none', context: '先送り。顧客満足度が大きく下がる。' },
    ],
  },
  {
    id: 'S4_new_inquiry',
    category: 'sales',
    characterId: 'sales',
    title: '大型案件の引き合い',
    description: '営業主任 西村が嬉しそうに来た。「新規顧客から大型案件の引き合いが来ました！来月から月20台ペースで。今週中に生産能力の回答が必要です。」',
    severity: 'medium',
    triggerDay: 4,
    triggerProbability: 0.4,
    affectedDepartment: 'sales',
    choices: [
      { id: 'capacity_study', label: '生産能力を精査して回答する', actionType: 'self', timeCost: 'half_day', context: '現実的な能力を計算して回答。信頼性が高い。' },
      { id: 'optimistic_reply', label: '前向きに受注する方向で回答', actionType: 'self', timeCost: 'none', context: '営業を喜ばせるが、実現可能性にリスク。' },
      { id: 'defer_inquiry', label: '来週回答すると伝える', actionType: 'defer', timeCost: 'none', context: '判断を先送り。機会損失の可能性。' },
    ],
  },
]

// --- 調達系イベント ---
const PROCUREMENT_EVENTS: GameEvent[] = [
  {
    id: 'P1_parts_delay',
    category: 'procurement',
    characterId: 'procurement',
    title: '重要部品の入荷遅延',
    description: '調達担当 木村から連絡。「ACサーボモーターの入荷が遅れそうです。大東電機から今朝連絡があり、今週予定の納入が来週にずれるとのこと。フリー在庫は0台。対策が必要です。」',
    severity: 'high',
    triggerDay: 1,
    triggerProbability: 0.7,
    affectedDepartment: 'procurement',
    requiresSupplierNegotiation: true,
    choices: [
      { id: 'find_alternative', label: '代替サプライヤーを探す', actionType: 'self', timeCost: 'half_day', context: '木村と一緒に代替を探す。サプライヤー交渉が発生。' },
      { id: 'delegate_procurement', label: '木村に代替手配を一任する', actionType: 'dispatch', dispatchTarget: 'procurement', timeCost: 'none', context: '木村の判断に任せる。' },
      { id: 'reschedule_production', label: '工程順序を入れ替えて対応', actionType: 'self', timeCost: 'half_day', context: '部品が届くまで他の案件を先に進める。' },
      { id: 'defer_delay', label: '状況を見守る', actionType: 'defer', timeCost: 'none', context: '先送り。リスクが蓄積する。' },
    ],
  },
  {
    id: 'P2_price_increase',
    category: 'procurement',
    characterId: 'procurement',
    title: '部品価格の値上げ通知',
    description: '調達担当 木村が渋い顔で報告。「三河精密から来月以降の精密部品が15%値上げになると通知が来ました。今週中に継続か切替かの方針を決めたいのですが。」',
    severity: 'medium',
    triggerDay: 3,
    triggerProbability: 0.5,
    affectedDepartment: 'procurement',
    requiresSupplierNegotiation: true,
    choices: [
      { id: 'negotiate_price', label: 'サプライヤーと価格交渉する', actionType: 'self', timeCost: 'half_day', context: '三河精密と交渉。好感度が影響。' },
      { id: 'find_cheaper', label: '代替サプライヤーを検討する', actionType: 'self', timeCost: 'half_day', context: '丸山金属等、他社に切替検討。品質リスクあり。' },
      { id: 'accept_increase', label: '値上げを受け入れる', actionType: 'self', timeCost: 'none', context: 'コスト管理に影響するが関係維持。' },
    ],
  },
  {
    id: 'P3_quality_issue',
    category: 'procurement',
    characterId: 'procurement',
    title: '外注品の品質不良',
    description: '調達担当 木村から緊急連絡。「坂本製作所から納品された溶接フレーム10台のうち3台に寸法不良が見つかりました。坂本さんは"交換品は週末には出せる"と言っていますが、今週の生産に穴が開きます。」',
    severity: 'high',
    triggerDay: 2,
    triggerProbability: 0.6,
    affectedDepartment: 'procurement',
    requiresSupplierNegotiation: true,
    choices: [
      { id: 'accept_partial', label: '良品7台で進め、不良は後日交換', actionType: 'self', timeCost: 'none', context: '使える分で工程を進める。納期影響あり。' },
      { id: 'demand_urgent', label: '坂本に緊急交換を依頼する', actionType: 'self', timeCost: 'half_day', context: 'サプライヤー交渉。好感度に影響。' },
      { id: 'delegate_qa', label: '田中に品質確認を任せる', actionType: 'dispatch', dispatchTarget: 'subordinate1', timeCost: 'none', context: '品証と連携して対応。' },
    ],
  },
]

// --- 製造系イベント ---
const MANUFACTURING_EVENTS: GameEvent[] = [
  {
    id: 'M1_line_trouble',
    category: 'manufacturing',
    characterId: 'workshop',
    title: '組立ラインの不具合',
    description: '製造職長 谷口から連絡。「第2組立ラインの自動ねじ締め機がおかしいです。完全に止まってはいませんが、精度が落ちてます。このまま続けると品質リスクがあります。」',
    severity: 'high',
    triggerDay: 1,
    triggerProbability: 0.6,
    affectedDepartment: 'manufacturing',
    choices: [
      { id: 'stop_and_fix', label: 'ラインを止めて修理する', actionType: 'self', timeCost: 'half_day', context: '確実に直るが生産が止まる。' },
      { id: 'manual_switch', label: '手作業に切り替えて継続', actionType: 'self', timeCost: 'none', context: '生産は続くが速度低下。現場信頼度に影響。' },
      { id: 'delegate_workshop', label: '谷口に判断を任せる', actionType: 'dispatch', dispatchTarget: 'workshop', timeCost: 'none', context: '現場のプロに任せる。信頼関係が影響。' },
      { id: 'defer_trouble', label: '様子を見る', actionType: 'defer', timeCost: 'none', context: '先送り。品質リスクが蓄積。' },
    ],
  },
  {
    id: 'M2_bottleneck',
    category: 'manufacturing',
    characterId: 'workshop',
    title: '工程ボトルネック発生',
    description: '製造職長 谷口が報告。「溶接工程がボトルネックになってます。下流の組立が待ち状態です。人員を増やすか、優先順位を変えるか判断が必要です。」',
    severity: 'medium',
    triggerDay: 3,
    triggerProbability: 0.7,
    affectedDepartment: 'manufacturing',
    choices: [
      { id: 'add_workers', label: '他ラインから人員を移動する', actionType: 'self', timeCost: 'half_day', context: '溶接工程を加速するが、他ラインの能力が落ちる。' },
      { id: 'reprioritize', label: '生産優先順位を組み直す', actionType: 'self', timeCost: 'half_day', context: '全体最適を目指して再計画。' },
      { id: 'overtime', label: '溶接工程に残業を指示する', actionType: 'self', timeCost: 'none', context: 'コスト増加だが生産維持。現場の疲労蓄積。' },
    ],
  },
  {
    id: 'M3_quality_escape',
    category: 'manufacturing',
    characterId: 'workshop',
    title: '品質問題の発覚',
    description: '製造職長 谷口が深刻な顔で来た。「朝の検査で、昨日組み立てた搬送ユニット2台にトルク不良が見つかりました。出荷前に見つかってよかったですが、手直しが必要です。」',
    severity: 'high',
    triggerDay: 4,
    triggerProbability: 0.5,
    affectedDepartment: 'manufacturing',
    choices: [
      { id: 'rework_priority', label: '最優先で手直しする', actionType: 'self', timeCost: 'half_day', context: '品質を確保するが他の生産が遅れる。' },
      { id: 'delegate_rework', label: '佐々木に手直し監督を任せる', actionType: 'dispatch', dispatchTarget: 'subordinate2', timeCost: 'none', context: '佐々木の経験を活用。' },
      { id: 'defer_rework', label: '今週末にまとめて手直しする', actionType: 'defer', timeCost: 'none', context: '先送り。出荷遅延リスク。' },
    ],
  },
]

// --- 能力系イベント（設備故障・人員欠勤） ---
const CAPACITY_EVENTS: GameEvent[] = [
  {
    id: 'C1_equipment_breakdown',
    category: 'capacity',
    characterId: 'workshop',
    title: '設備故障 — 溶接機停止',
    description: '製造職長 谷口から緊急連絡。「溶接ラインのスポット溶接機が故障しました。修理業者は最短で明日来れるそうです。今日の溶接工程は止まります。」',
    severity: 'critical',
    triggerDay: 2,
    triggerProbability: 0.4,
    affectedDepartment: 'manufacturing',
    choices: [
      { id: 'call_repair', label: '修理業者を緊急手配する', actionType: 'self', timeCost: 'half_day', context: '追加コストで当日中に修理を試みる。' },
      { id: 'manual_weld', label: '手溶接で代替する', actionType: 'self', timeCost: 'none', context: '生産速度は半減するが止まらない。品質管理が必要。' },
      { id: 'reassign_work', label: '他のラインの作業を前倒しする', actionType: 'self', timeCost: 'half_day', context: '溶接が復旧するまで他の作業で時間を稼ぐ。' },
    ],
  },
  {
    id: 'C2_worker_absence',
    category: 'capacity',
    characterId: 'workshop',
    title: '作業者の突発欠勤',
    description: '製造職長 谷口から朝一の連絡。「今日、第1組立ラインの熟練工が2名インフルエンザで休みです。ライン能力が30%下がります。配置転換か工程調整が必要です。」',
    severity: 'high',
    triggerDay: 1,
    triggerProbability: 0.5,
    affectedDepartment: 'manufacturing',
    choices: [
      { id: 'reassign_workers', label: '他ラインから応援を入れる', actionType: 'self', timeCost: 'half_day', context: '第1ラインを維持するが他ラインが弱くなる。' },
      { id: 'reduce_plan', label: '今日の生産計画を縮小する', actionType: 'self', timeCost: 'none', context: '無理をしない。納期に影響する可能性。' },
      { id: 'overtime_others', label: '残りの作業者に残業を依頼する', actionType: 'self', timeCost: 'none', context: 'コスト増加。現場の疲労。' },
    ],
  },
  {
    id: 'C3_overtime_limit',
    category: 'capacity',
    characterId: 'dept_manager',
    title: '残業制限の通達',
    description: '製造部長 橋本から通達。「今月の残業時間が上限に近づいている。今週以降の残業は原則禁止だ。で、コストへの影響は？」',
    severity: 'medium',
    triggerDay: 3,
    triggerProbability: 0.4,
    affectedDepartment: 'manufacturing',
    choices: [
      { id: 'accept_limit', label: '残業制限を受け入れて計画調整', actionType: 'self', timeCost: 'half_day', context: 'コスト管理改善。納期に影響する可能性。' },
      { id: 'request_exception', label: '例外申請を出す', actionType: 'self', timeCost: 'half_day', context: '部長との関係に影響。認められれば残業継続。' },
      { id: 'efficiency_up', label: '作業効率改善で対応する', actionType: 'self', timeCost: 'full_day', context: '根本対策だが時間がかかる。' },
    ],
  },
  {
    id: 'C4_maintenance_due',
    category: 'capacity',
    characterId: 'workshop',
    title: '定期メンテナンス時期',
    description: '製造職長 谷口から相談。「第1組立ラインの定期メンテナンスが今週予定です。1日止めないといけないんですが、今週の生産計画を考えるとタイミングが悩ましい。」',
    severity: 'medium',
    triggerDay: 1,
    triggerProbability: 0.6,
    affectedDepartment: 'manufacturing',
    choices: [
      { id: 'do_maintenance', label: '予定通りメンテナンスを実施', actionType: 'self', timeCost: 'full_day', context: '1日生産が止まるが設備の信頼性維持。' },
      { id: 'postpone_maintenance', label: '来週に延期する', actionType: 'self', timeCost: 'none', context: '今週の生産は維持。故障リスクが上がる。' },
      { id: 'partial_maintenance', label: '半日で簡易メンテのみ実施', actionType: 'self', timeCost: 'half_day', context: '妥協案。設備リスクは少し残る。' },
    ],
  },
]

// --- 工場長指令イベント（週の頭に1つ発生） ---
const DIRECTOR_EVENTS: GameEvent[] = [
  {
    id: 'D1_cost_reduction',
    category: 'director',
    characterId: 'factory_director',
    title: '工場長指令：コスト削減',
    description: '工場長 村上が全体朝礼で宣言。「今週はコスト管理を徹底しろ。残業は最小限、外注費も抑えろ。言い訳はいい、数字で見せてくれ。」',
    severity: 'critical',
    triggerDay: 1,
    triggerProbability: 1.0,
    affectedDepartment: 'manufacturing',
    choices: [
      { id: 'acknowledge_cost', label: '了解しました（指令を受領）', actionType: 'self', timeCost: 'none', context: '工場長の指令は拒否できない。今週はコスト管理を最優先に。' },
    ],
  },
  {
    id: 'D2_delivery_push',
    category: 'director',
    characterId: 'factory_director',
    title: '工場長指令：納期厳守',
    description: '工場長 村上が生産管理に来た。「今週の出荷は1台も遅らせるな。客先から催促が来てる。どうするんだ、松田くん。」',
    severity: 'critical',
    triggerDay: 1,
    triggerProbability: 1.0,
    affectedDepartment: 'manufacturing',
    choices: [
      { id: 'acknowledge_delivery', label: '了解しました（指令を受領）', actionType: 'self', timeCost: 'none', context: '工場長の指令は拒否できない。今週は納期達成を最優先に。' },
    ],
  },
  {
    id: 'D3_quality_focus',
    category: 'director',
    characterId: 'factory_director',
    title: '工場長指令：品質強化',
    description: '工場長 村上が厳しい表情で指示。「先月のクレーム件数が多すぎる。今週は品質検査を倍にしろ。不良品は絶対に出すな。」',
    severity: 'critical',
    triggerDay: 1,
    triggerProbability: 1.0,
    affectedDepartment: 'manufacturing',
    choices: [
      { id: 'acknowledge_quality', label: '了解しました（指令を受領）', actionType: 'self', timeCost: 'none', context: '工場長の指令は拒否できない。今週は品質最優先。現場信頼度に影響。' },
    ],
  },
  {
    id: 'D4_capacity_increase',
    category: 'director',
    characterId: 'factory_director',
    title: '工場長指令：増産体制',
    description: '工場長 村上が朝礼で宣言。「来月の大型案件に向けて、今週から増産体制に入る。ライン稼働率を上げろ。言い訳はいい、やるんだ。」',
    severity: 'critical',
    triggerDay: 1,
    triggerProbability: 1.0,
    affectedDepartment: 'manufacturing',
    choices: [
      { id: 'acknowledge_increase', label: '了解しました（指令を受領）', actionType: 'self', timeCost: 'none', context: '工場長の指令は拒否できない。今週は生産量最大化。' },
    ],
  },
]

// --- 全イベントカタログ ---
export const ALL_EVENTS = {
  sales: SALES_EVENTS,
  procurement: PROCUREMENT_EVENTS,
  manufacturing: MANUFACTURING_EVENTS,
  capacity: CAPACITY_EVENTS,
  director: DIRECTOR_EVENTS,
}

// 週のイベントをスケジュールする
export function scheduleWeeklyEvents(weekNumber: number): GameEvent[] {
  const events: GameEvent[] = []

  // 工場長指令を1つ選択（週ごとにローテーション）
  const directorIdx = (weekNumber - 1) % DIRECTOR_EVENTS.length
  events.push({ ...DIRECTOR_EVENTS[directorIdx], triggerDay: 1 })

  // 各カテゴリからランダムにイベントを選択
  const categories = ['sales', 'procurement', 'manufacturing', 'capacity'] as const
  for (const cat of categories) {
    const pool = ALL_EVENTS[cat]
    // 各カテゴリから2-3件をランダム選択（確率判定付き）
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    for (const event of shuffled) {
      if (Math.random() < event.triggerProbability) {
        // 日を再割り当て（週全体にばらけさせる）
        const day = Math.floor(Math.random() * 5) + 1
        events.push({ ...event, triggerDay: day })
      }
    }
  }

  // 日ごとにソート
  return events.sort((a, b) => a.triggerDay - b.triggerDay)
}

// 特定の日のイベントを取得
export function getEventsForDay(events: GameEvent[], day: number): GameEvent[] {
  return events.filter(e => e.triggerDay === day)
}
