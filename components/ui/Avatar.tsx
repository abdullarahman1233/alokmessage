import Image from 'next/image'
import { Shield } from 'lucide-react'
import { clsx } from 'clsx'

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

interface AvatarProps {
  src?:           string | null
  name:           string
  size?:          Size
  status?:        'online' | 'away' | 'offline'
  verified?:      boolean
  className?:     string
  onClick?:       () => void
}

const sizePx: Record<Size, number>      = { xs: 24, sm: 32, md: 40, lg: 48, xl: 64, '2xl': 80 }
const sizeClass: Record<Size, string>   = {
  xs:  'w-6 h-6 text-[10px]',
  sm:  'w-8 h-8 text-xs',
  md:  'w-10 h-10 text-sm',
  lg:  'w-12 h-12 text-base',
  xl:  'w-16 h-16 text-xl',
  '2xl': 'w-20 h-20 text-2xl',
}
const dotSize: Record<Size, string> = {
  xs: 'w-2 h-2 border',
  sm: 'w-2.5 h-2.5 border',
  md: 'w-3 h-3 border-2',
  lg: 'w-3.5 h-3.5 border-2',
  xl: 'w-4 h-4 border-2',
  '2xl': 'w-5 h-5 border-2',
}
const badgeSize: Record<Size, string> = {
  xs: 'hidden',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  xl: 'w-6 h-6',
  '2xl': 'w-7 h-7',
}

export function Avatar({ src, name, size = 'md', status, verified, className, onClick }: AvatarProps) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div className={clsx('relative flex-shrink-0', onClick && 'cursor-pointer', className)} onClick={onClick}>
      <div className={clsx(
        'rounded-full glass overflow-hidden flex items-center justify-center',
        sizeClass[size],
      )}>
        {src ? (
          <Image
            src={src}
            alt={name}
            width={sizePx[size]}
            height={sizePx[size]}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500/20 to-blue-700/20 font-display font-bold text-electric">
            {initials}
          </div>
        )}
      </div>

      {/* Online status dot */}
      {status && (
        <span className={clsx(
          'absolute -bottom-0.5 -right-0.5 rounded-full border-midnight-950',
          dotSize[size],
          status === 'online'  && 'bg-green-400 shadow-[0_0_6px_#22c55e]',
          status === 'away'    && 'bg-yellow-400',
          status === 'offline' && 'bg-gray-500',
        )} />
      )}

      {/* Verified badge */}
      {verified && (
        <div className={clsx(
          'absolute -top-0.5 -right-0.5 rounded-full bg-electric flex items-center justify-center',
          badgeSize[size],
        )}>
          <Shield className="w-2/3 h-2/3 text-midnight-950" fill="currentColor" />
        </div>
      )}
    </div>
  )
}
