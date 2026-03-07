import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import ChatWindow from '@/components/chat/ChatWindow'
import AiChatWindow from '@/components/ai/AiChatWindow'
import { AI_CONTACT_ID } from '@/lib/ai-contact'

interface Props { params: { id: string } }

export default async function ChatPage({ params }: Props) {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) notFound()

  // Fetch chat — allow AI system chat (participants may include AI_CONTACT_ID)
  const { data: chat } = await supabase
    .from('chats')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!chat) notFound()

  // Security: user must be a real participant
  const isParticipant = chat.participants?.includes(session.user.id)
  if (!isParticipant) notFound()

  // Fetch initial messages (last 50)
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', params.id)
    .eq('isDeleted', false)
    .order('createdAt', { ascending: true })
    .limit(50)

  // ── AI Chat branch ────────────────────────────────────────────────────
  const isAiChat = chat.isAiChat || chat.participants?.includes(AI_CONTACT_ID)

  if (isAiChat) {
    return (
      <AiChatWindow
        chat={chat}
        initialMessages={messages ?? []}
        currentUserId={session.user.id}
      />
    )
  }

  // ── Regular chat branch ───────────────────────────────────────────────
  const { data: participants } = await supabase
    .from('users')
    .select('id, displayName, avatar, status, isVerified, verificationLevel, contactId, businessProfile')
    .in('id', chat.participants)

  return (
    <ChatWindow
      chat={chat}
      initialMessages={messages ?? []}
      participants={participants ?? []}
      currentUserId={session.user.id}
    />
  )
}
