import { clsx } from 'clsx'
import type { PresenceStatus } from '@/hooks/usePresence'

interface Props {
  status:    PresenceStatus
  size?:     'sm' | 'md' | 'lg'
  className?: string
  showRing?:  boolean   // outer glow ring when online
}

const dotSize = {
  sm: 'w-2    h-2',
  md: 'w-2.5  h-2.5',
  lg: 'w-3.5  h-3.5',
}

const dotColor: Record<PresenceStatus, string> = {
  online:  'bg-[#22C55E]',
  away:    'bg-yellow-400',
  offline: 'bg-white/20',
}

const ringColor: Record<PresenceStatus, string> = {
  online:  'shadow-[0_0_0_2px_rgba(34,197,94,0.25)]',
  away:    'shadow-[0_0_0_2px_rgba(250,204,21,0.2)]',
  offline: '',
}

export function PresenceDot({ status, size = 'md', className, showRing = true }: Props) {
  return (
    <span
      aria-label={`Status: ${status}`}
      className={clsx(
        'rounded-full flex-shrink-0 transition-colors duration-300',
        dotSize[size],
        dotColor[status],
        showRing && status !== 'offline' && ringColor[status],
        className,
      )}
    />
  )
}

// ─── PresenceBadge — inline "● Online" or "Last seen …" text ─────────────────

interface BadgeProps {
  status:     PresenceStatus
  lastSeen:   string | null
  formatter?: (ts: string) => string
  className?: string
}

export function PresenceBadge({ status, lastSeen, formatter, className }: BadgeProps) {
  let label: string

  if (status === 'online') {
    label = 'Online'
  } else if (status === 'away') {
    label = 'Away'
  } else if (lastSeen) {
    const diff = Math.floor((Date.now() - new Date(lastSeen).getTime()) / 1000)
    if (diff < 60)    label = 'Last seen just now'
    else if (diff < 3600)   label = `Last seen ${Math.floor(diff / 60)} min ago`
    else if (diff < 86400)  label = `Last seen ${Math.floor(diff / 3600)}h ago`
    else if (diff < 604800) label = `Last seen ${Math.floor(diff / 86400)}d ago`
    else label = `Last seen ${new Date(lastSeen).toLocaleDateString('en', { month: 'short', day: 'numeric' })}`
  } else {
    label = 'Offline'
  }

  return (
    <span
      className={clsx(
        'text-xs font-body',
        status === 'online'  && 'text-[#22C55E]',
        status === 'away'    && 'text-yellow-400',
        status === 'offline' && 'text-white/35',
        className,
      )}
    >
      {status !== 'offline' && (
        <span
          className={clsx(
            'inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle',
            status === 'online' && 'bg-[#22C55E] shadow-[0_0_4px_#22C55E]',
            status === 'away'   && 'bg-yellow-400',
          )}
        />
      )}
      {label}
    </span>
  )
}
