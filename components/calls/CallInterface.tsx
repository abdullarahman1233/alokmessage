'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  PhoneOff, Mic, MicOff, Video, VideoOff,
  Monitor, Camera, CameraOff, RotateCcw,
  Maximize2, Minimize2, Shield,
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { CallType, CallQuality } from '@/types'

declare global {
  interface Window {
    DailyIframe: {
      createCallObject: (opts?: Record<string, unknown>) => DailyCallObject
    }
  }
}

interface DailyCallObject {
  join: (opts: { url: string; token?: string }) => Promise<void>
  leave: () => Promise<void>
  destroy: () => Promise<void>
  setLocalAudio: (enabled: boolean) => void
  setLocalVideo: (enabled: boolean) => void
  startScreenShare: () => void
  stopScreenShare: () => void
  participants: () => Record<string, unknown>
  on: (event: string, handler: (e: unknown) => void) => void
  off: (event: string, handler: (e: unknown) => void) => void
}

interface Props {
  roomUrl:     string
  callType:    CallType
  quality:     CallQuality
  chatName:    string
  onEnd:       () => void
}

export default function CallInterface({ roomUrl, callType, quality, chatName, onEnd }: Props) {
  const callRef         = useRef<DailyCallObject | null>(null)
  const [joined,        setJoined]        = useState(false)
  const [muted,         setMuted]         = useState(false)
  const [videoOff,      setVideoOff]      = useState(callType === 'audio')
  const [sharing,       setSharing]       = useState(false)
  const [fullscreen,    setFullscreen]    = useState(false)
  const [facing,        setFacing]        = useState<'front' | 'back'>('front')
  const [duration,      setDuration]      = useState(0)
  const [participants,  setParticipants]  = useState(0)

  // Load Daily.co script dynamically
  useEffect(() => {
    if (window.DailyIframe) { initCall(); return }

    const script = document.createElement('script')
    script.src   = 'https://unpkg.com/@daily-co/daily-js'
    script.onload = () => initCall()
    document.head.appendChild(script)

    return () => { document.head.removeChild(script) }
  }, [])

  async function initCall() {
    try {
      const call = window.DailyIframe.createCallObject({
        videoSource: facing === 'front' ? 'user' : 'environment',
      })
      callRef.current = call

      call.on('joined-meeting',  () => { setJoined(true); toast.success('Connected!') })
      call.on('left-meeting',    () => onEnd())
      call.on('participant-joined', () => setParticipants((n) => n + 1))
      call.on('participant-left',   () => setParticipants((n) => Math.max(0, n - 1)))

      await call.join({ url: roomUrl })
    } catch (err) {
      console.error('[CallInterface] Failed to join:', err)
      toast.error('Failed to connect. Please try again.')
    }
  }

  // Duration timer
  useEffect(() => {
    if (!joined) return
    const timer = setInterval(() => setDuration((d) => d + 1), 1000)
    return () => clearInterval(timer)
  }, [joined])

  const formatDuration = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const toggleMute = useCallback(() => {
    callRef.current?.setLocalAudio(muted)  // toggle: if currently muted, enable
    setMuted(!muted)
  }, [muted])

  const toggleVideo = useCallback(() => {
    callRef.current?.setLocalVideo(videoOff)
    setVideoOff(!videoOff)
  }, [videoOff])

  const toggleScreenShare = useCallback(() => {
    if (sharing) {
      callRef.current?.stopScreenShare()
    } else {
      callRef.current?.startScreenShare()
    }
    setSharing(!sharing)
  }, [sharing])

  const flipCamera = useCallback(() => {
    const newFacing = facing === 'front' ? 'back' : 'front'
    setFacing(newFacing)
    // Daily doesn't support live camera flip without rejoining on web — show toast
    toast('Camera flip available on mobile app.', { icon: '📱' })
  }, [facing])

  async function endCall() {
    await callRef.current?.leave()
    await callRef.current?.destroy()
    onEnd()
  }

  return (
    <div className={`fixed inset-0 bg-midnight-950 z-50 flex flex-col ${fullscreen ? 'p-0' : ''}`}>

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
             style={{ background: 'radial-gradient(circle, #00d4ff, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-8 blur-2xl"
             style={{ background: 'radial-gradient(circle, #9c27b0, transparent)' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-6 pb-4">
        <div>
          <h2 className="font-display font-bold text-white">{chatName}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-sm font-mono ${joined ? 'text-electric' : 'text-white/40'}`}>
              {joined ? formatDuration(duration) : 'Connecting…'}
            </span>
            <span className="text-white/30 text-xs font-body">·</span>
            <span className={`text-xs font-display font-bold uppercase ${quality === '4k' ? 'text-electric' : 'text-blue-400'}`}>
              {quality.toUpperCase()}
            </span>
            {participants > 0 && (
              <span className="text-xs text-white/40 font-body">{participants + 1} in call</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 glass rounded-full px-3 py-1.5">
            <Shield className="w-3.5 h-3.5 text-electric" />
            <span className="text-xs font-display font-semibold text-electric">Guard Active</span>
          </div>
          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="w-9 h-9 rounded-xl glass flex items-center justify-center text-white/50 hover:text-white transition-colors"
          >
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 relative flex items-center justify-center mx-6">
        {/* Remote video placeholder */}
        <div className="w-full max-w-3xl aspect-video glass-card rounded-3xl overflow-hidden flex items-center justify-center">
          {callType === 'audio' ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full glass electric-border animate-glow-pulse flex items-center justify-center">
                <span className="text-4xl font-display font-bold text-electric">{chatName[0]?.toUpperCase()}</span>
              </div>
              <p className="text-white/60 font-body text-sm">HD Audio Call</p>
            </div>
          ) : (
            <div id="daily-remote-video" className="w-full h-full">
              <div className="flex items-center justify-center h-full text-white/20 font-body text-sm">
                Waiting for remote video…
              </div>
            </div>
          )}
        </div>

        {/* Local video PiP */}
        {callType === 'video' && !videoOff && (
          <div className="absolute bottom-4 right-4 w-32 aspect-video glass-card rounded-xl overflow-hidden border border-electric/20">
            <div id="daily-local-video" className="w-full h-full bg-midnight-900 flex items-center justify-center">
              <Camera className="w-6 h-6 text-white/20" />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="relative z-10 flex items-center justify-center gap-3 px-6 pb-8 pt-4">
        {/* Mute */}
        <button
          onClick={toggleMute}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
            muted ? 'bg-red-500/20 border-2 border-red-500/50 text-red-400' : 'glass text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          {muted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {/* Video toggle (video calls only) */}
        {callType === 'video' && (
          <button
            onClick={toggleVideo}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
              videoOff ? 'bg-red-500/20 border-2 border-red-500/50 text-red-400' : 'glass text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            {videoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>
        )}

        {/* Screen share */}
        <button
          onClick={toggleScreenShare}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
            sharing ? 'bg-electric/20 border-2 border-electric/50 text-electric' : 'glass text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          <Monitor className="w-6 h-6" />
        </button>

        {/* Camera flip (video only) */}
        {callType === 'video' && (
          <button
            onClick={flipCamera}
            className="w-14 h-14 rounded-2xl glass flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        )}

        {/* End call */}
        <button
          onClick={endCall}
          className="w-16 h-16 rounded-2xl bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all shadow-lg shadow-red-500/30 hover:scale-105"
        >
          <PhoneOff className="w-7 h-7 text-white" />
        </button>
      </div>
    </div>
  )
}
