'use client'

import { useState, useEffect } from 'react'
import { Shield, Zap, AlertTriangle, XCircle, CheckCircle, Activity, Eye } from 'lucide-react'
import { supabaseBrowser } from '@/lib/supabase'
import { format } from 'date-fns'
import type { AiScanResult, ThreatLevel } from '@/types'

interface GuardEvent {
  id:          string
  userId:      string
  userName:    string
  messageId:   string
  scanResult:  AiScanResult
  actionTaken: string
  createdAt:   string
}

const THREAT_CONFIG: Record<ThreatLevel, { label: string; color: string; icon: typeof Shield }> = {
  safe:       { label: 'Safe',       color: 'text-green-400',  icon: CheckCircle    },
  suspicious: { label: 'Suspicious', color: 'text-yellow-400', icon: AlertTriangle  },
  danger:     { label: 'Danger',     color: 'text-orange-400', icon: AlertTriangle  },
  critical:   { label: 'Critical',   color: 'text-red-400',    icon: XCircle        },
}

export default function AiGuard() {
  const supabase = supabaseBrowser()
  const [events, setEvents]       = useState<GuardEvent[]>([])
  const [stats,  setStats]        = useState({ total: 0, blocked: 0, escalated: 0, today: 0 })
  const [loading, setLoading]     = useState(true)
  const [liveMode, setLiveMode]   = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('ai_guard_events')
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(50)
      setEvents(data ?? [])

      const { count: total }     = await supabase.from('ai_guard_events').select('*', { count: 'exact', head: true })
      const { count: blocked }   = await supabase.from('ai_guard_events').select('*', { count: 'exact', head: true }).in('actionTaken', ['block', 'escalate'])
      const { count: escalated } = await supabase.from('ai_guard_events').select('*', { count: 'exact', head: true }).eq('actionTaken', 'escalate')
      const todayStart = new Date(); todayStart.setHours(0,0,0,0)
      const { count: today }     = await supabase.from('ai_guard_events').select('*', { count: 'exact', head: true }).gte('createdAt', todayStart.toISOString())

      setStats({ total: total ?? 0, blocked: blocked ?? 0, escalated: escalated ?? 0, today: today ?? 0 })
      setLoading(false)
    }

    load()
  }, [supabase])

  // Live subscription
  useEffect(() => {
    if (!liveMode) return

    const channel = supabase
      .channel('ai-guard-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ai_guard_events' }, (payload) => {
        setEvents((prev) => [payload.new as GuardEvent, ...prev].slice(0, 50))
        setStats((prev) => ({ ...prev, total: prev.total + 1, today: prev.today + 1 }))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [liveMode, supabase])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-electric" />
          <h3 className="font-display font-bold text-white">Alok Guard Feed</h3>
          {liveMode && (
            <span className="flex items-center gap-1 text-[10px] font-display font-bold text-green-400 bg-green-400/10 border border-green-400/30 rounded-full px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              LIVE
            </span>
          )}
        </div>
        <button
          onClick={() => setLiveMode(!liveMode)}
          className={`flex items-center gap-1.5 text-xs font-display font-semibold px-3 py-1.5 rounded-lg transition-all ${
            liveMode ? 'bg-electric/15 text-electric' : 'glass text-white/40'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          {liveMode ? 'Live On' : 'Live Off'}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Scans', value: stats.total,     color: 'text-white'       },
          { label: 'Blocked',     value: stats.blocked,   color: 'text-orange-400'  },
          { label: 'Escalated',   value: stats.escalated, color: 'text-red-400'     },
          { label: 'Today',       value: stats.today,     color: 'text-electric'    },
        ].map(({ label, value, color }) => (
          <div key={label} className="admin-card text-center">
            <p className={`font-display text-xl font-bold ${color}`}>{value.toLocaleString()}</p>
            <p className="text-xs text-white/40 font-body mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Event feed */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/8 flex items-center gap-2">
          <Eye className="w-4 h-4 text-white/40" />
          <span className="text-sm font-display font-semibold text-white/70">Recent Events</span>
        </div>

        <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
          {loading && Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-4 py-3 flex gap-3">
              <div className="w-8 h-8 rounded-lg shimmer flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 shimmer rounded" />
                <div className="h-2 w-2/3 shimmer rounded" />
              </div>
            </div>
          ))}

          {!loading && events.length === 0 && (
            <div className="px-4 py-8 text-center text-white/25 text-sm font-body">
              No Guard events yet. Platform is clean. ✓
            </div>
          )}

          {!loading && events.map((event) => {
            const threat = event.scanResult?.threatLevel ?? 'safe'
            const cfg    = THREAT_CONFIG[threat]
            const Icon   = cfg.icon

            return (
              <div key={event.id} className="px-4 py-3 flex items-start gap-3 hover:bg-white/3 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  threat === 'critical'   ? 'bg-red-500/15'    :
                  threat === 'danger'     ? 'bg-orange-500/15' :
                  threat === 'suspicious' ? 'bg-yellow-500/15' : 'bg-green-500/15'
                }`}>
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-display font-semibold text-white/80 truncate">{event.userName}</span>
                    <span className="text-[10px] text-white/30 font-mono flex-shrink-0 ml-2">
                      {format(new Date(event.createdAt), 'HH:mm:ss')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-display font-bold uppercase threat-${threat} px-1.5 py-0.5 rounded border`}>
                      {cfg.label}
                    </span>
                    <span className="text-xs text-white/40 font-body truncate">
                      {event.scanResult?.reasons?.[0] ?? 'Monitored'}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/25 font-body mt-0.5">
                    Action: <span className="font-semibold text-white/40">{event.actionTaken}</span>
                    {' · '}Confidence: <span className="font-semibold text-white/40">{event.scanResult?.confidence}%</span>
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
