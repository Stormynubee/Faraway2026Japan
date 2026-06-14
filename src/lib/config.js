/** Strip BOM/whitespace corruption from env URLs (common when pasting into Vercel/Render). */
export function sanitizeEnvUrl(value) {
  if (value == null) return ''
  return String(value).replace(/^\uFEFF/, '').trim()
}

const RAW_API_BASE = sanitizeEnvUrl(import.meta.env.VITE_API_BASE ?? '')
export const API_BASE = RAW_API_BASE.replace(/\/$/, '')

/**
 * Build REST URL — relative when API_BASE is empty (Vite proxy / same-origin).
 * @param {string} path
 */
export function apiUrl(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (!API_BASE) return normalized
  return `${API_BASE}${normalized}`
}

/**
 * WebSocket URL — VITE_WS_BASE, else derive from API_BASE, else current page host.
 */
export function wsUrl() {
  const wsBase = sanitizeEnvUrl(import.meta.env.VITE_WS_BASE ?? '')
  if (wsBase) return wsBase

  if (API_BASE) {
    try {
      const url = new URL(API_BASE.startsWith('http') ? API_BASE : `https://${API_BASE}`)
      const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
      return `${wsProtocol}//${url.host}/ws`
    } catch {
      // fall through to location
    }
  }

  const loc = globalThis.location
  const protocol = loc?.protocol === 'https:' ? 'wss' : 'ws'
  const host = loc?.host ?? 'localhost'
  return `${protocol}://${host}/ws`
}
