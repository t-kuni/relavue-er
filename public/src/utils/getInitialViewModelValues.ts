import { BuildInfo, BuildInfoState, ERDiagramUIState, GlobalUIState } from "../api/client";

/**
 * 初期状態のERDiagramUIStateを返却する
 * @returns 初期状態のERDiagramUIState
 */
export function getInitialErDiagramUIState(): ERDiagramUIState {
  return {
    hover: null,
    highlightedNodeIds: [],
    highlightedEdgeIds: [],
    highlightedColumnIds: [],
    layerOrder: {
      backgroundItems: [],
      foregroundItems: [],
    },
    isDraggingEntity: false,
    isPanModeActive: false,
    isLocked: false,
  };
}

/**
 * 初期状態のGlobalUIStateを返却する
 * @returns 初期状態のGlobalUIState
 */
export function getInitialGlobalUIState(): GlobalUIState {
  return {
    selectedItem: null,
    showBuildInfoModal: false,
    showLayerPanel: false,
    showTableListPanel: false,
    showDatabaseConnectionModal: false,
    showHistoryPanel: false,
    showShortcutHelp: true,
    layoutOptimization: {
      isRunning: false,
      progress: 0,
      currentStage: null,
    },
    clipboard: null,
    lastMousePosition: null,
  };
}

/**
 * BuildInfoを受け取り、BuildInfoStateを返却する
 * @param buildInfo ビルド情報
 * @returns BuildInfoState
 */
export function getInitialBuildInfoState(buildInfo: BuildInfo): BuildInfoState {
  return {
    data: buildInfo,
    loading: false,
    error: null,
  };
}
