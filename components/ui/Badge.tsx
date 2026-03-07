import { clsx } from 'clsx'
import { ReactNode } from 'react'

type BadgeVariant = 'electric' | 'success' | 'warning' | 'danger' | 'critical' | 'glass' | 'verified'

interface BadgeProps {
  variant?:  BadgeVariant
  children:  ReactNode
  dot?:      boolean
  pulse?:    boolean
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  electric: 'bg-electric/15 border-electric/30 text-electric',
  success:  'bg-green-500/15 border-green-500/30 text-green-400',
  warning:  'bg-yellow-500/15 border-yellow-500/30 text-yellow-400',
  danger:   'bg-orange-500/15 border-orange-500/30 text-orange-400',
  critical: 'bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.2)]',
  glass:    'glass border-white/12 text-white/60',
  verified: 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-electric/30 text-electric',
}

const dotColors: Record<BadgeVariant, string> = {
  electric: 'bg-electric',
  success:  'bg-green-400',
  warning:  'bg-yellow-400',
  danger:   'bg-orange-400',
  critical: 'bg-red-400',
  glass:    'bg-white/40',
  verified: 'bg-electric',
}

export function Badge({ variant = 'glass', children, dot, pulse, className }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 border rounded-full',
      'text-[10px] font-display font-bold uppercase tracking-wider',
      'px-2 py-0.5',
      variants[variant],
      className,
    )}>
      {dot && (
        <span className={clsx(
          'w-1.5 h-1.5 rounded-full flex-shrink-0',
          dotColors[variant],
          pulse && 'animate-pulse',
        )} />
      )}
      {children}
    </span>
  )
}
