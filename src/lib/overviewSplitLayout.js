/** Layout contract for Overview split-pane (corridor left, metrics right). */

export const OVERVIEW_SPLIT_CLASSES = {
  page: 'overview-page-split',
  scrollPane: 'overview-scroll-pane',
  shell: 'overview-scroll-shell',
  headerBlock: 'overview-header-block',
  workspace: 'overview-workspace',
  corridorPane: 'overview-corridor-pane',
  corridorOpsRow: 'overview-ops-row',
  corridorSensors: 'overview-corridor-sensors',
  deck: 'overview-deck',
  deckRight: 'overview-deck-right',
  metricsPane: 'overview-metrics-pane',
  metricsAlerts: 'overview-metrics-alerts',
  alertsStage: 'overview-alerts-stage',
  secondary: 'overview-secondary',
  corridorPlacement: 'split',
  corridorDockSplit: 'corridor-feed-split',
}

/** DOM region order inside the unified scroll shell. */
export const OVERVIEW_SPLIT_REGION_ORDER = [
  'header',
  'hero',
  'workspace',
  'secondary',
]

/** Panel order inside the metrics column (top to bottom). */
export const OVERVIEW_METRICS_ORDER = ['climate', 'riskImpactDeck', 'alerts']
