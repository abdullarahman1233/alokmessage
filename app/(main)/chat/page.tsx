import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import ChatList from '@/components/chat/ChatList'
import EmptyChatState from '@/components/chat/EmptyChatState'

export default async function ChatsPage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  const { data: chats } = await supabase
    .from('chats')
    .select(`
      *,
      messages(id, content, type, createdAt, senderId)
    `)
    .contains('participants', [session!.user.id])
    .order('lastActivity', { ascending: false })
    .limit(50)

  return (
    <div className="flex h-full">
      {/* On desktop this is already inside the grid — show the welcome state */}
      <div className="hidden md:flex flex-1 items-center justify-center">
        <EmptyChatState />
      </div>

      {/* On mobile, show the chat list inline */}
      <div className="flex md:hidden flex-1">
        <ChatList chats={chats ?? []} currentUserId={session!.user.id} />
      </div>
    </div>
  )
}
