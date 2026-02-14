import { describe, it, expect } from 'vitest';
import {
  actionShowBuildInfoModal,
  actionHideBuildInfoModal,
  actionShowDatabaseConnectionModal,
  actionHideDatabaseConnectionModal,
  actionToggleHistoryPanel,
  actionSetLocale,
  actionToggleShortcutHelp,
} from '../../src/actions/globalUIActions';
import type { components } from '../../../lib/generated/api-types';

type ViewModel = components['schemas']['ViewModel'];

describe('globalUIActions', () => {
  // テスト用のViewModelを作成
  const createMockViewModel = (): ViewModel => ({
    format: 'er-viewer',
    version: 1,
    erDiagram: {
      nodes: {},
      edges: {},
      rectangles: {},
      texts: {},
      index: {
        entityToEdges: {},
        columnToEntity: {},
        columnToEdges: {},
      },
      ui: {
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
      },
      loading: false,
      history: [],
    },
    ui: {
      selectedItem: null,
      showBuildInfoModal: false,
      showLayerPanel: false,
      showDatabaseConnectionModal: false,
      showHistoryPanel: false,
      showShortcutHelp: false,
      layoutOptimization: {
        isRunning: false,
        progress: 0,
        currentStage: null,
      },
      clipboard: null,
      lastMousePosition: null,
    },
    buildInfo: {
      data: null,
      loading: false,
      error: null,
    },
    settings: {
      locale: 'en',
    },
  });

  describe('actionShowBuildInfoModal', () => {
    it('ビルド情報モーダルが表示される', () => {
      const viewModel = createMockViewModel();
      
      const result = actionShowBuildInfoModal(viewModel);

      expect(result.ui.showBuildInfoModal).toBe(true);
    });

    it('変化がない場合は同一参照を返す', () => {
      const viewModel: ViewModel = {
        ...createMockViewModel(),
        ui: {
          ...createMockViewModel().ui,
          showBuildInfoModal: true,
        },
      };
      
      const result = actionShowBuildInfoModal(viewModel);

      expect(result).toBe(viewModel);
    });
  });

  describe('actionHideBuildInfoModal', () => {
    it('ビルド情報モーダルが非表示になる', () => {
      const viewModel: ViewModel = {
        ...createMockViewModel(),
        ui: {
          ...createMockViewModel().ui,
          showBuildInfoModal: true,
        },
      };
      
      const result = actionHideBuildInfoModal(viewModel);

      expect(result.ui.showBuildInfoModal).toBe(false);
    });

    it('変化がない場合は同一参照を返す', () => {
      const viewModel = createMockViewModel();
      
      const result = actionHideBuildInfoModal(viewModel);

      expect(result).toBe(viewModel);
    });
  });

  describe('actionShowDatabaseConnectionModal', () => {
    it('データベース接続モーダルが表示される', () => {
      const viewModel = createMockViewModel();
      
      const result = actionShowDatabaseConnectionModal(viewModel);

      expect(result.ui.showDatabaseConnectionModal).toBe(true);
    });

    it('変化がない場合は同一参照を返す', () => {
      const viewModel: ViewModel = {
        ...createMockViewModel(),
        ui: {
          ...createMockViewModel().ui,
          showDatabaseConnectionModal: true,
        },
      };
      
      const result = actionShowDatabaseConnectionModal(viewModel);

      expect(result).toBe(viewModel);
    });
  });

  describe('actionHideDatabaseConnectionModal', () => {
    it('データベース接続モーダルが非表示になる', () => {
      const viewModel: ViewModel = {
        ...createMockViewModel(),
        ui: {
          ...createMockViewModel().ui,
          showDatabaseConnectionModal: true,
        },
      };
      
      const result = actionHideDatabaseConnectionModal(viewModel);

      expect(result.ui.showDatabaseConnectionModal).toBe(false);
    });

    it('変化がない場合は同一参照を返す', () => {
      const viewModel = createMockViewModel();
      
      const result = actionHideDatabaseConnectionModal(viewModel);

      expect(result).toBe(viewModel);
    });
  });

  describe('actionToggleHistoryPanel', () => {
    it('履歴パネルの表示がfalseからtrueに切り替わる', () => {
      const viewModel = createMockViewModel();
      
      const result = actionToggleHistoryPanel(viewModel);

      expect(result.ui.showHistoryPanel).toBe(true);
    });

    it('履歴パネルの表示がtrueからfalseに切り替わる', () => {
      const viewModel: ViewModel = {
        ...createMockViewModel(),
        ui: {
          ...createMockViewModel().ui,
          showHistoryPanel: true,
        },
      };
      
      const result = actionToggleHistoryPanel(viewModel);

      expect(result.ui.showHistoryPanel).toBe(false);
    });
  });

  describe('actionSetLocale', () => {
    it('言語設定が正しく更新される', () => {
      const viewModel = createMockViewModel();
      
      const result = actionSetLocale(viewModel, 'ja');

      expect(result.settings?.locale).toBe('ja');
    });

    it('別の言語に切り替えられる', () => {
      const viewModel: ViewModel = {
        ...createMockViewModel(),
        settings: {
          locale: 'en',
        },
      };
      
      const result = actionSetLocale(viewModel, 'zh');

      expect(result.settings?.locale).toBe('zh');
    });

    it('変化がない場合は同一参照を返す', () => {
      const viewModel: ViewModel = {
        ...createMockViewModel(),
        settings: {
          locale: 'ja',
        },
      };
      
      const result = actionSetLocale(viewModel, 'ja');

      expect(result).toBe(viewModel);
    });

    it('元のViewModelが変更されない（不変性が保たれる）', () => {
      const viewModel: ViewModel = {
        ...createMockViewModel(),
        settings: {
          locale: 'en',
        },
      };
      const originalLocale = viewModel.settings?.locale;
      
      actionSetLocale(viewModel, 'ja');

      expect(viewModel.settings?.locale).toBe(originalLocale);
    });
  });

  describe('actionToggleShortcutHelp', () => {
    it('ショートカットヘルプの表示がfalseからtrueに切り替わる', () => {
      const viewModel = createMockViewModel();
      
      const result = actionToggleShortcutHelp(viewModel);

      expect(result.ui.showShortcutHelp).toBe(true);
    });

    it('ショートカットヘルプの表示がtrueからfalseに切り替わる', () => {
      const viewModel: ViewModel = {
        ...createMockViewModel(),
        ui: {
          ...createMockViewModel().ui,
          showShortcutHelp: true,
        },
      };
      
      const result = actionToggleShortcutHelp(viewModel);

      expect(result.ui.showShortcutHelp).toBe(false);
    });
  });
});
