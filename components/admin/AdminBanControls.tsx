'use client'

import { useState } from 'react'
import { Ban, Search, Shield, AlertTriangle, CheckCircle } from 'lucide-react'
import { supabaseBrowser } from '@/lib/supabase'
import toast from 'react-hot-toast'
import type { BanLevel } from '@/types'

const BAN_LEVELS: Array<{ value: BanLevel; label: string; color: string }> = [
  { value: 'readonly',      label: 'Read-Only',      color: 'text-yellow-400'  },
  { value: 'suspended_7d',  label: '7-Day Suspend',  color: 'text-orange-400'  },
  { value: 'suspended_15d', label: '15-Day Suspend', color: 'text-red-400'     },
  { value: 'suspended_30d', label: '30-Day Suspend', color: 'text-red-500'     },
  { value: 'permanent',     label: 'Permanent Ban',  color: 'text-red-600'     },
]

const BAN_DURATIONS: Record<BanLevel, number | null> = {
  readonly:       null,
  suspended_7d:   7,
  suspended_15d:  15,
  suspended_30d:  30,
  permanent:      null,
}

export default function AdminBanControls() {
  const supabase               = supabaseBrowser()
  const [search,   setSearch]  = useState('')
  const [userId,   setUserId]  = useState('')
  const [banLevel, setBanLevel] = useState<BanLevel>('suspended_7d')
  const [reason,   setReason]  = useState('')
  const [loading,  setLoading] = useState(false)
  const [foundUser, setFoundUser] = useState<{ id: string; displayName: string; phone?: string; isBanned: boolean } | null>(null)

  async function searchUser() {
    if (!search.trim()) return
    setLoading(true)

    const { data } = await supabase
      .from('users')
      .select('id, displayName, phone, email, contactId, isBanned, banLevel')
      .or(`phone.eq.${search},email.eq.${search},contactId.eq.${search},displayName.ilike.%${search}%`)
      .limit(1)
      .single()

    setFoundUser(data ?? null)
    if (data) setUserId(data.id)
    else toast.error('User not found.')
    setLoading(false)
  }

  async function applyBan() {
    if (!userId || !reason.trim()) {
      toast.error('User ID and reason are required.')
      return
    }
    setLoading(true)

    const days = BAN_DURATIONS[banLevel]
    const banUntil = days
      ? new Date(Date.now() + days * 86400_000).toISOString()
      : null

    const { error } = await supabase
      .from('users')
      .update({
        isBanned:  true,
        banLevel,
        banUntil,
      })
      .eq('id', userId)

    if (!error) {
      // Log to audit
      await supabase.from('audit_logs').insert({
        adminId:    (await supabase.auth.getUser()).data.user?.id,
        action:     `Manual ban applied: ${banLevel}`,
        targetId:   userId,
        targetType: 'user',
        metadata:   { reason, banLevel, banUntil },
        createdAt:  new Date().toISOString(),
      })
      toast.success(`Ban applied: ${BAN_LEVELS.find((b) => b.value === banLevel)?.label}`)
      setFoundUser(null)
      setUserId('')
      setSearch('')
      setReason('')
    } else {
      toast.error('Failed to apply ban.')
    }
    setLoading(false)
  }

  async function liftBan() {
    if (!userId) return
    setLoading(true)

    await supabase.from('users').update({ isBanned: false, banLevel: null, banUntil: null }).eq('id', userId)
    await supabase.from('audit_logs').insert({
      adminId:    (await supabase.auth.getUser()).data.user?.id,
      action:     'Manual ban lifted',
      targetId:   userId,
      targetType: 'user',
      createdAt:  new Date().toISOString(),
    })

    toast.success('Ban lifted.')
    setFoundUser(null)
    setUserId('')
    setSearch('')
    setLoading(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Ban className="w-5 h-5 text-red-400" />
        <h3 className="font-display font-bold text-white">Manual Ban Controls</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Search */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-display font-semibold text-white/50 uppercase tracking-widest mb-2">
              Find User
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Phone, email, #ID or name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchUser()}
                className="input-glass flex-1"
              />
              <button onClick={searchUser} disabled={loading} className="btn-glass px-3 flex-shrink-0">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Found user card */}
          {foundUser && (
            <div className={`glass rounded-xl p-4 border ${foundUser.isBanned ? 'border-red-500/30' : 'border-electric/20'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400/15 to-blue-600/15 flex items-center justify-center font-display font-bold text-electric">
                  {foundUser.displayName[0]}
                </div>
                <div>
                  <p className="font-display font-semibold text-white text-sm">{foundUser.displayName}</p>
                  <p className="text-xs text-white/40 font-body">{foundUser.phone}</p>
                </div>
                {foundUser.isBanned
                  ? <AlertTriangle className="w-4 h-4 text-red-400 ml-auto" />
                  : <CheckCircle   className="w-4 h-4 text-green-400 ml-auto" />
                }
              </div>
            </div>
          )}
        </div>

        {/* Ban form */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-display font-semibold text-white/50 uppercase tracking-widest mb-2">
              Penalty Level
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {BAN_LEVELS.map(({ value, label, color }) => (
                <label key={value} className={`flex items-center gap-3 cursor-pointer glass rounded-xl px-3 py-2.5 transition-all ${banLevel === value ? 'border border-white/20 bg-white/5' : 'hover:bg-white/5'}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${banLevel === value ? 'border-electric' : 'border-white/20'}`}>
                    {banLevel === value && <div className="w-2 h-2 rounded-full bg-electric" />}
                  </div>
                  <input type="radio" className="hidden" value={value} checked={banLevel === value} onChange={() => setBanLevel(value)} />
                  <span className={`text-sm font-display font-medium ${color}`}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-display font-semibold text-white/50 uppercase tracking-widest mb-2">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input-glass resize-none"
              rows={2}
              placeholder="Reason for this action…"
            />
          </div>

          <div className="flex gap-2">
            {foundUser?.isBanned && (
              <button onClick={liftBan} disabled={loading || !userId} className="btn-glass flex-1 text-green-400 border-green-400/20 hover:border-green-400/40 text-sm">
                Lift Ban
              </button>
            )}
            <button onClick={applyBan} disabled={loading || !userId || !reason.trim()} className="flex-1 text-sm font-display font-semibold py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all disabled:opacity-40">
              <Ban className="w-4 h-4 inline mr-1.5" />
              Apply Penalty
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
