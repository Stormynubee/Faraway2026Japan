import { describe, it, expect } from 'vitest'
import {
  moistureSparklinePath,
  rainfallBarHeights,
  soilRainCorrelationData,
} from './chartData.js'

describe('moistureSparklinePath', () => {
  it('returns SVG path string with M command', () => {
    const path = moistureSparklinePath([0.3, 0.5, 0.4, 0.6])
    expect(path).toMatch(/^M/)
    expect(path).toContain('L')
  })

  it('handles empty values with default stitch path', () => {
    const path = moistureSparklinePath([])
    expect(path.length).toBeGreaterThan(10)
  })
})

describe('rainfallBarHeights', () => {
  it('returns 6 corridor bar heights from segment rainfall', () => {
    const result = rainfallBarHeights([
      { id: 'S1', rainfall: 0.2 },
      { id: 'S2', rainfall: 0.9 },
      { id: 'S3', rainfall: 0.5 },
      { id: 'S4', rainfall: 0.1 },
      { id: 'S5', rainfall: 0.3 },
      { id: 'S6', rainfall: 0.4 },
    ])
    expect(result.heights).toHaveLength(6)
    expect(result.heights[1]).toBe(90)
    expect(result.peakIndex).toBe(1)
    expect(result.labels).toEqual(['S1', 'S2', 'S3', 'S4', 'S5', 'S6'])
  })
})

describe('soilRainCorrelationData', () => {
  it('uses segment history when available', () => {
    const history = {
      S3: {
        moisture: [0.3, 0.5, 0.6],
        rainfall: [0.2, 0.4, 0.8],
        vib_z: [],
      },
    }
    const result = soilRainCorrelationData([], history, 'S3')
    expect(result.heights).toHaveLength(3)
    expect(result.linePoints).toHaveLength(3)
  })

  it('falls back to corridor snapshot', () => {
    const segs = [
      { id: 'S1', rainfall: 0.5, soil_moisture: 0.4 },
      { id: 'S2', rainfall: 0.8, soil_moisture: 0.6 },
    ]
    const result = soilRainCorrelationData(segs, {}, 'S1')
    expect(result.heights).toHaveLength(6)
    expect(result.peakIndex).toBeGreaterThanOrEqual(0)
  })
})
