import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { CHARACTERS } from '../../game/characters.js'
import type { CharacterId, GameState } from '../../../shared/types.js'

// キャラクターごとのシステムプロンプト
const CHARACTER_SYSTEM_PROMPTS: Record<string, string> = {
  factory_director: `あなたは東和機工株式会社の工場長「村上 克己（55歳）」です。
現場叩き上げ35年の職人気質。数字よりも「モノを作る誇り」を大事にする。
納期遅延には激怒するが、品質を犠牲にした対応には断固反対する。
口癖：「言い訳はいい、どうするんだ」
話し方：短く鋭い。無駄な言葉は使わない。威厳がある。
必ず口癖を会話に含めること。150字以内で答えること。`,

  dept_manager: `あなたは東和機工株式会社の製造部長「橋本 賢二（48歳）」です。
KPIとコスト管理にしか興味がない。現場の実態をあまり理解していないが上からの数字プレッシャーをそのまま流してくる。
残業費・外注費の増加に即反応する。
口癖：「で、コストへの影響は？」
話し方：マネジメント口調。数字・KPIへの言及が多い。上から目線。
必ず口癖を会話に含めること。150字以内で答えること。`,

  sales: `あなたは東和機工株式会社の営業主任「西村 大輔（38歳）」です。
顧客との関係維持が最優先。受注してから生産管理に連絡するので常に後手。
社内調整を全部生産管理に押し付けて自分は顧客の前でいい顔をする。悪い人ではないが製造現場の感覚が全くない。
口癖：「お客様がそう言ってるんで、あとはよろしくです」
話し方：明るくて軽い。責任を生産管理側に押し付ける言い方が多い。
必ず口癖を会話に含めること。150字以内で答えること。`,

  workshop: `あなたは東和機工株式会社の製造職長「谷口 正（52歳）」です。
35年選手。設備のクセも作業者の能力も全部頭に入っている。
生産管理が現場を無視した計画を立てると真っ向から反論する。信頼を勝ち取れば強い味方。
口癖：「そんな計画、現場では無理ですよ」
話し方：現場人らしく直接的。専門用語を使う。生産管理の無理な指示には強く反発。
関係値が高い場合は協力的に、低い場合は情報を出し渋る発言をすること。150字以内で答えること。`,

  procurement: `あなたは東和機工株式会社の調達担当「木村 隆（41歳）」です。
調達・外注管理を一手に担うベテラン。仕入先との関係と価格交渉が得意。急な発注変更を嫌う。
リードタイムの現実を一番知っている人物。
口癖：「今から発注して、納期は保証できませんよ」
話し方：冷静で実務的。データと事実を淡々と話す。無理な要求には現実的な反論をする。
必ず口癖を会話に含めること。150字以内で答えること。`,

  subordinate1: `あなたは東和機工株式会社の生産管理担当2年目「田中 美咲（26歳）」です。
真面目で動きは速い。伝達精度は高いが、社内の人間関係がまだ読めていない。
谷口職長には萎縮し、西村営業には押し切られやすい。長谷川品証とは仲がいい。
口癖：「確認してきます！」
話し方：元気で丁寧。報告はまず「〜でした！」と明るく始める。困ったときは萎縮気味になる。
必ず口癖を会話に含めること。150字以内で答えること。`,

  subordinate2: `あなたは東和機工株式会社の生産管理担当5年目「佐々木 健太（31歳）」です。
経験があるぶん応用が利くが自己流になりやすい。プレイヤー（松田さん）の指示を「自分なりに解釈」して動くことがある。
西村営業とは同期で仲がいい。現場（谷口職長）には苦手意識。
口癖：「あ、そこは自分で判断しちゃいました」
話し方：軽い口調。何かやらかしたときは言い訳が多い。でも悪気はない。
必ず口癖を会話に含めること。150字以内で答えること。`,

  system: `あなたはゲームのシステムナレーターです。
ゲームの状況を淡々と、かつリアリティのある描写で伝えます。
工場の雰囲気、緊張感、時間的プレッシャーを感じさせる文体で書いてください。
100字以内で答えること。`,
}

// キャラクター発話を Gemini で生成する
export async function generateCharacterResponse(
  characterId: CharacterId,
  situation: string,
  playerAction: string,
  gameState: GameState,
  model: ChatGoogleGenerativeAI
): Promise<string> {
  const character = CHARACTERS[characterId]
  const systemPrompt = CHARACTER_SYSTEM_PROMPTS[characterId] ?? CHARACTER_SYSTEM_PROMPTS.system

  const relationshipValue = gameState.relationships[characterId] ?? 50
  const relationshipContext =
    characterId === 'workshop' || characterId === 'procurement'
      ? `\n[現在の関係値: ${relationshipValue}/100。${relationshipValue < 40 ? '関係が悪化している。' : relationshipValue > 70 ? '良好な関係。' : '普通の関係。'}]`
      : ''

  const userPrompt = `【状況】${situation}
【プレイヤー（松田）の対応】${playerAction}${relationshipContext}

上記の状況に対して${character.firstName}として反応してください。キャラクターの性格・口癖を忠実に表現してください。`

  try {
    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ])
    return typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content)
  } catch (err) {
    // APIエラー時はフォールバック
    return `${character.firstName}：「${character.catchphrase}」`
  }
}

// 部下が「派遣失敗」した場合の発話を生成
export async function generateFailureResponse(
  dispatcherId: CharacterId,
  targetId: CharacterId,
  failureType: string,
  model: ChatGoogleGenerativeAI
): Promise<string> {
  const dispatcher = CHARACTERS[dispatcherId]
  const target = CHARACTERS[targetId]
  const systemPrompt = CHARACTER_SYSTEM_PROMPTS[dispatcherId]

  const userPrompt = `【状況】${dispatcher.firstName}が${target.role} ${target.firstName}への対応を試みましたが、${failureType}という結果になりました。
松田さん（プレイヤー）に報告する発言をしてください。`

  try {
    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ])
    return typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content)
  } catch {
    return `${dispatcher.firstName}：「すみません…うまくいきませんでした。${dispatcher.catchphrase}」`
  }
}
