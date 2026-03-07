import { clsx } from 'clsx'
import type { MessageStatus } from '@/types'

interface Props {
  status:    MessageStatus
  size?:     'xs' | 'sm'
  className?: string
}

// ─── Single tick SVG ──────────────────────────────────────────────────────────
function SingleTick({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 10" fill="none" className={className} aria-hidden>
      <path d="M1 5L4.5 8.5L11 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Double tick SVG ─────────────────────────────────────────────────────────
function DoubleTick({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 10" fill="none" className={className} aria-hidden>
      {/* Second tick (background) */}
      <path d="M5 5L8.5 8.5L15 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      {/* First tick (foreground) */}
      <path d="M1 5L4.5 8.5L11 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Clock SVG (sending) ─────────────────────────────────────────────────────
function ClockTick({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" fill="none" className={className} aria-hidden>
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6 3.5V6L7.5 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const sizes = {
  xs: 'w-3   h-2.5',
  sm: 'w-3.5 h-3',
}

const clockSizes = {
  xs: 'w-2.5 h-2.5',
  sm: 'w-3   h-3',
}

export function MessageTick({ status, size = 'xs', className }: Props) {
  if (status === 'sending' || status === 'failed') {
    return (
      <ClockTick
        className={clsx(
          clockSizes[size],
          status === 'sending' ? 'text-white/30 animate-pulse' : 'text-red-400',
          className,
        )}
      />
    )
  }

  if (status === 'sent') {
    return (
      <SingleTick
        className={clsx(
          sizes[size],
          'text-white/40',
          className,
        )}
      />
    )
  }

  if (status === 'delivered') {
    return (
      <DoubleTick
        className={clsx(
          sizes[size],
          'text-white/40',
          className,
        )}
      />
    )
  }

  if (status === 'read') {
    return (
      <DoubleTick
        className={clsx(
          sizes[size],
          // Electric blue for read — matches WhatsApp convention
          'text-[#00d4ff]',
          className,
        )}
      />
    )
  }

  return null
}
