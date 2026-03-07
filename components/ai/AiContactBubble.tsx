'use client'

import { useEffect, useRef, useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { GeminiLogo, GoldenSparkBadge } from '@/components/ui/BrandingAssets'
import { format } from 'date-fns'

interface Props {
  content:       string
  isStreaming?:  boolean
  createdAt:     string
  onCopy?:       () => void
}

/** Renders Gemini's markdown-lite responses with syntax highlighting */
export default function AiContactBubble({ content, isStreaming, createdAt, onCopy }: Props) {
  const [copied, setCopied]     = useState(false)
  const cursorRef               = useRef<HTMLSpanElement>(null)

  function handleCopy() {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    onCopy?.()
  }

  // Render markdown-lite: **bold**, *italic*, `code`, bullet lists
  function renderContent(text: string) {
    const lines = text.split('\n')
    return lines.map((line, i) => {
      // Bullet
      if (line.match(/^[•\-\*]\s/)) {
        return (
          <li key={i} className="ml-4 text-white/80 font-body text-sm leading-relaxed">
            {renderInline(line.replace(/^[•\-\*]\s/, ''))}
          </li>
        )
      }
      // Blank line
      if (!line.trim()) return <br key={i} />
      // Normal line
      return (
        <p key={i} className="text-sm text-white/88 font-body leading-relaxed">
          {renderInline(line)}
        </p>
      )
    })
  }

  function renderInline(text: string) {
    // Split on **bold**, *italic*, `code`
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-display font-bold text-white">{part.slice(2, -2)}</strong>
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic text-white/75">{part.slice(1, -1)}</em>
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="font-mono text-[13px] bg-electric/10 text-electric px-1.5 py-0.5 rounded border border-electric/20">
            {part.slice(1, -1)}
          </code>
        )
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <div className="flex items-start gap-2.5 pr-12 py-0.5 animate-fade-in">

      {/* AI Avatar — Gemini star logo */}
      <div className="relative w-8 h-8 flex-shrink-0 mt-0.5 flex items-center justify-center">
        <GeminiLogo size="md" animated={isStreaming} />
        {isStreaming && (
          <div className="absolute inset-0 rounded-full border border-electric/30 animate-ping" />
        )}
      </div>

      {/* Bubble */}
      <div className="flex-1 min-w-0">
        {/* Name badge */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[11px] font-display font-bold text-electric">Gemini 3 Pro</span>
          <GoldenSparkBadge size="xs" />
          <div className="flex items-center gap-1 bg-electric/10 border border-electric/20 rounded-full px-1.5 py-0.5">
            <span className="text-[8px] font-display font-bold text-electric uppercase tracking-wider">Official</span>
          </div>
        </div>

        {/* Content */}
        <div
          className="rounded-2xl rounded-tl-sm px-4 py-3 relative"
          style={{
            background: 'linear-gradient(135deg, rgba(0,212,255,0.06) 0%, rgba(10,14,46,0.9) 100%)',
            border:     '1px solid rgba(0,212,255,0.15)',
            boxShadow:  '0 2px 20px rgba(0,212,255,0.08)',
          }}
        >
          {/* Decorative gradient line at top */}
          <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl"
               style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.4), transparent)' }} />

          <div className="space-y-1">
            {renderContent(content)}
          </div>

          {/* Streaming cursor */}
          {isStreaming && (
            <span
              ref={cursorRef}
              className="inline-block w-0.5 h-4 bg-electric ml-0.5 align-middle"
              style={{ animation: 'blink 0.8s step-end infinite' }}
            />
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
            <span className="text-[10px] text-white/25 font-body">
              {format(new Date(createdAt), 'h:mm a')}
              {isStreaming && (
                <span className="text-electric ml-2 animate-pulse">● generating…</span>
              )}
            </span>
            {!isStreaming && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopy}
                  className="w-6 h-6 rounded-lg hover:bg-white/8 flex items-center justify-center text-white/25 hover:text-white/60 transition-colors"
                  title="Copy response"
                >
                  {copied
                    ? <Check className="w-3 h-3 text-green-400" />
                    : <Copy className="w-3 h-3" />
                  }
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
