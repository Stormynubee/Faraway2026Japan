import { useCallback, useEffect, useRef, useState } from 'react'
import { GUIDE_STEPS } from '../data/guideSteps.js'
import { resolveGuideMessage } from '../lib/guideChat.js'
import { GUIDE_PANEL_MODES, nextGuideUiState } from '../lib/guideLauncher.js'
import { UI } from '../content/uiCopy.js'

const STORAGE_KEY = 'bogie-guide-tour-done'

/**
 * @param {{ view: string, setView: (v: string) => void, onOpenStationMap?: () => void }} opts
 */
export function useGuideCoach({ view, setView, onOpenStationMap }) {
  const [open, setOpen] = useState(false)
  const [launcherOpen, setLauncherOpen] = useState(false)
  const [panelMode, setPanelMode] = useState(null)
  const [tourActive, setTourActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [spotlightRect, setSpotlightRect] = useState(null)
  const lastAnnouncedStepRef = useRef(null)

  const currentStep = tourActive ? GUIDE_STEPS[stepIndex] : null

  const applyUiState = useCallback((next) => {
    setOpen(next.open)
    setLauncherOpen(next.launcherOpen)
    setPanelMode(next.mode)
    if (!next.open) {
      setTourActive(false)
      setSpotlightRect(null)
    }
  }, [])

  const appendMessage = useCallback((role, content, meta = {}) => {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-${prev.length}`, role, content, ...meta },
    ])
  }, [])

  const updateSpotlight = useCallback(() => {
    if (!tourActive || !currentStep?.target) {
      setSpotlightRect(null)
      return
    }
    const el = document.querySelector(currentStep.target)
    if (!el) {
      setSpotlightRect(null)
      return
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
    requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect()
      setSpotlightRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      })
    })
  }, [tourActive, currentStep])

  useEffect(() => {
    if (!open || panelMode !== GUIDE_PANEL_MODES.chat) return
    if (messages.length === 0) {
      appendMessage('assistant', UI.guide.welcome, {
        technical: 'Corridor guide · local answers + optional Gemini',
      })
    }
  }, [open, panelMode, messages.length, appendMessage])

  useEffect(() => {
    if (!tourActive || !currentStep) return
    if (currentStep.view && currentStep.view !== view) {
      setView(currentStep.view)
    }
  }, [tourActive, currentStep, view, setView])

  useEffect(() => {
    if (!tourActive) return
    const t = setTimeout(updateSpotlight, 120)
    window.addEventListener('resize', updateSpotlight)
    window.addEventListener('scroll', updateSpotlight, true)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', updateSpotlight)
      window.removeEventListener('scroll', updateSpotlight, true)
    }
  }, [tourActive, stepIndex, view, updateSpotlight])

  useEffect(() => {
    if (!tourActive || !currentStep) return
    if (lastAnnouncedStepRef.current === currentStep.id) return
    lastAnnouncedStepRef.current = currentStep.id
    appendMessage('assistant', currentStep.body, {
      technical: currentStep.technical,
      stepTitle: currentStep.title,
    })
  }, [stepIndex, tourActive, currentStep, appendMessage])

  const toggleFab = useCallback(() => {
    applyUiState(
      nextGuideUiState({ open, launcherOpen, mode: panelMode }, 'fab'),
    )
  }, [open, launcherOpen, panelMode, applyUiState])

  const dismissLauncher = useCallback(() => {
    applyUiState(
      nextGuideUiState({ open, launcherOpen, mode: panelMode }, 'dismiss'),
    )
  }, [open, launcherOpen, panelMode, applyUiState])

  const closePanel = useCallback(() => {
    applyUiState(
      nextGuideUiState({ open, launcherOpen, mode: panelMode }, 'close-panel'),
    )
  }, [open, launcherOpen, panelMode, applyUiState])

  const openChat = useCallback(() => {
    applyUiState(
      nextGuideUiState({ open, launcherOpen, mode: panelMode }, 'select-chat'),
    )
    setTourActive(false)
    setSpotlightRect(null)
  }, [open, launcherOpen, panelMode, applyUiState])

  const openTour = useCallback(() => {
    applyUiState(
      nextGuideUiState({ open, launcherOpen, mode: panelMode }, 'select-tour'),
    )
    lastAnnouncedStepRef.current = null
    setTourActive(true)
    setStepIndex(0)
    setMessages([])
  }, [open, launcherOpen, panelMode, applyUiState])

  const endTour = useCallback((finished = false) => {
    setTourActive(false)
    setSpotlightRect(null)
    if (finished) {
      try {
        localStorage.setItem(STORAGE_KEY, '1')
      } catch {
        /* ignore */
      }
    }
  }, [])

  const nextStep = useCallback(() => {
    if (stepIndex >= GUIDE_STEPS.length - 1) {
      endTour(true)
      appendMessage('assistant', 'Walkthrough complete — switch to chat anytime from the guide button.', {
        technical: 'GUIDE_STEPS finished',
      })
      setPanelMode(GUIDE_PANEL_MODES.chat)
      setTourActive(false)
      return
    }
    setStepIndex((i) => i + 1)
  }, [stepIndex, endTour, appendMessage])

  const prevStep = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1))
  }, [])

  const skipTour = useCallback(() => {
    endTour(false)
    setPanelMode(GUIDE_PANEL_MODES.chat)
    appendMessage('assistant', 'Walkthrough skipped. Ask anything about the corridor below.', {})
  }, [endTour, appendMessage])

  const sendMessage = useCallback(
    async (text, { preferAi = false } = {}) => {
      const trimmed = text?.trim()
      if (!trimmed || thinking) return
      appendMessage('user', trimmed)
      setInput('')
      setThinking(true)
      try {
        const history = messages
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .slice(-8)
          .map((m) => ({ role: m.role, content: m.content }))
        const result = await resolveGuideMessage(trimmed, { preferAi, history })
        appendMessage('assistant', result.answer, {
          technical: result.technical,
          source: result.source,
        })
      } finally {
        setThinking(false)
      }
    },
    [appendMessage, messages, thinking],
  )

  const handleQuickTopic = useCallback(
    (topic) => {
      sendMessage(topic)
    },
    [sendMessage],
  )

  return {
    open,
    launcherOpen,
    panelMode,
    toggleFab,
    dismissLauncher,
    closePanel,
    openChat,
    openTour,
    tourActive,
    stepIndex,
    stepCount: GUIDE_STEPS.length,
    currentStep,
    spotlightRect,
    messages,
    input,
    setInput,
    thinking,
    nextStep,
    prevStep,
    skipTour,
    sendMessage,
    handleQuickTopic,
    onOpenStationMap,
  }
}
