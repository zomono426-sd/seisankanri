import { useEffect, useRef } from 'react'
import type { ConversationMessage, CharacterId } from '../../shared/types'
import { CHARACTERS } from './characterData'

interface ChatPanelProps {
  conversations: ConversationMessage[]
  isProcessing: boolean
  characterResponse: string | null
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

interface MessageBubbleProps {
  message: ConversationMessage
}

function MessageBubble({ message }: MessageBubbleProps) {
  const character = CHARACTERS[message.characterId]
  const isSystem = message.characterId === 'system'

  if (isSystem) {
    return (
      <div className="flex justify-center my-3 animate-slide-in">
        <div className="bg-factory-border/50 border border-factory-border text-factory-subtext text-xs font-mono px-4 py-2 rounded max-w-[80%] text-center">
          <span className="text-factory-amber mr-2">【{minutesToTime(message.timestamp)}】</span>
          {message.content}
        </div>
      </div>
    )
  }

  const ROLE_ICONS: Record<string, string> = {
    '工場長': '🏭',
    '製造部長': '👔',
    '営業主任': '💼',
    '製造職長': '🔧',
    '調達担当': '📦',
    '外注先社長': '🏗',
    '生産管理担当（2年目）': '📋',
    '生産管理担当（5年目）': '📊',
    'システム': '🖥',
  }

  const icon = ROLE_ICONS[character?.role ?? ''] ?? '👤'

  return (
    <div className="flex gap-3 mb-4 animate-slide-in">
      {/* アバター */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border text-base"
        style={{
          backgroundColor: (character?.avatarColor ?? '#475569') + '22',
          borderColor: character?.avatarColor ?? '#475569',
        }}
      >
        {icon}
      </div>

      {/* バブル */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-xs font-mono font-bold"
            style={{ color: character?.avatarColor ?? '#94a3b8' }}
          >
            {character?.displayName ?? message.characterId}
          </span>
          <span className="text-xs text-factory-muted font-mono">
            {minutesToTime(message.timestamp)}
          </span>
        </div>
        <div className="bg-factory-panel border border-factory-border rounded-lg rounded-tl-none px-4 py-3 text-sm text-factory-text leading-relaxed">
          {message.content}
        </div>
      </div>
    </div>
  )
}

export function ChatPanel({ conversations, isProcessing, characterResponse }: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversations, isProcessing])

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {conversations.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* 処理中インジケーター */}
        {isProcessing && (
          <div className="flex gap-3 mb-4 animate-slide-in">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-factory-border border border-factory-border flex-shrink-0">
              <span className="animate-spin text-base">⚙</span>
            </div>
            <div className="flex-1">
              <div className="text-xs font-mono text-factory-muted mb-1">対応中...</div>
              <div className="bg-factory-panel border border-factory-border rounded-lg rounded-tl-none px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-factory-amber rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-factory-amber rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-factory-amber rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
