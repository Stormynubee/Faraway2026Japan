import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  OVERVIEW_SPLIT_CLASSES,
  OVERVIEW_SPLIT_REGION_ORDER,
  OVERVIEW_METRICS_ORDER,
} from './overviewSplitLayout.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const overviewPath = resolve(__dirname, '../components/views/OverviewView.jsx')
const splitCssPath = resolve(__dirname, '../styles/overview-split.css')
const mainPath = resolve(__dirname, '../main.jsx')
const corridorDockPath = resolve(__dirname, '../components/CorridorCommandDock.jsx')
const sensorPanelPath = resolve(__dirname, '../components/SensorStackPanel.jsx')

describe('overviewSplitLayout contract', () => {
  it('defines split page class, corridor placement, and ops row', () => {
    expect(OVERVIEW_SPLIT_CLASSES.page).toBe('overview-page-split')
    expect(OVERVIEW_SPLIT_CLASSES.corridorPlacement).toBe('split')
    expect(OVERVIEW_SPLIT_CLASSES.corridorOpsRow).toBe('overview-ops-row')
    expect(OVERVIEW_SPLIT_CLASSES.corridorSensors).toBe('overview-corridor-sensors')
    expect(OVERVIEW_SPLIT_CLASSES.deck).toBe('overview-deck')
    expect(OVERVIEW_SPLIT_CLASSES.deckRight).toBe('overview-deck-right')
    expect(OVERVIEW_SPLIT_CLASSES.metricsAlerts).toBe('overview-metrics-alerts')
  })

  it('orders header and workspace before secondary in scroll shell', () => {
    const headerIdx = OVERVIEW_SPLIT_REGION_ORDER.indexOf('header')
    const workspaceIdx = OVERVIEW_SPLIT_REGION_ORDER.indexOf('workspace')
    const secondaryIdx = OVERVIEW_SPLIT_REGION_ORDER.indexOf('secondary')
    expect(headerIdx).toBeGreaterThanOrEqual(0)
    expect(workspaceIdx).toBeGreaterThan(headerIdx)
    expect(secondaryIdx).toBeGreaterThan(workspaceIdx)
    expect(OVERVIEW_SPLIT_REGION_ORDER).not.toContain('alerts')
  })

  it('expects climate, risk deck, then alerts in metrics column', () => {
    expect(OVERVIEW_METRICS_ORDER[0]).toBe('climate')
    expect(OVERVIEW_METRICS_ORDER[1]).toBe('riskImpactDeck')
    expect(OVERVIEW_METRICS_ORDER[2]).toBe('alerts')
  })

  it('OverviewView implements split layout structure', () => {
    const src = readFileSync(overviewPath, 'utf8')
    expect(src).toContain("from '../../lib/overviewSplitLayout.js'")
    expect(src).toContain('LAYOUT.page')
    expect(src).toContain('LAYOUT.workspace')
    expect(src).toContain('LAYOUT.corridorPane')
    expect(src).toContain('LAYOUT.metricsPane')
    expect(src).toContain('LAYOUT.corridorPlacement')
    expect(src).not.toContain('overview-page-stack')
    expect(src).not.toContain('overview-corridor-band')

    const headerIdx = src.indexOf('overview-page-header')
    const workspaceIdx = src.indexOf('LAYOUT.workspace')
    const secondaryIdx = src.indexOf('LAYOUT.secondary')
    expect(headerIdx).toBeLessThan(workspaceIdx)
    expect(workspaceIdx).toBeLessThan(secondaryIdx)
    expect(src).toContain('LAYOUT.metricsAlerts')

    const corridorIdx = src.indexOf('LAYOUT.corridorPane')
    const metricsIdx = src.indexOf('LAYOUT.metricsPane')
    expect(corridorIdx).toBeLessThan(metricsIdx)
  })

  it('places climate above risk gauge and ops row under corridor', () => {
    const src = readFileSync(overviewPath, 'utf8')
    const metricsStart = src.indexOf('LAYOUT.metricsPane')
    const metricsEnd = src.indexOf('LAYOUT.secondary')
    const metricsBlock = src.slice(metricsStart, metricsEnd)
    const climateIdx = metricsBlock.indexOf('<ClimatePanel')
    const gaugeIdx = metricsBlock.indexOf('data-testid="risk-gauge"')
    const impactIdx = metricsBlock.indexOf('<ImpactPanel')
    const alertsIdx = metricsBlock.indexOf('overview-alerts')
    expect(climateIdx).toBeGreaterThanOrEqual(0)
    expect(gaugeIdx).toBeGreaterThan(climateIdx)
    expect(impactIdx).toBeGreaterThan(gaugeIdx)
    expect(alertsIdx).toBeGreaterThan(impactIdx)

    const corridorStart = src.indexOf('LAYOUT.corridorPane')
    const corridorBlock = src.slice(corridorStart, metricsStart)
    expect(corridorBlock).toContain('LAYOUT.corridorOpsRow')
    expect(corridorBlock).toContain('<OverviewOpsStrip')
    expect(corridorBlock).toContain('<ScenarioMenu')
    expect(metricsBlock).not.toContain('<OverviewOpsStrip')
    expect(metricsBlock).not.toContain('<ScenarioMenu')
  })

  it('overview-split.css prevents workspace column stretch void', () => {
    const css = readFileSync(splitCssPath, 'utf8')
    expect(css).toMatch(/\.overview-workspace\s*\{[^}]*align-items:\s*start/)
    expect(css).toMatch(/\.overview-metrics-pane[\s\S]*\.overview-metrics-alerts/)
  })

  it('overview-split.css locks main-grid scroll to inner pane', () => {
    const css = readFileSync(splitCssPath, 'utf8')
    expect(css).toMatch(/\.main-grid\.main-grid-overview[\s\S]*overflow:\s*hidden/)
  })

  it('split corridor dock is not sticky so ops row stays visible', () => {
    const css = readFileSync(splitCssPath, 'utf8')
    expect(css).toMatch(
      /\.overview-corridor-pane[\s\S]*\.corridor-command-dock[\s\S]*\.corridor-feed-split[\s\S]*position:\s*relative/,
    )
    expect(css).not.toMatch(
      /\.overview-corridor-pane[\s\S]*\.corridor-feed-split[\s\S]*position:\s*sticky/,
    )
  })

  it('overview-ops-row stays in document flow below corridor', () => {
    const css = readFileSync(splitCssPath, 'utf8')
    const opsBlock = css.match(/\.overview-ops-row\s*\{[^}]+\}/)?.[0] ?? ''
    expect(opsBlock).toMatch(/position:\s*relative/)
    expect(opsBlock).toMatch(/flex-shrink:\s*0/)
  })

  it('CorridorCommandDock omits stickyRef for split placement', () => {
    const src = readFileSync(corridorDockPath, 'utf8')
    expect(src).toMatch(/placement\s*===\s*['"]split['"]/)
    expect(src).toMatch(/stickyRef:\s*placement\s*===\s*['"]split['"]\s*\?\s*undefined/)
  })

  it('main.jsx loads overview-split.css after index.css', () => {
    const src = readFileSync(mainPath, 'utf8')
    const indexIdx = src.indexOf("import './index.css'")
    const splitIdx = src.indexOf("import './styles/overview-split.css'")
    expect(indexIdx).toBeGreaterThanOrEqual(0)
    expect(splitIdx).toBeGreaterThan(indexIdx)
  })

  it('OverviewView places field sensors below ops row in corridor pane', () => {
    const src = readFileSync(overviewPath, 'utf8')
    const sensorSrc = readFileSync(sensorPanelPath, 'utf8')
    expect(sensorSrc).toContain('data-testid="field-sensors-panel"')
    expect(src).toContain('LAYOUT.corridorSensors')
    expect(src).toContain('<SensorStackPanel')
    expect(src).toContain('variant="deck"')

    const corridorStart = src.indexOf('LAYOUT.corridorPane')
    const metricsStart = src.indexOf('LAYOUT.metricsPane')
    const corridorBlock = src.slice(corridorStart, metricsStart)
    expect(corridorBlock).toContain('<SensorStackPanel')
    expect(corridorBlock).toContain('LAYOUT.corridorOpsRow')
    expect(corridorBlock).toMatch(
      /LAYOUT\.corridorOpsRow[\s\S]*<SensorStackPanel/,
    )

    const gaugeIdx = src.indexOf('data-testid="risk-gauge"')
    const gaugeBlock = src.slice(gaugeIdx, gaugeIdx + 600)
    expect(gaugeBlock).not.toContain('<SensorStackPanel')
    expect(gaugeBlock).toContain('<RiskGaugeDial')
  })
})
