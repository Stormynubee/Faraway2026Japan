/** Guide FAB launcher state — chat vs page walkthrough. */

export const GUIDE_PANEL_MODES = {
  chat: 'chat',
  tour: 'tour',
}

/**
 * @param {{ open: boolean, launcherOpen: boolean, mode: string | null }} state
 * @param {'fab' | 'select-chat' | 'select-tour' | 'dismiss' | 'close-panel'} action
 */
export function nextGuideUiState(state, action) {
  switch (action) {
    case 'fab':
      if (state.open || state.launcherOpen) {
        return { open: false, launcherOpen: false, mode: null }
      }
      return { open: false, launcherOpen: true, mode: null }
    case 'select-chat':
      return { open: true, launcherOpen: false, mode: GUIDE_PANEL_MODES.chat }
    case 'select-tour':
      return { open: true, launcherOpen: false, mode: GUIDE_PANEL_MODES.tour }
    case 'dismiss':
    case 'close-panel':
      return { open: false, launcherOpen: false, mode: null }
    default:
      return state
  }
}
