'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Shield, Phone, Mail, Edit3, Camera, Star,
  MessageCircle, Phone as PhoneIcon, MoreVertical,
  Flag, Lock, UserX, Briefcase, Copy, Check,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge }  from '@/components/ui/Badge'
import { VerifiedBadge, BusinessVerifiedRow } from '@/components/ui/BrandingAssets'
import { Button } from '@/components/ui/Button'
import type { User, BusinessProfile } from '@/types'

interface ProfileViewProps {
  user:          User
  isOwn:         boolean
  onMessageClick?: () => void
  onCallClick?:  (type: 'audio' | 'video') => void
  onEditClick?:  () => void
  onReport?:     () => void
}

export default function ProfileView({
  user, isOwn, onMessageClick, onCallClick, onEditClick, onReport,
}: ProfileViewProps) {
  const [copied, setCopied] = useState(false)

  function copyId() {
    const id = user.contactId ?? user.phone ?? user.email ?? ''
    navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">

      {/* ── Cover Photo ──────────────────────────────────────────────── */}
      <div className="relative h-44 flex-shrink-0">
        {(user as any).coverPhoto ? (
          <Image
            src={(user as any).coverPhoto}
            alt="Cover"
            fill
            className="object-cover"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: 'linear-gradient(135deg, #0a1628 0%, #0d1f3c 40%, #0a0e2e 100%)',
            }}
          >
            {/* Decorative orbs */}
            <div className="absolute top-4 left-8 w-24 h-24 rounded-full opacity-20 blur-2xl"
                 style={{ background: 'radial-gradient(circle, #00d4ff, transparent)' }} />
            <div className="absolute bottom-2 right-12 w-16 h-16 rounded-full opacity-15 blur-xl"
                 style={{ background: 'radial-gradient(circle, #9c27b0, transparent)' }} />
          </div>
        )}

        {/* Cover photo edit (own profile) */}
        {isOwn && (
          <button
            onClick={onEditClick}
            className="absolute top-3 right-3 w-8 h-8 rounded-xl glass flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <Camera className="w-4 h-4" />
          </button>
        )}

        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-midnight-950 to-transparent" />
      </div>

      {/* ── Avatar row ───────────────────────────────────────────────── */}
      <div className="px-5 -mt-10 flex items-end justify-between mb-4 relative z-10">
        <div className="relative">
          <Avatar
            src={user.avatar}
            name={user.displayName}
            size="2xl"
            status={user.status}
            verified={user.verificationLevel === 'blue'}
            className="ring-4 ring-midnight-950"
          />
          {isOwn && (
            <button
              onClick={onEditClick}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-electric flex items-center justify-center"
            >
              <Camera className="w-3.5 h-3.5 text-midnight-950" />
            </button>
          )}
        </div>

        {/* Action buttons (other users) */}
        {!isOwn && (
          <div className="flex items-center gap-2 pb-1">
            <Button variant="glass" size="sm" icon={<MessageCircle className="w-4 h-4" />} onClick={onMessageClick}>
              Message
            </Button>
            <Button variant="electric" size="sm" icon={<PhoneIcon className="w-4 h-4" />} onClick={() => onCallClick?.('audio')}>
              Call
            </Button>
            <button className="w-8 h-8 glass rounded-xl flex items-center justify-center text-white/40 hover:text-white transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Edit button (own profile) */}
        {isOwn && (
          <Button variant="glass" size="sm" icon={<Edit3 className="w-3.5 h-3.5" />} onClick={onEditClick} className="mb-1">
            Edit Profile
          </Button>
        )}
      </div>

      {/* ── Identity ─────────────────────────────────────────────────── */}
      <div className="px-5 space-y-1 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="font-display text-xl font-bold text-white">{user.displayName}</h1>

          {user.verificationLevel === 'blue' && (
            <Badge variant="verified" dot>Verified</Badge>
          )}
          {(user as any).nickname && (
            <span className="text-sm text-white/40 font-body">· "{(user as any).nickname}"</span>
          )}
        </div>

        {/* Unique Contact ID */}
        {user.contactId && (
          <button
            onClick={copyId}
            className="flex items-center gap-1.5 text-sm text-electric/80 hover:text-electric transition-colors font-mono group"
          >
            {user.contactId}
            {copied
              ? <Check className="w-3.5 h-3.5 text-green-400" />
              : <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            }
          </button>
        )}

        {/* Status */}
        <p className={`text-xs font-body ${
          user.status === 'online'
            ? 'text-green-400'
            : user.lastSeen
              ? 'text-white/30'
              : 'text-white/25'
        }`}>
          {user.status === 'online'
            ? 'Online now'
            : user.lastSeen
              ? `Last seen ${new Date(user.lastSeen).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
              : 'Offline'
          }
        </p>
      </div>

      {/* ── Bio ──────────────────────────────────────────────────────── */}
      {user.bio && (
        <div className="px-5 mb-4">
          <div className="glass rounded-2xl p-4">
            <p className="text-sm text-white/65 font-body leading-relaxed">{user.bio}</p>
          </div>
        </div>
      )}

      {/* ── Business Profile Preview ──────────────────────────────────── */}
      {user.businessProfile && (
        <div className="px-5 mb-4">
          <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-electric/10 flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-5 h-5 text-electric" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-semibold text-sm text-white truncate">
                {(user.businessProfile as unknown as BusinessProfile).businessName}
              </p>
              <p className="text-xs text-white/40 font-body">
                {(user.businessProfile as unknown as BusinessProfile).category}
              </p>
            </div>
            {(user.businessProfile as unknown as BusinessProfile).verifiedBadge && (
              <VerifiedBadge size="xs" tooltip={true} />
            )}
          </div>
        </div>
      )}

      {/* ── Contact Info ─────────────────────────────────────────────── */}
      {isOwn && (
        <div className="px-5 mb-4 space-y-2">
          <p className="text-xs font-display font-semibold text-white/35 uppercase tracking-widest">Contact Info</p>
          {user.phone && (
            <div className="flex items-center gap-3 glass rounded-xl px-4 py-3">
              <Phone className="w-4 h-4 text-electric/70 flex-shrink-0" />
              <div>
                <p className="text-sm text-white/80 font-body">{user.phone}</p>
                <p className="text-[10px] text-white/30 font-body">Phone (auth)</p>
              </div>
            </div>
          )}
          {user.email && (
            <div className="flex items-center gap-3 glass rounded-xl px-4 py-3">
              <Mail className="w-4 h-4 text-electric/70 flex-shrink-0" />
              <div>
                <p className="text-sm text-white/80 font-body">{user.email}</p>
                <p className="text-[10px] text-white/30 font-body">Gmail (auth)</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Actions for other users ───────────────────────────────────── */}
      {!isOwn && (
        <div className="px-5 pb-6 space-y-2 mt-2">
          <p className="text-xs font-display font-semibold text-white/35 uppercase tracking-widest mb-3">Actions</p>
          <button
            onClick={() => onCallClick?.('video')}
            className="w-full flex items-center gap-3 glass rounded-2xl px-4 py-3 hover:bg-white/8 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-electric/10 flex items-center justify-center">
              <PhoneIcon className="w-4 h-4 text-electric" />
            </div>
            <div>
              <p className="text-sm font-display font-medium text-white">Video Call</p>
              <p className="text-xs text-white/35 font-body">4K quality available</p>
            </div>
          </button>

          <button className="w-full flex items-center gap-3 glass rounded-2xl px-4 py-3 hover:bg-white/8 transition-colors text-left">
            <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <Lock className="w-4 h-4 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm font-display font-medium text-white">Block User</p>
              <p className="text-xs text-white/35 font-body">Stop all messages and calls</p>
            </div>
          </button>

          <button
            onClick={onReport}
            className="w-full flex items-center gap-3 glass rounded-2xl px-4 py-3 hover:bg-red-500/8 transition-colors text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
              <Flag className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-display font-medium text-red-400">Report User</p>
              <p className="text-xs text-white/35 font-body">AI Guard reviews all reports</p>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
