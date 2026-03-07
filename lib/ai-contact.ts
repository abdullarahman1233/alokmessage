import { supabaseBrowser } from './supabase'
import type { Chat, Message } from '@/types'

// ─── AI Contact Constants ─────────────────────────────────────────────────────

export const AI_CONTACT_ID     = 'ai-gemini-system-contact'
export const AI_CONTACT_NUMBER = process.env.NEXT_PUBLIC_AI_NUMBER ?? '+8801643435122'

export const AI_CONTACT_PROFILE = {
  id:                AI_CONTACT_ID,
  displayName:       'Gemini 3 Pro (Official)',
  phone:             AI_CONTACT_NUMBER,
  contactId:         '#0000',
  avatar:            '/assets/ai/gemini-3-pro-luxe.png',
  isVerified:        true,
  verificationLevel: 'blue' as const,
  status:            'online'  as const,
  isBanned:          false,
  isAiContact:       true,
  statusLabel:       'Ultra-Fast AI Assistant — Powered by Gemini 3 Pro',
  bio:               'Personal AI assistant, security analyst, knowledge companion. No limits.',
  authMethod:        'system' as const,
  role:              'system' as const,
  createdAt:         '2026-01-01T00:00:00Z',
}

// ─── Find or Create AI Chat ───────────────────────────────────────────────────

export async function getOrCreateAiChat(userId: string): Promise<Chat | null> {
  const supabase = supabaseBrowser()

  // Search for existing DM with AI contact
  const { data: existing } = await supabase
    .from('chats')
    .select('*')
    .contains('participants', [userId, AI_CONTACT_ID])
    .eq('isGroup', false)
    .single()

  if (existing) return existing as Chat

  // Create the AI DM chat
  const { data: chat, error } = await supabase
    .from('chats')
    .insert({
      isGroup:         false,
      name:            'Gemini 3 Pro (Official)',
      avatar:          '/assets/ai/gemini-3-pro-luxe.png',
      participants:    [userId, AI_CONTACT_ID],
      lastActivity:    new Date().toISOString(),
      isMuted:         false,
      isArchived:      false,
      isPinned:        true,    // Always pinned at top
      unreadCount:     0,
      allowScreenshot: true,
      isAiChat:        true,
      createdAt:       new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('[AI Contact] Failed to create chat:', error.message)
    return null
  }

  // Insert welcome message from AI
  await supabase.from('messages').insert({
    chat_id:   chat.id,
    senderId:  AI_CONTACT_ID,
    content:   `👋 Hello! I'm **Gemini 3 Pro**, your official AI assistant on Alok Message.\n\nI can help you with:\n• Questions in any language\n• Writing, coding, analysis, math\n• Understanding security threats\n• Real-time reasoning — no message limits\n\nJust send me a message to get started!`,
    type:      'text',
    status:    'delivered',
    isDeleted: false,
    isEdited:  false,
    createdAt: new Date().toISOString(),
  })

  return chat as Chat
}

// ─── Send message to AI and get reply ────────────────────────────────────────

export interface AiChatHistoryItem {
  role:    'user' | 'model'
  content: string
}

export async function sendToAiContact(
  chatId:  string,
  message: string,
  history: AiChatHistoryItem[] = []
): Promise<{ reply: string; error?: string }> {
  try {
    const res = await fetch('/api/chat/ai-contact', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ chatId, message, history }),
    })

    if (!res.ok) {
      const err = await res.json()
      return { reply: '', error: err.error ?? 'AI request failed.' }
    }

    const data = await res.json()
    return { reply: data.reply }
  } catch {
    return { reply: '', error: 'Network error. Please try again.' }
  }
}

// ─── Stream message to AI (SSE) ───────────────────────────────────────────────

export async function streamToAiContact(
  message:   string,
  history:   AiChatHistoryItem[],
  onChunk:   (text: string) => void,
  onDone:    (fullText: string) => void,
  onError:   (err: string) => void,
): Promise<void> {
  try {
    const res = await fetch('/api/chat/ai-contact', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ message, history }),
    })

    if (!res.ok || !res.body) {
      onError('Stream failed to start.')
      return
    }

    const reader  = res.body.getReader()
    const decoder = new TextDecoder()
    let fullText  = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const lines = decoder.decode(value).split('\n')
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const payload = line.slice(6)
        if (payload === '[DONE]') { onDone(fullText); return }
        try {
          const { text, error } = JSON.parse(payload)
          if (error) { onError(error); return }
          if (text)  { fullText += text; onChunk(text) }
        } catch {
          // malformed chunk — skip
        }
      }
    }

    onDone(fullText)
  } catch (err) {
    onError(err instanceof Error ? err.message : 'Unknown stream error.')
  }
}

// ─── Build history from messages ──────────────────────────────────────────────

export function buildGeminiHistory(
  messages: Message[],
  currentUserId: string,
  limit = 20              // last N messages for context window
): AiChatHistoryItem[] {
  return messages
    .slice(-limit)
    .filter((m) => !m.isDeleted && m.type === 'text')
    .map((m) => ({
      role:    m.senderId === currentUserId ? 'user' : 'model',
      content: m.content,
    }))
}
