import { describe, it, expect } from 'vitest'
import { nextGuideUiState, GUIDE_PANEL_MODES } from './guideLauncher.js'

describe('guideLauncher', () => {
  it('fab click when closed opens launcher menu', () => {
    expect(
      nextGuideUiState({ open: false, launcherOpen: false, mode: null }, 'fab'),
    ).toEqual({ open: false, launcherOpen: true, mode: null })
  })

  it('fab click when launcher or panel is open closes everything', () => {
    expect(
      nextGuideUiState({ open: true, launcherOpen: false, mode: GUIDE_PANEL_MODES.chat }, 'fab'),
    ).toEqual({ open: false, launcherOpen: false, mode: null })
    expect(
      nextGuideUiState({ open: false, launcherOpen: true, mode: null }, 'fab'),
    ).toEqual({ open: false, launcherOpen: false, mode: null })
  })

  it('select-chat opens panel in chat mode', () => {
    expect(
      nextGuideUiState({ open: false, launcherOpen: true, mode: null }, 'select-chat'),
    ).toEqual({ open: true, launcherOpen: false, mode: GUIDE_PANEL_MODES.chat })
  })

  it('select-tour opens panel in tour mode', () => {
    expect(
      nextGuideUiState({ open: false, launcherOpen: true, mode: null }, 'select-tour'),
    ).toEqual({ open: true, launcherOpen: false, mode: GUIDE_PANEL_MODES.tour })
  })

  it('escape closes launcher without opening panel', () => {
    expect(
      nextGuideUiState({ open: false, launcherOpen: true, mode: null }, 'dismiss'),
    ).toEqual({ open: false, launcherOpen: false, mode: null })
  })
})
