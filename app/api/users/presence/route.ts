import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// ─── POST — called by navigator.sendBeacon on page close ─────────────────────
// Sets user status to 'offline' with current lastSeen timestamp.
// No auth check needed here (beacon fires after session may be gone),
// but we validate the userId exists before updating.

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body?.userId) return new NextResponse(null, { status: 204 })

    // Verify user exists before writing (prevents spoofed beacons)
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', body.userId)
      .single()

    if (!user) return new NextResponse(null, { status: 204 })

    await supabaseAdmin
      .from('users')
      .update({
        status:   'offline',
        lastSeen: new Date().toISOString(),
      })
      .eq('id', body.userId)

    return new NextResponse(null, { status: 204 })
  } catch {
    return new NextResponse(null, { status: 204 })
  }
}

// ─── PATCH — heartbeat (called every 30s from useOwnPresence) ─────────────────

export async function PATCH(req: NextRequest) {
  try {
    const { userId, status } = await req.json()
    if (!userId || !status) return NextResponse.json({ ok: false }, { status: 400 })

    await supabaseAdmin
      .from('users')
      .update({
        status,
        lastSeen: new Date().toISOString(),
      })
      .eq('id', userId)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
