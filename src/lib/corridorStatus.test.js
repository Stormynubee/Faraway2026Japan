import { describe, it, expect } from 'vitest'
import { corridorStatusSummary, recommendedAction } from './corridorStatus.js'

describe('corridorStatusSummary', () => {
  it('reports loading when no segments', () => {
    expect(corridorStatusSummary([])).toEqual({
      line: 'Connecting to corridor telemetry…',
      tone: 'loading',
      attentionCount: 0,
      attentionSegments: [],
      totalSegments: 0,
    })
  })

  it('reports nominal when all segments healthy', () => {
    const segments = [
      { id: 'S1', risk_index: 0.1, state: 'HEALTHY' },
      { id: 'S2', risk_index: 0.05, state: 'HEALTHY' },
    ]
    expect(corridorStatusSummary(segments).line).toBe('Corridor status: All segments nominal')
    expect(corridorStatusSummary(segments).tone).toBe('healthy')
  })

  it('counts segments that need attention', () => {
    const segments = [
      { id: 'S1', risk_index: 0.1, state: 'HEALTHY' },
      { id: 'S4', risk_index: 0.87, state: 'CRITICAL_MUD_PUMPING' },
      { id: 'S5', risk_index: 0.4, state: 'WARNING_WATERLOGGING' },
    ]
    const summary = corridorStatusSummary(segments)
    expect(summary.line).toBe('Corridor status: 2 segments need attention')
    expect(summary.attentionCount).toBe(2)
    expect(summary.tone).toBe('warn')
    expect(summary.attentionSegments.map((s) => s.id)).toEqual(['S4', 'S5'])
    expect(summary.totalSegments).toBe(3)
  })
})

describe('recommendedAction', () => {
  it('suggests urgent maintenance for critical segment', () => {
    expect(
      recommendedAction({ id: 'S4', risk_index: 0.9, state: 'CRITICAL_MUD_PUMPING', vib_z: 4.2 }),
    ).toMatch(/urgent maintenance/i)
  })

  it('suggests routine watch for healthy segment', () => {
    expect(recommendedAction({ id: 'S1', risk_index: 0.1, state: 'HEALTHY', vib_z: 0.5 })).toMatch(
      /routine watch/i,
    )
  })
})
