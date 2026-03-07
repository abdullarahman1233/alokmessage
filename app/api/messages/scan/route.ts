import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { scanMessage, resolvePenalty } from '@/lib/gemini'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { messageId, content, mediaUrls } = await req.json()
    if (!messageId || !content) {
      return NextResponse.json({ error: 'messageId and content are required' }, { status: 400 })
    }

    // Run AI scan
    const scanResult = await scanMessage(content, mediaUrls)

    // Log to ai_guard_events
    await supabaseAdmin.from('ai_guard_events').insert({
      userId:      session.user.id,
      userName:    session.user.email ?? 'Unknown',
      messageId,
      scanResult,
      actionTaken: scanResult.action,
      createdAt:   new Date().toISOString(),
    })

    // Update message with scan result
    await supabaseAdmin
      .from('messages')
      .update({
        aiScanResult: scanResult,
        ...(scanResult.action === 'block' || scanResult.action === 'escalate'
          ? { isDeleted: true }
          : {}),
      })
      .eq('id', messageId)

    // Apply penalty if needed
    if (scanResult.action === 'block' || scanResult.action === 'escalate') {
      // Count prior offenses
      const { count: priorOffenses } = await supabaseAdmin
        .from('ai_guard_events')
        .select('*', { count: 'exact', head: true })
        .eq('userId', session.user.id)
        .in('actionTaken', ['block', 'escalate'])

      const { banLevel, reason } = resolvePenalty(scanResult, priorOffenses ?? 0)

      if (banLevel) {
        const banDays: Record<string, number | null> = {
          readonly:       null,
          suspended_7d:   7,
          suspended_15d:  15,
          suspended_30d:  30,
          permanent:      null,
        }
        const days = banDays[banLevel]
        const banUntil = days
          ? new Date(Date.now() + days * 86400_000).toISOString()
          : null

        await supabaseAdmin
          .from('users')
          .update({ isBanned: true, banLevel, banUntil })
          .eq('id', session.user.id)

        await supabaseAdmin.from('ban_records').insert({
          userId:        session.user.id,
          level:         banLevel,
          reason,
          issuedBy:      'ai',
          aiConfidence:  scanResult.confidence,
          createdAt:     new Date().toISOString(),
          expiresAt:     banUntil,
        })
      }
    }

    return NextResponse.json({ scanResult })
  } catch (err) {
    console.error('[AI Guard API] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
