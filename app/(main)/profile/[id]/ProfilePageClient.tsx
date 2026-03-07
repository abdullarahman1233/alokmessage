'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import ProfileView from '@/components/profile/ProfileView'
import EditProfileModal from '@/components/profile/EditProfileModal'
import ReportModal from '@/components/chat/ReportModal'
import { supabaseBrowser } from '@/lib/supabase'
import toast from 'react-hot-toast'
import type { User } from '@/types'

interface Props {
  user:          User
  isOwn:         boolean
  currentUserId: string
}

export default function ProfilePageClient({ user: initialUser, isOwn, currentUserId }: Props) {
  const router             = useRouter()
  const supabase           = supabaseBrowser()
  const [user, setUser]    = useState<User>(initialUser)
  const [editOpen, setEditOpen]     = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

  async function handleMessage() {
    // Find or create DM chat
    const { data: existing } = await supabase
      .from('chats')
      .select('id')
      .contains('participants', [currentUserId, user.id])
      .eq('isGroup', false)
      .single()

    if (existing) {
      router.push(`/chat/${existing.id}`)
      return
    }

    const { data: newChat, error } = await supabase.from('chats').insert({
      isGroup:      false,
      participants: [currentUserId, user.id],
      lastActivity: new Date().toISOString(),
      isMuted:      false,
      isArchived:   false,
      isPinned:     false,
      unreadCount:  0,
      allowScreenshot: true,
      createdAt:    new Date().toISOString(),
    }).select().single()

    if (error || !newChat) { toast.error('Could not start conversation.'); return }
    router.push(`/chat/${newChat.id}`)
  }

  function handleCall(type: 'audio' | 'video') {
    handleMessage().then(() => {
      // Call will be initiated from the chat window
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Back nav */}
      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-white/8 flex-shrink-0">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-xl hover:bg-white/8 flex items-center justify-center text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="font-display font-semibold text-white text-sm">Profile</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <ProfileView
          user={user}
          isOwn={isOwn}
          onMessageClick={handleMessage}
          onCallClick={handleCall}
          onEditClick={() => setEditOpen(true)}
          onReport={() => setReportOpen(true)}
        />
      </div>

      {/* Edit modal */}
      {isOwn && (
        <EditProfileModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          user={user}
          onUpdate={(updated) => setUser((prev) => ({ ...prev, ...updated }))}
        />
      )}

      {/* Report modal */}
      {!isOwn && (
        <ReportModal
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          reportedUserId={user.id}
          reportedName={user.displayName}
          reporterId={currentUserId}
        />
      )}
    </div>
  )
}
