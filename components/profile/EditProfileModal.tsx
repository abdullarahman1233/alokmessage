'use client'

import { useState, useRef } from 'react'
import { Camera, User, FileText, AtSign, Image as ImageIcon } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { supabaseBrowser } from '@/lib/supabase'
import { uploadMedia } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import toast from 'react-hot-toast'
import type { User as UserType } from '@/types'

interface Props {
  open:     boolean
  onClose:  () => void
  user:     UserType
  onUpdate: (updated: Partial<UserType>) => void
}

export default function EditProfileModal({ open, onClose, user, onUpdate }: Props) {
  const supabase         = supabaseBrowser()
  const avatarInputRef   = useRef<HTMLInputElement>(null)
  const coverInputRef    = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    displayName: user.displayName ?? '',
    nickname:    (user as any).nickname ?? '',
    bio:         user.bio ?? '',
  })
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar ?? null)
  const [coverPreview,  setCoverPreview]  = useState<string | null>((user as any).coverPhoto ?? null)
  const [avatarFile,    setAvatarFile]    = useState<File | null>(null)
  const [coverFile,     setCoverFile]     = useState<File | null>(null)
  const [loading,       setLoading]       = useState(false)

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  function handleCoverSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    if (!form.displayName.trim()) { toast.error('Display name cannot be empty.'); return }
    setLoading(true)

    let avatarUrl = user.avatar
    let coverUrl  = (user as any).coverPhoto

    if (avatarFile) {
      const url = await uploadMedia(avatarFile, 'avatars', `${user.id}/avatar-${uuidv4()}`)
      if (url) avatarUrl = url
    }

    if (coverFile) {
      const url = await uploadMedia(coverFile, 'avatars', `${user.id}/cover-${uuidv4()}`)
      if (url) coverUrl = url
    }

    const updates: Record<string, unknown> = {
      displayName: form.displayName.trim(),
      nickname:    form.nickname.trim() || null,
      bio:         form.bio.trim() || null,
      avatar:      avatarUrl,
      coverPhoto:  coverUrl,
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)

    setLoading(false)

    if (error) {
      toast.error('Failed to save profile.')
      return
    }

    toast.success('Profile updated!')
    onUpdate(updates as Partial<UserType>)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Profile" subtitle="Changes are saved immediately" size="md">
      <div className="space-y-5 mt-4">

        {/* Cover Photo */}
        <div>
          <p className="text-xs font-display font-semibold text-white/50 uppercase tracking-widest mb-2">Cover Photo</p>
          <div
            className="relative h-28 rounded-2xl overflow-hidden cursor-pointer group"
            onClick={() => coverInputRef.current?.click()}
          >
            {coverPreview ? (
              <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full glass flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-white/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverSelect} />
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
            <Avatar src={avatarPreview} name={form.displayName || 'U'} size="xl" />
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <p className="text-sm font-display font-medium text-white/80">Profile Photo</p>
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="text-xs text-electric hover:underline font-body mt-0.5"
            >
              Upload new photo
            </button>
          </div>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
        </div>

        {/* Fields */}
        <Input
          label="Display Name"
          value={form.displayName}
          onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          placeholder="Your full name"
          icon={<User className="w-4 h-4" />}
          maxLength={40}
        />

        <Input
          label="Nickname (optional)"
          value={form.nickname}
          onChange={(e) => setForm({ ...form, nickname: e.target.value })}
          placeholder="What friends call you"
          icon={<AtSign className="w-4 h-4" />}
          hint='Shown as "DisplayName · Nickname" on your profile'
          maxLength={20}
        />

        <Textarea
          label="Bio"
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          placeholder="Tell people a bit about yourself…"
          rows={3}
          maxLength={160}
          hint={`${form.bio.length}/160 characters`}
        />

        {/* Permanent ID notice */}
        <div className="glass rounded-xl p-3 flex items-start gap-3">
          <AtSign className="w-4 h-4 text-electric/70 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-display font-semibold text-white/60">
              Your Contact ID: <span className="text-electric font-mono">{user.contactId ?? user.phone ?? 'N/A'}</span>
            </p>
            <p className="text-[10px] text-white/30 font-body mt-0.5">
              This identifier is permanent and cannot be changed.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="glass"   fullWidth onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" fullWidth onClick={handleSave} loading={loading}>Save Changes</Button>
        </div>
      </div>
    </Modal>
  )
}
