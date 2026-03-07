'use client'

import { useOwnPresence } from '@/hooks/usePresence'

interface Props {
  userId: string
}

/**
 * Mounts useOwnPresence for the authenticated user.
 * Placed in the main layout so it runs on every page without
 * touching any server components.
 *
 * Does NOT affect AI Guard, Business Hub, or Gemini 3 Pro.
 */
export default function PresenceProvider({ userId }: Props) {
  useOwnPresence(userId)
  return null   // renders nothing — pure side-effect component
}
