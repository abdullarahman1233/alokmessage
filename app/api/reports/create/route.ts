import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { scanMessage } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { reportedUserId, chatId, messageId, reason, description } = await req.json()

  // If a message ID was provided, AI-scan it immediately
  let aiVerdict = null
  if (messageId) {
    const { data: msg } = await supabaseAdmin
      .from('messages')
      .select('content')
      .eq('id', messageId)
      .single()

    if (msg?.content) {
      aiVerdict = await scanMessage(msg.content)
    }
  }

  const { data: report, error } = await supabaseAdmin.from('reports').insert({
    reporterId:      session.user.id,
    reportedUserId,
    chatId:          chatId ?? null,
    messageId:       messageId ?? null,
    reason,
    description:     description ?? null,
    status:          aiVerdict ? 'ai_reviewing' : 'pending',
    aiVerdict:       aiVerdict ?? null,
    createdAt:       new Date().toISOString(),
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If AI flagged it as critical, auto-action
  if (aiVerdict && (aiVerdict.action === 'block' || aiVerdict.action === 'escalate')) {
    await supabaseAdmin.from('reports').update({
      status:      'action_taken',
      resolvedAt:  new Date().toISOString(),
      adminNotes:  `Auto-actioned by Alok Guard. Confidence: ${aiVerdict.confidence}%. Reasons: ${aiVerdict.reasons.join(', ')}`,
    }).eq('id', report.id)
  }

  return NextResponse.json({ report })
}
