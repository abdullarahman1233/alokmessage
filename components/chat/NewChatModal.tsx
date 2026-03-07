'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, UserPlus, Users, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { Badge  } from '@/components/ui/Badge'
import { supabaseBrowser } from '@/lib/supabase'
import toast from 'react-hot-toast'
import type { User } from '@/types'

interface Props {
  open:          boolean
  onClose:       () => void
  currentUserId: string
}

export default function NewChatModal({ open, onClose, currentUserId }: Props) {
  const router = useRouter()
  const supabase = supabaseBrowser()

  const [tab,     setTab]     = useState<'dm' | 'group'>('dm')
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<Partial<User>[]>([])
  const [selected, setSelected] = useState<Partial<User>[]>([])
  const [groupName, setGroupName] = useState('')
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setSearching(true)

    const { data } = await supabase
      .from('users')
      .select('id, displayName, avatar, status, verificationLevel, contactId, phone')
      .or(`displayName.ilike.%${q}%,contactId.ilike.%${q}%,phone.ilike.%${q}%`)
      .neq('id', currentUserId)
      .limit(10)

    setResults(data ?? [])
    setSearching(false)
  }, [supabase, currentUserId])

  async function startDM(targetUser: Partial<User>) {
    setLoading(true)

    // Check existing DM
    const { data: existing } = await supabase
      .from('chats')
      .select('id')
      .contains('participants', [currentUserId, targetUser.id!])
      .eq('isGroup', false)
      .single()

    if (existing) {
      router.push(`/chat/${existing.id}`)
      onClose()
      setLoading(false)
      return
    }

    const { data: chat, error } = await supabase.from('chats').insert({
      isGroup:      false,
      participants: [currentUserId, targetUser.id],
      lastActivity: new Date().toISOString(),
      isMuted:      false,
      isArchived:   false,
      isPinned:     false,
      unreadCount:  0,
      allowScreenshot: true,
      createdAt:    new Date().toISOString(),
    }).select().single()

    setLoading(false)
    if (error || !chat) { toast.error('Could not create conversation.'); return }
    router.push(`/chat/${chat.id}`)
    onClose()
  }

  async function createGroup() {
    if (!groupName.trim())    { toast.error('Group name is required.'); return }
    if (selected.length < 2)  { toast.error('Add at least 2 members.'); return }
    setLoading(true)

    const participants = [currentUserId, ...selected.map((u) => u.id!)]
    const { data: chat, error } = await supabase.from('chats').insert({
      name:         groupName.trim(),
      isGroup:      true,
      participants,
      admins:       [currentUserId],
      lastActivity: new Date().toISOString(),
      isMuted:      false,
      isArchived:   false,
      isPinned:     false,
      unreadCount:  0,
      allowScreenshot: true,
      createdAt:    new Date().toISOString(),
    }).select().single()

    setLoading(false)
    if (error || !chat) { toast.error('Could not create group.'); return }
    toast.success(`Group "${groupName}" created!`)
    router.push(`/chat/${chat.id}`)
    onClose()
  }

  function toggleSelect(user: Partial<User>) {
    setSelected((prev) =>
      prev.some((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user]
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Conversation"
      size="md"
    >
      {/* Tabs */}
      <div className="flex gap-1 glass rounded-xl p-1 mt-4 mb-5">
        {[
          { key: 'dm',    label: 'Direct Message', icon: UserPlus },
          { key: 'group', label: 'New Group',       icon: Users   },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setTab(key as 'dm' | 'group'); setSelected([]); setQuery(''); setResults([]) }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-display font-medium transition-all ${
              tab === key ? 'bg-electric/15 text-electric' : 'text-white/40 hover:text-white/70'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Group name */}
      {tab === 'group' && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Group name…"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="input-glass"
            maxLength={40}
          />
        </div>
      )}

      {/* Selected chips */}
      {tab === 'group' && selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selected.map((u) => (
            <div key={u.id} className="flex items-center gap-1.5 bg-electric/15 border border-electric/25 text-electric rounded-full px-2.5 py-1 text-xs font-display font-semibold">
              {u.displayName}
              <button onClick={() => toggleSelect(u)} className="hover:text-white transition-colors">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
        <input
          type="search"
          placeholder="Search by name, #ID, or phone…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); search(e.target.value) }}
          className="input-glass pl-10"
          autoFocus
        />
      </div>

      {/* Results */}
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {searching && (
          <div className="flex items-center justify-center py-6">
            <div className="w-5 h-5 border-2 border-white/20 border-t-electric rounded-full animate-spin" />
          </div>
        )}

        {!searching && results.length === 0 && query && (
          <p className="text-center text-sm text-white/30 font-body py-6">No users found for "{query}"</p>
        )}

        {!searching && results.length === 0 && !query && (
          <p className="text-center text-sm text-white/25 font-body py-6">
            Search by name, contact ID (#XXXX) or phone number
          </p>
        )}

        {results.map((user) => {
          const isSelected = selected.some((u) => u.id === user.id)
          return (
            <button
              key={user.id}
              onClick={() => tab === 'dm' ? startDM(user) : toggleSelect(user)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${
                isSelected ? 'bg-electric/10 border border-electric/20' : 'hover:bg-white/8'
              }`}
            >
              <Avatar src={user.avatar ?? null} name={user.displayName ?? '?'} size="sm" status={user.status} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-display font-semibold text-white/90 truncate">{user.displayName}</p>
                <p className="text-xs text-white/35 font-mono truncate">{user.contactId ?? user.phone}</p>
              </div>
              {user.verificationLevel === 'blue' && <Badge variant="verified">✓</Badge>}
              {isSelected && <div className="w-5 h-5 rounded-full bg-electric flex items-center justify-center flex-shrink-0">
                <span className="text-midnight-950 text-xs font-bold">✓</span>
              </div>}
            </button>
          )
        })}
      </div>

      {tab === 'group' && selected.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/8">
          <button
            onClick={createGroup}
            disabled={loading || !groupName.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><Users className="w-4 h-4" /> Create Group ({selected.length + 1} members)</>
            }
          </button>
        </div>
      )}
    </Modal>
  )
}
