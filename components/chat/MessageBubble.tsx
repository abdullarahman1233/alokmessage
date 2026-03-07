'use client'

import Image from 'next/image'
import { format } from 'date-fns'
import { Shield, AlertTriangle, Image as ImageIcon, FileText, Mic } from 'lucide-react'
import { MessageTick } from '@/components/ui/MessageTick'
import type { Message, User } from '@/types'

interface Props {
  message:         Message
  isOwn:           boolean
  sender?:         Partial<User>
  showAvatar:      boolean
  allowScreenshot: boolean
}

export default function MessageBubble({ message, isOwn, sender, showAvatar, allowScreenshot }: Props) {
  if (message.isDeleted) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} px-1 py-0.5`}>
        <p className="text-xs text-white/25 italic font-body px-3 py-1.5 glass rounded-xl">
          Message deleted
        </p>
      </div>
    )
  }

  if (message.type === 'system') {
    return (
      <div className="flex justify-center py-2">
        <span className="text-xs text-white/30 bg-white/5 rounded-full px-3 py-1 font-body">{message.content}</span>
      </div>
    )
  }

  const threat = message.aiScanResult?.threatLevel
  const isBlocked = message.aiScanResult?.action === 'block' || message.aiScanResult?.action === 'escalate'

  return (
    <div className={`flex items-end gap-2 px-1 py-0.5 ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}>

      {/* Avatar (received only) */}
      {!isOwn && (
        <div className="w-7 h-7 flex-shrink-0 mb-0.5">
          {showAvatar ? (
            <div className="w-7 h-7 rounded-full glass overflow-hidden">
              {sender?.avatar ? (
                <Image src={sender.avatar} alt={sender.displayName ?? ''} width={28} height={28} className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-display font-bold text-electric/80 bg-electric/10">
                  {sender?.displayName?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Bubble */}
      <div className={`max-w-[70%] min-w-[60px] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>

        {/* Sender name (group chats) */}
        {!isOwn && showAvatar && sender?.displayName && (
          <div className="flex items-center gap-1.5 px-1">
            <span className="text-[11px] font-display font-semibold text-electric/80">{sender.displayName}</span>
            {sender.verificationLevel === 'blue' && (
              <Shield className="w-2.5 h-2.5 text-electric" fill="currentColor" />
            )}
          </div>
        )}

        {/* AI Guard blocked message */}
        {isBlocked ? (
          <div className="glass rounded-2xl p-3 border border-red-500/30 bg-red-500/8">
            <div className="flex items-center gap-2 text-red-400 text-xs font-display font-semibold mb-1">
              <Shield className="w-3.5 h-3.5" />
              Blocked by Alok Guard
            </div>
            <p className="text-white/30 text-xs font-body">
              This message was blocked for violating platform safety rules.
            </p>
          </div>
        ) : (
          <div className={`rounded-2xl overflow-hidden ${isOwn ? 'bubble-out rounded-br-sm' : 'bubble-in rounded-bl-sm'}`}>

            {/* Image */}
            {message.type === 'image' && message.mediaUrl && (
              <div className={`relative ${allowScreenshot ? '' : 'select-none'}`}>
                <Image
                  src={message.mediaUrl}
                  alt="Image"
                  width={280}
                  height={200}
                  className="object-cover max-h-64 w-full"
                  draggable={allowScreenshot}
                />
              </div>
            )}

            {/* File */}
            {message.type === 'file' && (
              <div className="flex items-center gap-3 p-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-electric/80" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-display font-medium text-white truncate">{message.content}</p>
                  {message.mediaSize && (
                    <p className="text-xs text-white/40 font-body">{(message.mediaSize / 1024 / 1024).toFixed(1)} MB · Lossless</p>
                  )}
                </div>
              </div>
            )}

            {/* Audio */}
            {message.type === 'audio' && (
              <div className="flex items-center gap-3 px-3 py-2.5">
                <Mic className="w-4 h-4 text-electric flex-shrink-0" />
                <div className="flex-1 h-1 bg-white/20 rounded-full">
                  <div className="h-full w-1/3 bg-electric rounded-full" />
                </div>
                <span className="text-xs text-white/40 font-mono flex-shrink-0">0:12</span>
              </div>
            )}

            {/* Text */}
            {(message.type === 'text' || !message.type) && (
              <div className="px-3.5 py-2.5">
                <p className="text-sm text-white/92 font-body leading-relaxed whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className={`flex items-center gap-1.5 px-3 pb-2 ${
              message.type === 'text' ? 'pt-0 -mt-1' : 'pt-1'
            } ${isOwn ? 'justify-end' : 'justify-end'}`}>
              {/* Threat indicator */}
              {threat && threat !== 'safe' && (
                <span className={`text-[9px] font-display font-bold uppercase threat-${threat} px-1.5 py-0.5 rounded border`}>
                  {threat}
                </span>
              )}

              <span className="text-[10px] text-white/30 font-body">
                {format(new Date(message.createdAt), 'h:mm a')}
              </span>
              {message.isEdited && <span className="text-[10px] text-white/25 font-body">edited</span>}
              {isOwn && <MessageTick status={message.status ?? 'sent'} />}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
