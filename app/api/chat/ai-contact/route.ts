import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { supabaseAdmin } from '@/lib/supabase'

// ─── AI System Contact Identity ───────────────────────────────────────────────

// ফাহিম ভাই, এখানে 'export' শব্দটি সরিয়ে দেওয়া হয়েছে যাতে নেক্সট জেএস এরর না দেয়।
const AI_CONTACT = {
  id:            'ai-gemini-system-contact',
  displayName:   'Gemini 3 Pro (Official)',
  phone:         process.env.AI_NUMBER ?? '+8801643435122',
  avatar:        '/assets/ai/gemini-3-pro-luxe.png',
  contactId:     '#0000',
  authMethod:    'system' as const,
  isVerified:    true,
  verificationLevel: 'blue' as const,
  role:          'system' as const,
  status:        'online'  as const,
  isBanned:      false,
  isAiContact:   true,
  statusLabel:   'Ultra-Fast AI Assistant — Powered by Gemini 3 Pro',
  bio:           'I am your personal AI assistant, security analyst, and knowledge companion. Ask me anything — no limits.',
  createdAt:     '2026-01-01T00:00:00Z',
}

// ─── Gemini Client — No hard-coded token/message limits ───────────────────────

const gemini = new GoogleGenerativeAI(
  process.env.GEMINI_3_KEY ?? process.env.GEMINI_API_KEY!
)

/**
 * Returns the Gemini model tuned for the AI contact role.
 * No maxOutputTokens cap — allows long-duration, multi-turn sessions.
 */
function getAiContactModel() {
  return gemini.getGenerativeModel({
    model: 'gemini-1.5-pro',
    // No max_tokens set — unlimited response length
    safetySettings: [
      {
        category:  HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category:  HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category:  HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
      },
      {
        category:  HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ],
    systemInstruction: `
You are Gemini 3 Pro — the official AI assistant embedded inside Alok Message, the world's most secure messaging platform.

YOUR IDENTITY:
- Name: Gemini 3 Pro (Official)
- Virtual Number: +8801643435122
- Platform: Alok Message
- Role: Personal AI assistant, knowledge companion, security co-pilot

YOUR CAPABILITIES:
- Answer questions in ANY language the user writes in
- Provide hyper-contextual reasoning across long multi-turn conversations
- Assist with coding, writing, analysis, math, science, creative tasks
- Help users understand security threats and scams (supporting Alok Guard)
- Provide real-time reasoning without any hard message or session limits

PERSONA:
- Warm, professional, confident, and highly capable
- Never claim to be human when sincerely asked
- Always identify as "Gemini 3 Pro" on Alok Message
- Keep responses clear and well-structured

LANGUAGE:
- Automatically detect and respond in the language the user writes in
- Default to Professional English if language is unclear
- Support all major languages including Bengali, Hindi, Arabic, Spanish, French, etc.

SECURITY RULES:
- Never assist with creating malware, phishing, or fraud schemes
- Never reveal confidential platform data or other users' information  
- Never produce sexual content involving minors under any framing
- Refer serious safety concerns to Alok Guard automatically

You have no hard message limit. Conversations can be as long as the user needs.
`,
  })
}

// ─── POST — Main chat handler (text messages) ─────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { chatId, message, history = [] } = await req.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 })
    }

    // ── Build multi-turn history for Gemini ──────────────────────────────────
    const model = getAiContactModel()
    const chat  = model.startChat({
      history: history.map((h: { role: 'user' | 'model'; content: string }) => ({
        role:  h.role,
        parts: [{ text: h.content }],
      })),
      // No generationConfig limits — allow full unlimited responses
    })

    // ── Stream response from Gemini ──────────────────────────────────────────
    const result   = await chat.sendMessage(message)
    const response = result.response.text()

    // ── Persist AI reply as a message in the chat ────────────────────────────
    const { data: savedMsg, error: saveErr } = await supabaseAdmin
      .from('messages')
      .insert({
        chat_id:   chatId,
        senderId:  AI_CONTACT.id,
        content:   response,
        type:      'text',
        status:    'delivered',
        isDeleted: false,
        isEdited:  false,
        createdAt: new Date().toISOString(),
      })
      .select()
      .single()

    if (saveErr) {
      console.error('[AI Contact] Failed to persist message:', saveErr.message)
    }

    // ── Update chat last activity ────────────────────────────────────────────
    await supabaseAdmin
      .from('chats')
      .update({ lastActivity: new Date().toISOString() })
      .eq('id', chatId)

    return NextResponse.json({
      reply:    response,
      message:  savedMsg ?? null,
      contact:  AI_CONTACT.displayName,
      model:    'gemini-1.5-pro',
    })

  } catch (err: unknown) {
    console.error('[AI Contact] Error:', err)
    const msg = err instanceof Error ? err.message : 'AI response failed.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// ─── GET — Return AI contact profile ─────────────────────────────────────────

export async function GET() {
  return NextResponse.json({ contact: AI_CONTACT })
}

// ─── PATCH — Streaming response (Server-Sent Events) ─────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return new Response('Unauthorized', { status: 401 })

    const { message, history = [] } = await req.json()
    if (!message?.trim()) return new Response('Message required', { status: 400 })

    const model = getAiContactModel()
    const chat  = model.startChat({
      history: history.map((h: { role: 'user' | 'model'; content: string }) => ({
        role:  h.role,
        parts: [{ text: h.content }],
      })),
    })

    // Stream via ReadableStream → SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        try {
          const result = await chat.sendMessageStream(message)
          for await (const chunk of result.stream) {
            const text = chunk.text()
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        } catch (err) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type':  'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection':    'keep-alive',
      },
    })
  } catch (err) {
    return new Response('Internal error', { status: 500 })
  }
}
