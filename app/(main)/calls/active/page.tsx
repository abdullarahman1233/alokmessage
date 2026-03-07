'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import CallInterface from '@/components/calls/CallInterface'
import toast from 'react-hot-toast'

export default function ActiveCallPage() {
  const router      = useRouter()
  const params      = useSearchParams()
  const chatId      = params.get('chatId') ?? ''
  const callType    = (params.get('type') ?? 'audio') as 'audio' | 'video'
  const qualityParam = (params.get('quality') ?? 'hd') as 'hd' | '4k'
  const existingRoom = params.get('roomUrl')

  const [roomUrl,   setRoomUrl]   = useState<string | null>(existingRoom)
  const [chatName,  setChatName]  = useState('Call')
  const [loading,   setLoading]   = useState(!existingRoom)

  useEffect(() => {
    if (existingRoom) return

    async function createRoom() {
      setLoading(true)
      const res  = await fetch('/api/calls/create-room', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ chatId, type: callType, quality: qualityParam }),
      })
      const data = await res.json()

      if (!res.ok || !data.roomUrl) {
        toast.error('Could not start call.')
        router.back()
        return
      }

      setRoomUrl(data.roomUrl)
      setLoading(false)
    }

    createRoom()
  }, [chatId, callType, qualityParam, existingRoom, router])

  if (loading || !roomUrl) {
    return (
      <div className="fixed inset-0 bg-midnight-950 flex flex-col items-center justify-center gap-4 z-50">
        <div className="w-12 h-12 border-2 border-white/15 border-t-electric rounded-full animate-spin" />
        <p className="text-white/50 font-body text-sm">Connecting to secure call server…</p>
      </div>
    )
  }

  return (
    <CallInterface
      roomUrl={roomUrl}
      callType={callType}
      quality={qualityParam}
      chatName={chatName}
      onEnd={() => router.push(`/chat/${chatId}`)}
    />
  )
}
