'use client'

/**
 * BrandingAssets.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * All custom visual brand components for Alok Message.
 * Pure presentational layer — zero routing, zero message, zero security logic.
 *
 * Exports:
 *   GeminiLogo        — 4-pointed star, exact Google Gemini gradient recreation
 *   GeminiAvatar      — Full AI contact avatar with breathing glow animation
 *   VerifiedBadge     — Scalloped blue badge (#1D9BF0) with hover tooltip
 *   VerifiedBadgeInline — Compact inline version for chat headers
 *   GoldenSparkBadge  — Gold spark for AI authority indicator
 */

import Image from 'next/image'
import { clsx } from 'clsx'
import { useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

const pxMap: Record<LogoSize, number> = {
  xs: 16, sm: 20, md: 28, lg: 40, xl: 56, '2xl': 80,
}
const twMap: Record<LogoSize, string> = {
  xs: 'w-4 h-4', sm: 'w-5 h-5', md: 'w-7 h-7',
  lg: 'w-10 h-10', xl: 'w-14 h-14', '2xl': 'w-20 h-20',
}

// ─── GeminiLogo ───────────────────────────────────────────────────────────────
// The 4-pointed star with Google's exact gradient.
// Renders as inline SVG for sharp edges at every scale.

interface GeminiLogoProps {
  size?:      LogoSize
  className?: string
  animated?:  boolean   // soft rotation shimmer
}

export function GeminiLogo({ size = 'md', className, animated }: GeminiLogoProps) {
  const px = pxMap[size]
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx(animated && 'animate-spin-slow', className)}
      aria-label="Gemini 3 Pro"
    >
      <defs>
        {/* Google Gemini 4-colour gradient: red→blue→green→yellow */}
        <linearGradient id={`gm-main-${size}`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#34A853" />
          <stop offset="28%"  stopColor="#FBBC04" />
          <stop offset="58%"  stopColor="#EA4335" />
          <stop offset="100%" stopColor="#4285F4" />
        </linearGradient>
        {/* Blue-shift right-side overlay for depth */}
        <linearGradient id={`gm-over-${size}`} x1="100%" y1="0%" x2="15%" y2="100%">
          <stop offset="0%"   stopColor="#4285F4" stopOpacity="0.55" />
          <stop offset="60%"  stopColor="#4285F4" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#34A853" stopOpacity="0"    />
        </linearGradient>
        {/* Radial centre highlight — creates the 3D sphere feel */}
        <radialGradient id={`gm-glow-${size}`} cx="58%" cy="40%" r="52%">
          <stop offset="0%"   stopColor="#4285F4" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#4285F4" stopOpacity="0"   />
        </radialGradient>
      </defs>

      {/* 4-pointed star — concave bezier sides (authentic Gemini proportions) */}
      <path
        d="M50 2 C50 2,62 34,98 50 C98 50,62 66,50 98 C50 98,38 66,2 50 C2 50,38 34,50 2 Z"
        fill={`url(#gm-main-${size})`}
      />
      <path
        d="M50 2 C50 2,62 34,98 50 C98 50,62 66,50 98 C50 98,38 66,2 50 C2 50,38 34,50 2 Z"
        fill={`url(#gm-over-${size})`}
      />
      <path
        d="M50 2 C50 2,62 34,98 50 C98 50,62 66,50 98 C50 98,38 66,2 50 C2 50,38 34,50 2 Z"
        fill={`url(#gm-glow-${size})`}
      />
    </svg>
  )
}

// ─── GeminiAvatar ─────────────────────────────────────────────────────────────
// Full AI contact avatar sphere with breathing neon pulse (#2299FF).
// Matches the spec: glassmorphism sphere + breathing glow to signal active AI.

interface GeminiAvatarProps {
  size?:      LogoSize
  breathing?: boolean    // breathing glow animation (default: true)
  className?: string
}

export function GeminiAvatar({ size = 'lg', breathing = true, className }: GeminiAvatarProps) {
  const px   = pxMap[size]
  const twCls = twMap[size]

  return (
    <div className={clsx('relative flex-shrink-0 inline-flex items-center justify-center', twCls, className)}>
      {/* Breathing glow ring — neon #2299FF */}
      {breathing && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            animation: 'gemini-breathe 3s ease-in-out infinite',
            background: 'radial-gradient(circle, rgba(34,153,255,0.35) 0%, transparent 70%)',
          }}
        />
      )}

      {/* Outer glass ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'linear-gradient(135deg, rgba(66,133,244,0.25), rgba(52,168,83,0.15))',
          border:     '1px solid rgba(66,133,244,0.3)',
        }}
      />

      {/* Inner sphere — dark with subtle depth */}
      <div
        className={clsx(
          'relative flex items-center justify-center rounded-full overflow-hidden',
          twCls,
        )}
        style={{
          background: 'radial-gradient(circle at 35% 35%, #1a2744 0%, #0d1420 60%, #080e1a 100%)',
        }}
      >
        {/* Actual uploaded Gemini image */}
        <Image
          src="/assets/ai/gemini-3-pro.jpg"
          alt="Gemini 3 Pro"
          width={px}
          height={px}
          className="object-cover w-full h-full"
          priority
        />
      </div>
    </div>
  )
}

// ─── VerifiedBadge ────────────────────────────────────────────────────────────
// Scalloped blue badge (#1D9BF0) with white checkmark.
// Exact recreation as inline SVG — lossless at any resolution.
// Tooltip: "Verified Trusted Business — 200+ Sales Complete"

interface VerifiedBadgeProps {
  size?:      LogoSize
  tooltip?:   boolean
  className?: string
}

export function VerifiedBadge({ size = 'sm', tooltip = true, className }: VerifiedBadgeProps) {
  const [showTip, setShowTip] = useState(false)
  const px = pxMap[size]

  return (
    <span
      className={clsx('relative inline-flex flex-shrink-0 cursor-default', className)}
      onMouseEnter={() => tooltip && setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
      aria-label="Verified Trusted Business — 200+ Sales Complete"
    >
      {/* Scalloped badge — 12-point seal matching the uploaded PNG */}
      <svg
        width={px}
        height={px}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`vb-grad-${size}`} x1="20%" y1="10%" x2="80%" y2="90%">
            <stop offset="0%"   stopColor="#29B6F6" />
            <stop offset="100%" stopColor="#1D9BF0" />
          </linearGradient>
          <filter id={`vb-shadow-${size}`} x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#1D9BF0" floodOpacity="0.4" />
          </filter>
        </defs>

        {/*
          Scalloped seal — 12 outward bumps.
          Generated by: for each of 12 segments (30° apart),
          arc outward from inner radius 37 to outer radius 48.
        */}
        <path
          d={scallopPath(50, 50, 46, 37, 12)}
          fill={`url(#vb-grad-${size})`}
          filter={`url(#vb-shadow-${size})`}
        />

        {/* Bold white checkmark, centred, matching uploaded image proportions */}
        <path
          d="M 29 50 L 43 65 L 71 33"
          stroke="white"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>

      {/* Tooltip */}
      {showTip && tooltip && (
        <span
          className="
            absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
            whitespace-nowrap text-xs font-display font-semibold
            bg-[#1D9BF0] text-white px-3 py-1.5 rounded-xl shadow-lg
            pointer-events-none
          "
          style={{ animation: 'fadeIn 0.15s ease' }}
        >
          ✓ Verified Trusted Business — 200+ Sales Complete
          {/* Arrow */}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1D9BF0]" />
        </span>
      )}
    </span>
  )
}

// ─── VerifiedBadgeInline ──────────────────────────────────────────────────────
// Slim inline version for use inside chat headers, contact list rows,
// and profile name lines — respects tight horizontal space.

interface VerifiedBadgeInlineProps {
  size?:      'xs' | 'sm' | 'md'
  label?:     boolean   // show "Verified" text alongside badge
  className?: string
}

export function VerifiedBadgeInline({ size = 'xs', label, className }: VerifiedBadgeInlineProps) {
  return (
    <span className={clsx('inline-flex items-center gap-1 flex-shrink-0', className)}>
      <VerifiedBadge size={size} tooltip={true} />
      {label && (
        <span className="text-[10px] font-display font-bold text-[#1D9BF0] uppercase tracking-wide">
          Verified
        </span>
      )}
    </span>
  )
}

// ─── GoldenSparkBadge ─────────────────────────────────────────────────────────
// Golden authority badge for the AI contact (Gemini 3 Pro).
// Shown next to the AI name to signal AI authority.

interface GoldenSparkProps {
  size?:  LogoSize
  className?: string
}

export function GoldenSparkBadge({ size = 'xs', className }: GoldenSparkProps) {
  const px = pxMap[size]
  return (
    <svg
      width={px + 2}
      height={px + 2}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="AI Authority"
    >
      <defs>
        <linearGradient id="gold-spark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#FFD700" />
          <stop offset="50%"  stopColor="#FFA500" />
          <stop offset="100%" stopColor="#FF8C00" />
        </linearGradient>
      </defs>
      {/* 4-pointed star (smaller, for inline use) */}
      <path
        d="M12 1 C12 1,14.5 8,23 12 C23 12,14.5 16,12 23 C12 23,9.5 16,1 12 C1 12,9.5 8,12 1 Z"
        fill="url(#gold-spark)"
      />
    </svg>
  )
}

// ─── BusinessVerifiedRow ──────────────────────────────────────────────────────
// Composite component: business name + verified badge + tooltip.
// Drop-in for ChatWindowHeader, ContactListItem, ProfileHeader.
// Only renders the badge when verifiedBadge === true (200+ sales gate).

interface BusinessVerifiedRowProps {
  businessName:   string
  verifiedBadge:  boolean
  totalSales?:    number
  className?:     string
  nameClassName?: string
}

export function BusinessVerifiedRow({
  businessName,
  verifiedBadge,
  totalSales,
  className,
  nameClassName,
}: BusinessVerifiedRowProps) {
  return (
    <span className={clsx('inline-flex items-center gap-1.5', className)}>
      <span className={clsx('font-display font-semibold truncate', nameClassName ?? 'text-sm text-white')}>
        {businessName}
      </span>
      {verifiedBadge && (
        <VerifiedBadge size="xs" tooltip={true} />
      )}
    </span>
  )
}

// ─── Helper: generate scalloped path ─────────────────────────────────────────
// Programmatically builds the 12-point seal shape that matches
// the uploaded blue badge PNG. Each "scallop" is a smooth arc
// that bows outward from the inner circle to the outer ring.

function scallopPath(
  cx: number, cy: number,
  rOuter: number, rInner: number,
  points: number,
): string {
  const total  = points * 2
  const step   = (Math.PI * 2) / total
  const offset = -Math.PI / 2   // start at top

  let d = ''
  for (let i = 0; i < total; i++) {
    const angle = offset + i * step
    const r     = i % 2 === 0 ? rOuter : rInner
    const x     = cx + r * Math.cos(angle)
    const y     = cy + r * Math.sin(angle)

    if (i === 0) {
      d += `M ${x.toFixed(2)} ${y.toFixed(2)} `
    } else {
      // Smooth cubic bezier between adjacent points
      const prevAngle = offset + (i - 1) * step
      const prevR     = (i - 1) % 2 === 0 ? rOuter : rInner
      const px        = cx + prevR * Math.cos(prevAngle)
      const py        = cy + prevR * Math.sin(prevAngle)
      const mx        = (px + x) / 2
      const my        = (py + y) / 2
      // Control point pushes outward for outer points, inward for inner
      const ctrlR     = r * 1.08
      const ctrlX     = cx + ctrlR * Math.cos(angle - step / 2)
      const ctrlY     = cy + ctrlR * Math.sin(angle - step / 2)
      d += `Q ${ctrlX.toFixed(2)} ${ctrlY.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} `
    }
  }
  return d + 'Z'
}
