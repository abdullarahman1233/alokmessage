'use client'

import { useState, useCallback } from 'react'
import { Upload, X, ImageIcon, FileText, Mic, Film } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabaseBrowser } from '@/lib/supabase'
import { uploadMedia } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

interface Props {
  chatId:   string
  senderId: string
  onClose:  () => void
}

const ACCEPT_MAP = {
  image: 'image/*',
  video: 'video/*',
  audio: 'audio/*',
  file:  '*/*',
}

export default function MediaUpload({ chatId, senderId, onClose }: Props) {
  const supabase                    = supabaseBrowser()
  const [dragging, setDragging]     = useState(false)
  const [uploading, setUploading]   = useState(false)
  const [progress, setProgress]     = useState(0)

  const uploadAndSend = useCallback(async (file: File) => {
    setUploading(true)
    setProgress(10)

    const ext      = file.name.split('.').pop()
    const path     = `${chatId}/${uuidv4()}.${ext}`
    const mimeType = file.type
    const isImage  = mimeType.startsWith('image/')
    const isVideo  = mimeType.startsWith('video/')
    const isAudio  = mimeType.startsWith('audio/')

    setProgress(30)
    const url = await uploadMedia(file, 'chat-media', path)
    setProgress(80)

    if (!url) {
      toast.error('Upload failed. Please try again.')
      setUploading(false)
      return
    }

    const type = isImage ? 'image' : isVideo ? 'video' : isAudio ? 'audio' : 'file'

    const { error } = await supabase.from('messages').insert({
      chat_id:       chatId,
      senderId,
      content:       file.name,
      type,
      status:        'sent',
      mediaUrl:      url,
      mediaSize:     file.size,
      mediaMimeType: mimeType,
      isDeleted:     false,
      isEdited:      false,
      createdAt:     new Date().toISOString(),
    })

    setProgress(100)
    setUploading(false)

    if (error) {
      toast.error('Message send failed.')
    } else {
      toast.success('File sent — lossless quality preserved.')
      onClose()
    }
  }, [chatId, senderId, supabase, onClose])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadAndSend(file)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadAndSend(file)
  }

  return (
    <div className="mb-3 glass-card rounded-2xl p-4 animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-display font-semibold text-white/80">Send File — Lossless Quality</p>
        <button onClick={onClose} className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Drag drop zone */}
      <div
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
          dragging
            ? 'border-electric bg-electric/5'
            : 'border-white/15 hover:border-white/30'
        }`}
      >
        {uploading ? (
          <div className="space-y-3">
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-white/50 font-body">Uploading… {progress}%</p>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 text-white/25 mx-auto mb-2" />
            <p className="text-sm text-white/50 font-body mb-1">Drag & drop any file</p>
            <p className="text-xs text-white/25 font-body">100% original quality preserved</p>
          </>
        )}
      </div>

      {/* Quick media buttons */}
      {!uploading && (
        <div className="flex gap-2 mt-3">
          {[
            { icon: ImageIcon, label: 'Photo',  accept: ACCEPT_MAP.image, color: 'text-cyan-400'  },
            { icon: Film,      label: 'Video',  accept: ACCEPT_MAP.video, color: 'text-violet-400'},
            { icon: Mic,       label: 'Audio',  accept: ACCEPT_MAP.audio, color: 'text-emerald-400'},
            { icon: FileText,  label: 'File',   accept: ACCEPT_MAP.file,  color: 'text-orange-400'},
          ].map(({ icon: Icon, label, accept, color }) => (
            <label key={label} className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl glass hover:bg-white/8 cursor-pointer transition-all">
              <Icon className={`w-5 h-5 ${color}`} />
              <span className="text-[10px] text-white/50 font-body">{label}</span>
              <input type="file" accept={accept} className="hidden" onChange={handleFileInput} />
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
