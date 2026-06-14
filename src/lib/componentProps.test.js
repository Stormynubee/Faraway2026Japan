import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function readComponent(relativePath) {
  return readFileSync(resolve(root, relativePath), 'utf8')
}

function destructuredProps(source) {
  const match = source.match(/export default function \w+\(\{([^}]+)\}/)
  expect(match, 'expected default export with destructured props').toBeTruthy()
  return match[1]
    .split(',')
    .map((part) => part.trim().split('=')[0].trim())
    .filter(Boolean)
}

describe('component prop contracts', () => {
  it('ScenarioMenu uses realConnected only (no unused connected prop)', () => {
    const props = destructuredProps(readComponent('components/ScenarioMenu.jsx'))
    expect(props).toContain('realConnected')
    expect(props).not.toContain('connected')
  })

  it('WeatherToggle uses realConnected only (no unused connected prop)', () => {
    const props = destructuredProps(readComponent('components/WeatherToggle.jsx'))
    expect(props).toContain('realConnected')
    expect(props).not.toContain('connected')
  })

  it('OverviewView does not pass connected to ScenarioMenu', () => {
    const source = readComponent('components/views/OverviewView.jsx')
    expect(source).toMatch(/<ScenarioMenu[\s\S]*?realConnected=\{realConnected\}/)
    expect(source).not.toMatch(/<ScenarioMenu[\s\S]*?connected=\{connected\}/)
  })

  it('ClimateView does not pass connected to WeatherToggle', () => {
    const source = readComponent('components/views/ClimateView.jsx')
    expect(source).toMatch(/<WeatherToggle[\s\S]*?realConnected=\{realConnected\}/)
    expect(source).not.toMatch(/<WeatherToggle[\s\S]*?connected=\{connected\}/)
  })
})
