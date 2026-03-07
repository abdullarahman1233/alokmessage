'use client'

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:    string
  hint?:     string
  error?:    string
  icon?:     ReactNode
  iconRight?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, icon, iconRight, className, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-display font-semibold text-white/50 uppercase tracking-widest mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={clsx(
            'input-glass focus-ring',
            icon      && 'pl-10',
            iconRight && 'pr-10',
            error     && 'border-red-500/50 focus:border-red-500/70',
            className,
          )}
          {...props}
        />
        {iconRight && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30">
            {iconRight}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-400 mt-1.5 font-body">{error}</p>}
      {hint  && !error && <p className="text-xs text-white/30 mt-1.5 font-body">{hint}</p>}
    </div>
  )
)
Input.displayName = 'Input'

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?:  string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, className, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-display font-semibold text-white/50 uppercase tracking-widest mb-2">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={clsx(
          'input-glass focus-ring resize-none',
          error && 'border-red-500/50',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400 mt-1.5 font-body">{error}</p>}
      {hint  && !error && <p className="text-xs text-white/30 mt-1.5 font-body">{hint}</p>}
    </div>
  )
)
Textarea.displayName = 'Textarea'
