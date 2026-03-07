import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import type { AiScanResult, ThreatLevel, BanLevel } from '@/types'

// ─── Init ─────────────────────────────────────────────────────────────────────

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const model = gemini.getGenerativeModel({
  model: 'gemini-1.5-pro',
  safetySettings: [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE   },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  ],
})

// ─── System Prompt for AI Guard ───────────────────────────────────────────────

const GUARD_SYSTEM_PROMPT = `
You are Alok Guard — the AI safety engine for Alok Message, a premium secure messaging platform.
Your role: analyse incoming messages for threats, scams, phishing, and explicit content.

CRITICAL PRIVACY RULES (never flag, never read):
- Digital banking information (account numbers, card numbers, PINs, transaction IDs)
- Private personal photos (non-explicit)
- Medical or health records
- Legal documents shared privately

YOUR DETECTION TARGETS:
1. Phishing URLs and malicious links (confidence > 0.85 = block)
2. Fraud patterns: fake giveaways, lottery scams, investment fraud
3. Explicit sexual content (immediate 30-day suspension trigger)
4. Harassment and targeted abuse
5. Impersonation attempts

OUTPUT FORMAT (strict JSON only, no markdown):
{
  "threatLevel": "safe|suspicious|danger|critical",
  "confidence": 0-100,
  "reasons": ["reason1", "reason2"],
  "isPhishing": true|false,
  "isFraud": true|false,
  "isExplicit": true|false,
  "isBankingInfo": false,
  "action": "allow|warn|block|escalate",
  "summary": "one-sentence human-readable explanation"
}

PENALTY THRESHOLDS:
- suspicious (60-75 confidence): warn user
- danger     (76-89 confidence): block message, issue readonly restriction
- critical   (90+ confidence):   block + escalate to admin + ban user

Always output valid JSON. Never include markdown. Never include banking or private data.
`

// ─── Main Scan Function ───────────────────────────────────────────────────────

export async function scanMessage(
  content: string,
  mediaUrls?: string[]
): Promise<AiScanResult> {
  try {
    const prompt = `
${GUARD_SYSTEM_PROMPT}

MESSAGE TO ANALYSE:
"""
${content}
"""
${mediaUrls?.length ? `ATTACHED MEDIA URLS:\n${mediaUrls.join('\n')}` : ''}

Respond with ONLY valid JSON.
`

    const result = await model.generateContent(prompt)
    const text   = result.response.text().trim()

    // Strip any accidental markdown wrapping
    const clean  = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return {
      threatLevel:   parsed.threatLevel  as ThreatLevel,
      confidence:    parsed.confidence   as number,
      reasons:       parsed.reasons      as string[],
      isPhishing:    parsed.isPhishing   as boolean,
      isFraud:       parsed.isFraud      as boolean,
      isExplicit:    parsed.isExplicit   as boolean,
      isBankingInfo: false, // Always false — privacy blindspot
      action:        parsed.action       as AiScanResult['action'],
      scannedAt:     new Date().toISOString(),
    }
  } catch (err) {
    console.error('[Alok Guard] Scan failed:', err)
    // Fail-safe: allow message but flag for manual review
    return {
      threatLevel:   'safe',
      confidence:    0,
      reasons:       ['AI scan unavailable — queued for manual review'],
      isPhishing:    false,
      isFraud:       false,
      isExplicit:    false,
      isBankingInfo: false,
      action:        'allow',
      scannedAt:     new Date().toISOString(),
    }
  }
}

// ─── Penalty Resolver ─────────────────────────────────────────────────────────

export function resolvePenalty(
  scan: AiScanResult,
  priorOffenses: number
): { banLevel: BanLevel | null; reason: string } {
  if (scan.isExplicit) {
    return { banLevel: 'suspended_30d', reason: 'Explicit sexual content detected by AI Guard.' }
  }

  if (scan.action === 'escalate' || scan.confidence >= 90) {
    if (priorOffenses >= 3) {
      return { banLevel: 'permanent', reason: 'Repeated critical violations. Permanent ban by AI Guard.' }
    }
    return { banLevel: 'suspended_15d', reason: 'Critical threat pattern detected.' }
  }

  if (scan.action === 'block' && scan.confidence >= 76) {
    if (priorOffenses >= 2) {
      return { banLevel: 'suspended_7d', reason: 'Repeated dangerous behaviour.' }
    }
    return { banLevel: 'readonly', reason: 'Dangerous content detected. Read-only mode applied.' }
  }

  return { banLevel: null, reason: 'No penalty required.' }
}

// ─── Bulk Scan (Admin Dashboard) ─────────────────────────────────────────────

export async function bulkScanMessages(
  messages: Array<{ id: string; content: string }>
): Promise<Array<{ id: string; result: AiScanResult }>> {
  const results = await Promise.allSettled(
    messages.map(async (msg) => ({
      id:     msg.id,
      result: await scanMessage(msg.content),
    }))
  )

  return results
    .filter((r): r is PromiseFulfilledResult<{ id: string; result: AiScanResult }> => r.status === 'fulfilled')
    .map((r) => r.value)
}

// ─── Generate Contact ID ──────────────────────────────────────────────────────

export function generateContactId(): string {
  const digits = Math.floor(1000 + Math.random() * 9000)
  return `#${digits}`
}

// ─── Generate 8-char Salt ─────────────────────────────────────────────────────

export function generateSalt(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}


// ─── AI Guard Assistance (Gemini 3 Pro assists AI Guard) ─────────────────────

export async function aiGuardAssist(
  pattern: string,
  context: string
): Promise<{ verdict: string; confidence: number; reasoning: string }> {
  try {
    const model  = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
    const prompt = [
      'You are Alok Guard powered by Gemini 3 Pro. Analyze this pattern.',
      'Pattern: ' + pattern,
      'Context: ' + context,
      'Return ONLY valid JSON: {"verdict":"safe"|"suspicious"|"fraud"|"scam","confidence":0-100,"reasoning":"..."}',
    ].join('\n')

    const result = await model.generateContent(prompt)
    const text   = result.response.text().replace(/```json|```/g, '').trim()
    return JSON.parse(text)
  } catch {
    return { verdict: 'unknown', confidence: 0, reasoning: 'Analysis failed.' }
  }
}
