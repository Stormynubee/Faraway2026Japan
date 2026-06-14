import { describe, it, expect, vi, afterEach } from 'vitest'

describe('config', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
    vi.unstubAllGlobals()
  })

  it('sanitizeEnvUrl strips BOM and CRLF from pasted env values', async () => {
    const { sanitizeEnvUrl } = await import('./config.js')
    expect(sanitizeEnvUrl('\uFEFFhttps://bogie-flow.onrender.com\r\n')).toBe(
      'https://bogie-flow.onrender.com',
    )
  })

  it('apiUrl returns relative path when API_BASE is empty', async () => {
    vi.stubEnv('VITE_API_BASE', '')
    const { apiUrl } = await import('./config.js')
    expect(apiUrl('/api/inject/monsoon')).toBe('/api/inject/monsoon')
  })

  it('apiUrl prefixes absolute base when API_BASE is set', async () => {
    vi.stubEnv('VITE_API_BASE', 'https://api.example.com')
    const { apiUrl } = await import('./config.js')
    expect(apiUrl('/api/guide/chat')).toBe('https://api.example.com/api/guide/chat')
  })

  it('wsUrl uses location host when no env bases are set', async () => {
    vi.stubEnv('VITE_API_BASE', '')
    vi.stubEnv('VITE_WS_BASE', '')
    vi.stubGlobal('location', {
      protocol: 'http:',
      host: 'localhost:5173',
    })
    const { wsUrl } = await import('./config.js')
    expect(wsUrl()).toBe('ws://localhost:5173/ws')
  })

  it('wsUrl uses wss when location is https', async () => {
    vi.stubEnv('VITE_API_BASE', '')
    vi.stubEnv('VITE_WS_BASE', '')
    vi.stubGlobal('location', {
      protocol: 'https:',
      host: 'app.example.com',
    })
    const { wsUrl } = await import('./config.js')
    expect(wsUrl()).toBe('wss://app.example.com/ws')
  })

  it('wsUrl prefers VITE_WS_BASE when set', async () => {
    vi.stubEnv('VITE_API_BASE', '')
    vi.stubEnv('VITE_WS_BASE', 'wss://ws.example.com/custom')
    vi.stubGlobal('location', { protocol: 'https:', host: 'ignored' })
    const { wsUrl } = await import('./config.js')
    expect(wsUrl()).toBe('wss://ws.example.com/custom')
  })

  it('wsUrl derives from API_BASE when VITE_WS_BASE is empty', async () => {
    vi.stubEnv('VITE_API_BASE', 'https://api.example.com')
    vi.stubEnv('VITE_WS_BASE', '')
    vi.stubGlobal('location', { protocol: 'https:', host: 'ignored' })
    const { wsUrl } = await import('./config.js')
    expect(wsUrl()).toBe('wss://api.example.com/ws')
  })

  it('wsUrl uses Render backend when VITE_API_BASE has BOM and CRLF', async () => {
    vi.stubEnv('VITE_API_BASE', '\uFEFFhttps://bogie-flow.onrender.com\r\n')
    vi.stubEnv('VITE_WS_BASE', '')
    vi.stubGlobal('location', { protocol: 'https:', host: 'bogieflow.vercel.app' })
    const { wsUrl } = await import('./config.js')
    expect(wsUrl()).toBe('wss://bogie-flow.onrender.com/ws')
  })
})
