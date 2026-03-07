'use client'

import { useEffect, ReactNode } from 'react'
import { X } from 'lucide-react'
import { clsx } from 'clsx'

interface ModalProps {
  open:      boolean
  onClose:   () => void
  title?:    string
  subtitle?: string
  children:  ReactNode
  size?:     'sm' | 'md' | 'lg' | 'xl'
  noPadding?: boolean
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
}

export function Modal({ open, onClose, title, subtitle, children, size = 'md', noPadding }: ModalProps) {
  // Lock scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [open])

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-midnight-950/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className={clsx(
        'relative w-full glass-card rounded-3xl animate-slide-up',
        sizeClasses[size],
        noPadding ? '' : 'p-6',
      )}>
        {/* Header */}
        {(title || subtitle) && (
          <div className={clsx('flex items-start justify-between', noPadding ? 'px-6 pt-6 pb-0' : 'mb-6')}>
            <div>
              {title && <h2 className="font-display font-bold text-white text-lg">{title}</h2>}
              {subtitle && <p className="text-sm text-white/40 font-body mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors ml-4 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Close button only */}
        {!title && !subtitle && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {children}
      </div>
    </div>
  )
}
