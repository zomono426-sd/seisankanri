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

// --- 在庫系イベント（受注組立生産・見込み生産・原料調達） ---
const INVENTORY_EVENTS: GameEvent[] = [
  // === 製品系（受注組立リードタイム関連） ===
  {
    id: 'INV1_lead_time_overrun',
    category: 'inventory',
    characterId: 'workshop',
    title: '受注品の生産リードタイム超過',
    description: '製造職長 谷口から連絡。「搬送コンベアの受注組立ですが、予想以上に時間がかかってます。サーボ駆動サブアセンブリの取り付け精度が出なくて、手直しが増えてます。このままだと納期に間に合いません。」',
    severity: 'high',
    triggerDay: 2,
    triggerProbability: 0.6,
    affectedDepartment: 'manufacturing',
    choices: [
      { id: 'overtime_production', label: '残業で対応して納期を守る', actionType: 'self', timeCost: 'half_day', context: 'コスト増加だが納期は維持できる。現場の負担が増える。' },
      { id: 'transfer_workers', label: '他ラインから応援を入れる', actionType: 'self', timeCost: 'half_day', context: '当該ラインは加速するが、他ラインの能力が落ちる。' },
      { id: 'negotiate_delivery', label: '西村に納期延長を顧客と相談させる', actionType: 'dispatch', dispatchTarget: 'sales', timeCost: 'none', context: '納期を延ばせれば余裕ができるが、顧客満足度に影響。' },
    ],
  },
  {
    id: 'INV2_custom_spec',
    category: 'inventory',
    characterId: 'sales',
    title: '受注仕様の特殊対応',
    description: '営業主任 西村から連絡。「東海電装の田村さんから、サーボ駆動ユニットの制御プログラムをカスタム仕様にしてほしいとの依頼です。標準工程じゃ対応できないので、特殊工程を追加する必要があります。」',
    severity: 'medium',
    triggerDay: 3,
    triggerProbability: 0.5,
    affectedDepartment: 'manufacturing',
    choices: [
      { id: 'add_special_process', label: '特殊工程を追加して対応する', actionType: 'self', timeCost: 'full_day', context: 'コストは大幅増だが顧客の期待に応える。1日かかる。' },
      { id: 'propose_standard', label: '標準仕様で代替提案するよう西村に指示', actionType: 'dispatch', dispatchTarget: 'sales', timeCost: 'none', context: '顧客の反応次第。満足度に影響する可能性。' },
      { id: 'delegate_design', label: '田中に工程設計を任せる', actionType: 'dispatch', dispatchTarget: 'subordinate1', timeCost: 'none', context: '田中の経験で対応可能か。結果は能力次第。' },
    ],
  },
  // === 中間品系（見込み生産・計画関連） ===
  {
    id: 'INV3_safety_stock_breach',
    category: 'inventory',
    characterId: 'procurement',
    title: '中間品の安全在庫割れ',
    description: '調達担当 木村から緊急連絡。「サーボ駆動サブアセンブリの在庫が安全在庫を下回りました。現在の在庫数は2台で、安全在庫は3台です。今週の受注組立に支障が出ます。緊急増産か、計画前倒しが必要です。」',
    severity: 'high',
    triggerDay: 1,
    triggerProbability: 0.6,
    affectedDepartment: 'manufacturing',
    choices: [
      { id: 'emergency_production', label: '緊急増産を指示する', actionType: 'self', timeCost: 'half_day', context: '他の生産を止めて中間品を増産。コスト増、現場負担増。' },
      { id: 'accelerate_plan', label: '週次計画を前倒しする', actionType: 'self', timeCost: 'half_day', context: '計画を変更して早期に補充。他の計画に影響。' },
      { id: 'defer_safety', label: '当面は在庫なしで受注対応する', actionType: 'defer', timeCost: 'none', context: '先送り。受注組立のリードタイムが伸びるリスク。' },
    ],
  },
  {
    id: 'INV4_weekly_plan_review',
    category: 'inventory',
    characterId: 'dept_manager',
    title: '週次生産計画の見直し要求',
    description: '製造部長 橋本から指摘。「中間品の週次計画と実績に乖離が出ている。サーボ駆動サブアセンブリは計画の70%しか生産できていない。制御ユニットは逆に120%で過剰だ。計画を見直せ、松田くん。」',
    severity: 'medium',
    triggerDay: 1,
    triggerProbability: 0.7,
    affectedDepartment: 'manufacturing',
    choices: [
      { id: 'replan_self', label: '自分で計画を再策定する', actionType: 'self', timeCost: 'half_day', context: '全体を見渡して精度の高い計画を立てる。半日かかる。' },
      { id: 'delegate_replan', label: '佐々木に計画修正を任せる', actionType: 'dispatch', dispatchTarget: 'subordinate2', timeCost: 'none', context: '佐々木の能力に委ねる。精度は能力次第。' },
      { id: 'keep_plan', label: '現行計画で続行する', actionType: 'self', timeCost: 'none', context: '手間は省けるが在庫過多/不足のリスクが続く。' },
    ],
  },
  {
    id: 'INV5_excess_inventory',
    category: 'inventory',
    characterId: 'dept_manager',
    title: '中間品の過剰在庫警告',
    description: '製造部長 橋本から指摘。「溶接フレーム Type-Aの在庫が基準の2倍を超えている。保管スペースも圧迫してるし、保管コストが月10万増だ。見込み生産のペース見直しが必要じゃないか？」',
    severity: 'medium',
    triggerDay: 4,
    triggerProbability: 0.5,
    affectedDepartment: 'manufacturing',
    choices: [
      { id: 'slow_production', label: '中間品の生産ペースを落とす', actionType: 'self', timeCost: 'none', context: 'コスト改善だが、急な受注増に対応できなくなるリスク。' },
      { id: 'push_sales', label: '営業に販売促進を依頼する', actionType: 'dispatch', dispatchTarget: 'sales', timeCost: 'none', context: '在庫消化を促進。営業の負荷が増える。' },
      { id: 'defer_excess', label: '来週の計画で調整する', actionType: 'defer', timeCost: 'none', context: '先送り。保管コストが継続して発生。' },
    ],
  },
  // === 原料系（サプライヤー納入関連） ===
  {
    id: 'INV6_material_delay',
    category: 'inventory',
    characterId: 'procurement',
    title: '原料の納入日遅延',
    description: '調達担当 木村から連絡。「大東電機から連絡がありまして、ACサーボモーターの納入が2日遅れる見込みです。設備トラブルで生産が止まったそうです。フリー在庫が2台しかないので、今週後半の受注組立に影響が出ます。」',
    severity: 'high',
    triggerDay: 2,
    triggerProbability: 0.7,
    affectedDepartment: 'procurement',
    requiresSupplierNegotiation: true,
    choices: [
      { id: 'urgent_delivery', label: 'サプライヤーに緊急納入を依頼する', actionType: 'self', timeCost: 'half_day', context: '大東電機と交渉。追加コストが発生する可能性。' },
      { id: 'use_alternative', label: '代替部品で暫定対応する', actionType: 'self', timeCost: 'half_day', context: '別のサプライヤーから類似品を調達。品質差のリスク。' },
      { id: 'wait_resequence', label: '工程順序を変更して待つ', actionType: 'self', timeCost: 'none', context: 'サーボ不要の工程を先に進める。一部生産は停止。' },
    ],
  },
  {
    id: 'INV7_incoming_rejection',
    category: 'inventory',
    characterId: 'procurement',
    title: '原料の受入検査不合格',
    description: '調達担当 木村から緊急連絡。「三河精密から納品されたメイン制御基板10枚のうち4枚にはんだ不良が見つかりました。受入検査で弾きましたが、今週必要な分が足りません。三河精密にはもう連絡済みですが、交換品は最短3日後です。」',
    severity: 'high',
    triggerDay: 3,
    triggerProbability: 0.5,
    affectedDepartment: 'procurement',
    requiresSupplierNegotiation: true,
    choices: [
      { id: 'demand_replacement', label: 'サプライヤーに即時交換を要求する', actionType: 'self', timeCost: 'half_day', context: '三河精密と交渉。好感度に影響するが、品質維持。' },
      { id: 'sort_and_use', label: '選別して使える分で生産を進める', actionType: 'self', timeCost: 'half_day', context: '6枚で進める。納期は一部遅れるが生産継続。品質リスク。' },
      { id: 'delegate_analysis', label: '田中に品質データの分析を任せる', actionType: 'dispatch', dispatchTarget: 'subordinate1', timeCost: 'none', context: '不良原因を特定して再発防止。当面の生産は遅れる。' },
    ],
  },
  {
    id: 'INV8_raw_safety_alert',
    category: 'inventory',
    characterId: 'system',
    title: '原料の安全在庫アラート',
    description: '【システム通知】搬送ベルト 200mm（BELT-200）の在庫が安全在庫水準に接近しています。現在のフリー在庫: 6本、安全在庫: 5本。次回納入予定は来週です。今週の消費ペースでは安全在庫を割る可能性があります。',
    severity: 'medium',
    triggerDay: 3,
    triggerProbability: 0.6,
    affectedDepartment: 'procurement',
    choices: [
      { id: 'order_urgent', label: '木村に緊急発注を指示する', actionType: 'dispatch', dispatchTarget: 'procurement', timeCost: 'none', context: '追加コストだが安全在庫を維持できる。' },
      { id: 'increase_next_order', label: '次回発注量を増やして補充する', actionType: 'self', timeCost: 'none', context: '次回納入で補充。それまでは綱渡り。' },
      { id: 'run_lean', label: '在庫を切り詰めて運用する', actionType: 'self', timeCost: 'none', context: 'コスト最小だが、原料欠品リスクが高まる。' },
    ],
  },
]

// --- 全イベントカタログ ---
export const ALL_EVENTS = {
  sales: SALES_EVENTS,
  procurement: PROCUREMENT_EVENTS,
  manufacturing: MANUFACTURING_EVENTS,
  capacity: CAPACITY_EVENTS,
  inventory: INVENTORY_EVENTS,
  director: DIRECTOR_EVENTS,
}

// 週のイベントをスケジュールする
export function scheduleWeeklyEvents(weekNumber: number): GameEvent[] {
  const events: GameEvent[] = []

  // 工場長指令を1つ選択（週ごとにローテーション）
  const directorIdx = (weekNumber - 1) % DIRECTOR_EVENTS.length
  events.push({ ...DIRECTOR_EVENTS[directorIdx], triggerDay: 1 })

  // 各カテゴリからランダムにイベントを選択
  const categories = ['sales', 'procurement', 'manufacturing', 'capacity', 'inventory'] as const
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
