import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Phone, Video, Clock, PhoneMissed } from 'lucide-react'
import { format } from 'date-fns'

export default async function CallsPage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  const { data: calls } = await supabase
    .from('calls')
    .select('*')
    .contains('participants', [session!.user.id])
    .order('createdAt', { ascending: false })
    .limit(30)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-white/8">
        <h2 className="font-display text-xl font-bold text-white">Calls</h2>
        <p className="text-white/40 text-sm mt-0.5 font-body">HD Audio · 4K Video · Group Sync</p>
      </div>

      {/* Call Log */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {!calls?.length && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center">
              <Phone className="w-8 h-8 text-white/20" />
            </div>
            <p className="text-white/30 text-sm font-body">No calls yet</p>
          </div>
        )}

        {calls?.map((call) => {
          const isMissed  = call.status === 'missed'
          const isVideo   = call.type   === 'video'
          const isIncoming = call.initiatorId !== session!.user.id
          const duration  = call.duration
            ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s`
            : null

          return (
            <div key={call.id} className="glass-card rounded-2xl p-4 flex items-center gap-4 hover:border-white/20 transition-all cursor-pointer">
              {/* Icon */}
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isMissed ? 'bg-red-500/15' : 'bg-electric/10'
              }`}>
                {isMissed
                  ? <PhoneMissed className="w-5 h-5 text-red-400" />
                  : isVideo
                    ? <Video className="w-5 h-5 text-electric" />
                    : <Phone className="w-5 h-5 text-electric" />
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`font-display font-semibold text-sm truncate ${isMissed ? 'text-red-400' : 'text-white'}`}>
                  {isIncoming ? 'Incoming' : 'Outgoing'} {isVideo ? 'Video' : 'Voice'} Call
                </p>
                <div className="flex items-center gap-2 text-xs text-white/40 mt-0.5 font-body">
                  <Clock className="w-3 h-3" />
                  {format(new Date(call.createdAt), 'MMM d, h:mm a')}
                  {duration && <span>· {duration}</span>}
                  {call.quality === '4k' && <span className="text-electric font-semibold">4K</span>}
                </div>
              </div>

              {/* Call back */}
              <button className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                isVideo
                  ? 'hover:bg-electric/15 text-electric/60 hover:text-electric'
                  : 'hover:bg-white/8 text-white/40 hover:text-white'
              }`}>
                {isVideo ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
