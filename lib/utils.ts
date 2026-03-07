import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// ─── Tailwind class merging ───────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Format file size ─────────────────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// ─── Truncate text ────────────────────────────────────────────────────────────

export function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? `${str.slice(0, maxLen)}…` : str
}

// ─── Format duration (seconds → mm:ss) ───────────────────────────────────────

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ─── Debounce ─────────────────────────────────────────────────────────────────

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

// ─── Throttle ─────────────────────────────────────────────────────────────────

export function throttle<T extends (...args: unknown[]) => unknown>(fn: T, limit: number): (...args: Parameters<T>) => void {
  let lastRun = 0
  return (...args) => {
    const now = Date.now()
    if (now - lastRun >= limit) {
      lastRun = now
      fn(...args)
    }
  }
}

// ─── Generate gradient from string ───────────────────────────────────────────

export function stringToGradient(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h1 = Math.abs(hash) % 360
  const h2 = (h1 + 40) % 360
  return `linear-gradient(135deg, hsl(${h1}, 70%, 45%), hsl(${h2}, 80%, 35%))`
}

// ─── Random contact ID ────────────────────────────────────────────────────────

export function randomContactId(): string {
  return `#${Math.floor(1000 + Math.random() * 9000)}`
}

// ─── Check if URL is external ─────────────────────────────────────────────────

export function isExternalUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.hostname !== window.location.hostname
  } catch {
    return false
  }
}

// ─── Safely parse JSON ────────────────────────────────────────────────────────

export function safeJsonParse<T>(str: string, fallback: T): T {
  try { return JSON.parse(str) as T }
  catch { return fallback }
}
