import type { GameEvent } from '../../shared/types.js'

// 時刻変換ユーティリティ (例: "08:30" → 510分)
function toMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

// MVPイベントカタログ（9件）
export const EVENT_CATALOG: GameEvent[] = [
  // E1: 朝一 — 製造職長 谷口 から設備アラーム報告（確定）
  {
    id: 'E1_equipment_alarm',
    triggerTime: toMinutes('08:00'),
    characterId: 'workshop',
    title: '組立ラインの設備アラーム',
    description:
      '朝礼直後、製造職長 谷口から連絡。「第2組立ラインの自動ねじ締め機がアラームを吐いてます。今日の製造指示MO-2024-089（搬送ユニット×3台）に影響が出るかもしれません。修理業者の手配か、手作業への切り替えか判断が必要です。」',
    severity: 'high',
    isProbabilistic: false,
    triggerProbability: 1.0,
    isChainEvent: false,
    choices: [
      {
        id: 'self_fix',
        label: '自分で修理業者を手配する',
        actionType: 'self',
        timeConsumption: 45,
        context: '修理業者に直接連絡し、今日中に来てもらえるか確認する。コストが発生するが確実。',
      },
      {
        id: 'dispatch_tanaka',
        label: '田中に業者手配を任せる',
        actionType: 'dispatch',
        dispatchTarget: 'subordinate1',
        timeConsumption: 15,
        context: '田中に修理業者への連絡と手配を任せる。',
      },
      {
        id: 'dispatch_sasaki',
        label: '佐々木に手作業切替の調整を任せる',
        actionType: 'dispatch',
        dispatchTarget: 'subordinate2',
        timeConsumption: 15,
        context: '佐々木に谷口職長と相談して手作業への切替ライン調整を任せる。',
      },
      {
        id: 'defer',
        label: '谷口に様子見させて保留にする',
        actionType: 'defer',
        timeConsumption: 5,
        context: '「少し様子を見て」と伝えて保留にする。リスクが蓄積する。',
      },
    ],
  },

  // E2: 08:30 — 調達担当 木村 から部品入荷遅れ警告（確率70%）
  {
    id: 'E2_parts_delay',
    triggerTime: toMinutes('08:30'),
    characterId: 'procurement',
    title: '重要部品の入荷遅れ警告',
    description:
      '調達担当 木村から連絡。「MO-2024-091に使うACサーボモーター（品番SV-3000）ですが、仕入先の大東電機から今朝連絡が来て、今日予定だった納入が明日以降になりそうです。フリー在庫は0台。このまま行くと14:00以降の組立工程が止まります。代替品手配か工程順序変更か検討が必要です。」',
    severity: 'high',
    isProbabilistic: true,
    triggerProbability: 0.7,
    isChainEvent: false,
    choices: [
      {
        id: 'self_alternative',
        label: '自分で代替仕入先を探す',
        actionType: 'self',
        timeConsumption: 60,
        context: '木村と一緒に代替仕入先を探す。確実だが時間がかかる。',
      },
      {
        id: 'dispatch_wood_change',
        label: '木村に代替手配を一任する',
        actionType: 'dispatch',
        dispatchTarget: 'procurement',
        timeConsumption: 10,
        context: '木村に代替仕入先の選定と発注を一任する。',
      },
      {
        id: 'reschedule',
        label: '工程順序を入れ替えて対応する',
        actionType: 'self',
        timeConsumption: 30,
        context: '谷口職長と相談してMO-2024-091を後回しにし、他の指示を先行させる。',
      },
      {
        id: 'defer_e2',
        label: 'まず状況確認だけして保留にする',
        actionType: 'defer',
        timeConsumption: 5,
        context: '「対処法を検討する」と言いながら後回しにする。',
      },
    ],
  },

  // E3: 09:00 — 営業主任 西村 から仕様変更依頼（確定）
  {
    id: 'E3_spec_change',
    triggerTime: toMinutes('09:00'),
    characterId: 'sales',
    title: '顧客からの仕様変更依頼',
    description:
      '営業主任 西村から連絡。「関東精機の関口さんから昨日電話があって、MO-2024-088の制御盤カラーをRAL7035（ライトグレー）からRAL9005（ジェットブラック）に変えてほしいと。あ、今日組立開始予定のやつです。「御社の対応範囲内ですよね？」って言われて、「はい大丈夫です」って答えちゃいました。あとはよろしくです。」',
    severity: 'critical',
    isProbabilistic: false,
    triggerProbability: 1.0,
    isChainEvent: false,
    choices: [
      {
        id: 'accept_change',
        label: '受け入れて現場に指示変更を出す',
        actionType: 'self',
        timeConsumption: 40,
        context: '仕様変更を受け入れ、資材発注変更と谷口職長への工程変更指示を出す。コストと時間がかかる。',
      },
      {
        id: 'negotiate_delay',
        label: '西村を通じて顧客に納期変更を交渉する',
        actionType: 'dispatch',
        dispatchTarget: 'sales',
        timeConsumption: 20,
        context: '仕様変更による工程影響を説明し、納期延期を顧客に認めてもらうよう西村に交渉させる。',
      },
      {
        id: 'dispatch_confirm',
        label: '田中に現場影響調査を任せる',
        actionType: 'dispatch',
        dispatchTarget: 'subordinate1',
        timeConsumption: 15,
        context: 'まず田中に現場の影響範囲を調べさせてから判断する。時間を少し稼ぐ。',
      },
      {
        id: 'reject_change',
        label: '仕様変更を断り現状仕様で進める',
        actionType: 'self',
        timeConsumption: 25,
        context: '「今の段階では工程変更は無理」と西村に伝え、顧客説得をさせる。顧客満足度に影響。',
      },
    ],
  },

  // E4: 10:30 — 連鎖イベント（E1/E2/E3の判断結果による）
  {
    id: 'E4_chain_crisis',
    triggerTime: toMinutes('10:30'),
    characterId: 'workshop',
    title: '複合問題が発生（連鎖）',
    description:
      '製造職長 谷口から緊急連絡。「松田さん、第2ラインはまだ直ってません。それに部品も届いてない。今の状態だと今日の出荷台数、半分も行けないかもしれません。どうしますか？」',
    severity: 'critical',
    isProbabilistic: false,
    triggerProbability: 1.0,
    isChainEvent: true,
    chainCondition: 'deferred',
    choices: [
      {
        id: 'emergency_response',
        label: '残業体制を組んで挽回する',
        actionType: 'self',
        timeConsumption: 30,
        context: '今日の残業を承認し、ライン最優先で挽回体制を組む。コストが上がる。',
      },
      {
        id: 'prioritize_orders',
        label: '出荷優先順位を組み直す',
        actionType: 'self',
        timeConsumption: 45,
        context: '出荷優先度を顧客重要度・納期順に並べ直す。一部案件は遅延を認める。',
      },
      {
        id: 'dispatch_sasaki_resolve',
        label: '佐々木に対応指揮を任せる',
        actionType: 'dispatch',
        dispatchTarget: 'subordinate2',
        timeConsumption: 10,
        context: '佐々木に現場対応の指揮を任せる。独断リスクあり。',
      },
      {
        id: 'defer_e4',
        label: 'まだ様子を見る',
        actionType: 'defer',
        timeConsumption: 5,
        context: '判断を先延ばしにする。状況は悪化し続ける。',
      },
    ],
  },

  // E5: 13:00 — 中間デッドライン判定（システム、確定）
  {
    id: 'E5_midday_deadline',
    triggerTime: toMinutes('13:00'),
    characterId: 'system',
    title: '中間デッドライン判定',
    description:
      '【システム通知】13:00 中間デッドライン。今日の出荷計画に対する午前の進捗を確認します。現在のMRP実績を評価します。',
    severity: 'medium',
    isProbabilistic: false,
    triggerProbability: 1.0,
    isChainEvent: false,
    choices: [
      {
        id: 'check_status',
        label: '進捗を確認して午後の計画を立て直す',
        actionType: 'self',
        timeConsumption: 20,
        context: '現在の進捗を確認し、午後の対応方針を整理する。',
      },
      {
        id: 'emergency_meeting',
        label: '関係者を集めて緊急ミーティングを開く',
        actionType: 'self',
        timeConsumption: 30,
        context: '谷口職長・木村を呼んで今後の方針を共有する。時間はかかるが情報共有効果あり。',
      },
    ],
  },

  // E6: 14:00 — 外注先社長 坂本 から外注品の品質問題（確率50%）
  {
    id: 'E6_quality_issue',
    triggerTime: toMinutes('14:00'),
    characterId: 'subcontractor',
    title: '外注品の品質問題発覚',
    description:
      '外注先社長 坂本から電話。「松田さん、今朝お届けした溶接フレーム10台ですが、うち2台に溶接ビードの寸法不良が見つかりまして。私どもの確認ミスでした。交換品は今週末に対応できますが、今日使う分は…うちのことも考えてくださいよ、でも可能な限り対処します。」品証担当 長谷川への確認と、今後の対応判断が必要。',
    severity: 'high',
    isProbabilistic: true,
    triggerProbability: 0.5,
    isChainEvent: false,
    choices: [
      {
        id: 'accept_partial',
        label: '良品8台で工程を続行し、不良2台は後日対応',
        actionType: 'self',
        timeConsumption: 25,
        context: '今日使える8台で工程を進め、不良品は坂本に交換してもらう。品質記録が残る。',
      },
      {
        id: 'urgent_replacement',
        label: '坂本に今日中の交換品を強く要求する',
        actionType: 'self',
        timeConsumption: 30,
        context: '今日中に交換品を持ってくるよう強く要求する。関係値への影響あり。',
      },
      {
        id: 'dispatch_tanaka_qa',
        label: '田中に品証担当 長谷川への確認を任せる',
        actionType: 'dispatch',
        dispatchTarget: 'subordinate1',
        timeConsumption: 10,
        context: '田中を通じて品証担当 長谷川に今日の対応可否を確認させる。',
      },
      {
        id: 'defer_e6',
        label: '品証に回して今日は様子を見る',
        actionType: 'defer',
        timeConsumption: 5,
        context: '品証担当 長谷川に任せて判断を先送りする。',
      },
    ],
  },

  // E7: 15:30 — 製造部長 橋本 からコスト・残業プレッシャー（確率30%）
  {
    id: 'E7_cost_pressure',
    triggerTime: toMinutes('15:30'),
    characterId: 'dept_manager',
    title: 'コスト超過・残業費プレッシャー',
    description:
      '製造部長 橋本が突然席に来た。「松田くん、今月の残業費と外注費なんだけど、すでに月予算の80%を使い切ってるって経理から言われた。で、コストへの影響は？今日の進捗はどうなってるの？」',
    severity: 'high',
    isProbabilistic: true,
    triggerProbability: 0.3,
    isChainEvent: false,
    choices: [
      {
        id: 'report_honestly',
        label: '現状を正直に報告して理解を求める',
        actionType: 'self',
        timeConsumption: 20,
        context: '現在の状況を正直に説明し、対策案とセットで報告する。',
      },
      {
        id: 'minimize_overtime',
        label: '残業を最小化する方針に切り替える',
        actionType: 'self',
        timeConsumption: 15,
        context: '残業を最小限にする方針を即決して橋本に報告。一部出荷が翌日以降にずれる可能性。',
      },
      {
        id: 'delay_answer',
        label: '「確認して折り返します」と言って時間を稼ぐ',
        actionType: 'defer',
        timeConsumption: 5,
        context: '即答を避けてデータを整理してから報告する。',
      },
    ],
  },

  // E8: 16:30 — 最終デッドライン判定（システム、確定）
  {
    id: 'E8_final_deadline',
    triggerTime: toMinutes('16:30'),
    characterId: 'system',
    title: '最終デッドライン判定',
    description:
      '【システム通知】16:30 最終デッドライン。今日の出荷予定案件の最終確認。未解決案件の締切です。今日中に完了できないものは遅延確定となります。',
    severity: 'critical',
    isProbabilistic: false,
    triggerProbability: 1.0,
    isChainEvent: false,
    choices: [
      {
        id: 'finalize_shipping',
        label: '完了した案件を出荷確定させる',
        actionType: 'self',
        timeConsumption: 15,
        context: '今日完了した案件を確定させ、未完了は翌日繰越の記録をつける。',
      },
      {
        id: 'all_hands',
        label: '全員残業で最後の追い込みをかける',
        actionType: 'self',
        timeConsumption: 20,
        context: '全員に残業指示を出して最大限の台数を今日中に完成させる。コスト増加。',
      },
    ],
  },

  // E9: ランダム — 工場長 村上 の登場（重大局面、確率5%）
  {
    id: 'E9_factory_manager',
    triggerTime: toMinutes('14:30'),
    characterId: 'factory_manager',
    title: '工場長 村上 が現れた',
    description:
      '工場長 村上が生産管理エリアに突然現れた。「松田くん、今日の状況を聞いた。言い訳はいい、どうするんだ。」重大な局面であることを工場全体が感じている。',
    severity: 'critical',
    isProbabilistic: true,
    triggerProbability: 0.05,
    isChainEvent: false,
    choices: [
      {
        id: 'show_plan',
        label: '対策計画を説明して信頼を得る',
        actionType: 'self',
        timeConsumption: 15,
        context: '現状と具体的な回復プランを説明する。工場長の信頼を得られれば強力なサポートが得られる。',
      },
      {
        id: 'request_support',
        label: '工場長にリソース支援を要請する',
        actionType: 'self',
        timeConsumption: 10,
        context: '現場増員や設備優先使用の権限を工場長に直接要請する。',
      },
    ],
  },
]

// トリガー時刻でイベントをスケジュール（確率判定込み）
export function scheduleEvents(): GameEvent[] {
  return EVENT_CATALOG.filter((event) => {
    if (!event.isProbabilistic) return true
    return Math.random() < event.triggerProbability
  }).sort((a, b) => a.triggerTime - b.triggerTime)
}
