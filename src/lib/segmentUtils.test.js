import { describe, it, expect } from 'vitest'
import {
  segmentLabel,
  isCritical,
  highestRiskSegment,
  computeMetrics,
  segmentCoordinates,
} from './segmentUtils.js'

describe('segmentLabel', () => {
  it('returns CRITICAL for mud pumping state', () => {
    expect(segmentLabel({ state: 'CRITICAL_MUD_PUMPING' })).toBe('CRITICAL')
  })

  it('returns VIB_WARN for waterlogging state', () => {
    expect(segmentLabel({ state: 'WARNING_WATERLOGGING' })).toBe('VIB_WARN')
  })

  it('returns OP percentage from risk_index', () => {
    expect(segmentLabel({ risk_index: 0.02 })).toBe('OP: 98%')
  })
})

describe('isCritical', () => {
  it('returns true for high risk_index', () => {
    expect(isCritical({ risk_index: 0.75 })).toBe(true)
  })

  it('returns false for low risk', () => {
    expect(isCritical({ risk_index: 0.1 })).toBe(false)
  })
})

describe('highestRiskSegment', () => {
  it('returns segment with max risk_index', () => {
    const segs = [
      { id: 'S1', risk_index: 0.2 },
      { id: 'S4', risk_index: 0.9 },
    ]
    expect(highestRiskSegment(segs)?.id).toBe('S4')
  })

  it('returns null for empty array', () => {
    expect(highestRiskSegment([])).toBeNull()
  })
})

describe('segmentCoordinates', () => {
  it('returns deterministic lat/lon per segment', () => {
    const c = segmentCoordinates('S3')
    expect(c.lat).toBe('45.9581')
    expect(c.lon).toBe('12.8733')
  })
})

describe('computeMetrics', () => {
  it('derives metrics from focus segment vib_z and risk', () => {
    const m = computeMetrics(
      [{ id: 'S4', risk_index: 0.5, vib_z: 2.5, az: 1.2 }],
      0.5,
      { id: 'S4', risk_index: 0.5, vib_z: 2.5, az: 1.2 },
    )
    expect(m.peakAmplitude).toBe(1.2)
    expect(m.fatigueIndex).toBe(50)
    expect(m.bearingTemp).toBeCloseTo(44, 0)
    expect(m.liveFrequency).toBe(52)
  })
})
