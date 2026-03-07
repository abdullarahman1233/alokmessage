'use client'

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'

type Variant = 'primary' | 'glass' | 'danger' | 'ghost' | 'electric'
type Size    = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  Variant
  size?:     Size
  loading?:  boolean
  icon?:     ReactNode
  iconRight?: ReactNode
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:  'bg-btn-primary text-white font-display font-semibold shadow-electric-sm hover:opacity-90 hover:-translate-y-px active:translate-y-0',
  glass:    'glass text-white/80 hover:bg-white/10 hover:text-white font-body border border-white/12',
  danger:   'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 font-display font-semibold',
  ghost:    'text-white/50 hover:text-white hover:bg-white/8 font-body',
  electric: 'border border-electric/40 text-electric bg-electric/10 hover:bg-electric/20 font-display font-semibold',
}

const sizeClasses: Record<Size, string> = {
  xs: 'text-xs px-2.5 py-1.5 rounded-lg',
  sm: 'text-sm px-3.5 py-2 rounded-xl',
  md: 'text-sm px-4 py-2.5 rounded-xl',
  lg: 'text-base px-6 py-3 rounded-2xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'glass', size = 'md', loading, icon, iconRight, fullWidth, children, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'inline-flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
        ) : icon}
        {children}
        {!loading && iconRight}
      </button>
    )
  }
)

Button.displayName = 'Button'
