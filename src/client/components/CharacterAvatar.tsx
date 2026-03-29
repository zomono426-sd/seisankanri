import type { Character } from '../../shared/types'

interface CharacterAvatarProps {
  character: Character
  size?: 'sm' | 'md' | 'lg'
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

export function CharacterAvatar({ character, size = 'md' }: CharacterAvatarProps) {
  const icon = ROLE_ICONS[character.role] ?? '👤'

  const sizeClasses = {
    sm: 'w-8 h-8 text-base',
    md: 'w-12 h-12 text-xl',
    lg: 'w-16 h-16 text-2xl',
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center border-2 font-bold flex-shrink-0`}
        style={{
          backgroundColor: character.avatarColor + '22',
          borderColor: character.avatarColor,
          color: character.avatarColor,
        }}
      >
        {icon}
      </div>
      {size !== 'sm' && (
        <div className="text-center">
          <div className="text-xs font-mono font-bold text-factory-text leading-tight">
            {character.role}
          </div>
          <div className="text-xs text-factory-subtext leading-tight">
            {character.firstName}
          </div>
        </div>
      )}
    </div>
  )
}
