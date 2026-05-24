import { useCallback, useEffect, useRef, useState } from "react";
import type { Layout, Layouts } from "react-grid-layout";
import { CollapsePanel } from "../layout/CollapsePanel";
import { DashboardGrid } from "../layout/DashboardGrid";
import { WidgetToolbar } from "../layout/WidgetToolbar";
import { SchoolClassSettings } from "../settings/SchoolClassSettings";
import {
  localStorageDashboardAdapter,
  type DashboardStorageAdapter,
} from "../storage/dashboardStorage";
import {
  STORAGE_SCHEMA_VERSION,
  WIDGET_STORAGE_KEYS,
} from "../storage/widgetStorage";
import type { ThemeMode, WidgetLayoutState } from "../types/dashboard";
import { ExcelUploadStub } from "../widgets/stubs/ExcelUploadStub";
import { NeisApiStub } from "../widgets/stubs/NeisApiStub";
import { defaultLayouts, primaryWidgets } from "./dashboardConfig";

const storage: DashboardStorageAdapter = localStorageDashboardAdapter;
const columnsByBreakpoint: Record<string, number> = {
  lg: 12,
  md: 10,
  sm: 6,
  xs: 4,
  xxs: 2,
};

function getPreferredTheme(): ThemeMode {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
}

function normalizeLayouts(layouts: Layouts | null | undefined): Layouts {
  return Object.fromEntries(
    Object.entries(defaultLayouts).map(([breakpoint, defaults]) => {
      const savedById = new Map(
        layouts?.[breakpoint]?.map((layout) => [layout.i, layout]),
      );
      const cols = columnsByBreakpoint[breakpoint] ?? 12;

      return [
        breakpoint,
        defaults.map((baseLayout) => {
          const savedLayout = savedById.get(baseLayout.i);
          const minW = baseLayout.minW ?? 1;
          const minH = baseLayout.minH ?? 1;
          const width = Math.min(
            cols,
            Math.max(minW, savedLayout?.w ?? baseLayout.w),
          );
          const height = Math.max(minH, savedLayout?.h ?? baseLayout.h);
          const x = Math.min(
            Math.max(0, savedLayout?.x ?? baseLayout.x),
            Math.max(0, cols - width),
          );

          return {
            ...baseLayout,
            ...savedLayout,
            i: baseLayout.i,
            x,
            y: Math.max(0, savedLayout?.y ?? baseLayout.y),
            w: width,
            h: height,
            minW,
            minH,
          };
        }),
      ];
    }),
  );
}

function resolveStoredLayouts(
  value: Layouts | WidgetLayoutState | null,
): Layouts | null {
  if (!value) {
    return null;
  }

  const candidate = (value as WidgetLayoutState).layouts;
  if (candidate && !Array.isArray(candidate)) {
    return candidate;
  }

  return value as Layouts;
}

function createLayoutState(layouts: Layouts): WidgetLayoutState {
  return {
    version: STORAGE_SCHEMA_VERSION,
    layouts,
    updatedAt: new Date().toISOString(),
  };
}

export function DashboardApp() {
  const [layouts, setLayouts] = useState<Layouts>(defaultLayouts);
  const [theme, setTheme] = useState<ThemeMode>(getPreferredTheme);
  const hasHydrated = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function hydrateDashboard() {
      const [savedLayouts, savedTheme] = await Promise.all([
        storage.getItem<Layouts | WidgetLayoutState>(WIDGET_STORAGE_KEYS.layout),
        storage.getItem<ThemeMode>(WIDGET_STORAGE_KEYS.theme),
      ]);

      if (!isMounted) {
        return;
      }

      const resolvedLayouts = resolveStoredLayouts(savedLayouts);
      if (resolvedLayouts) {
        setLayouts(normalizeLayouts(resolvedLayouts));
      }

      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
      }

      hasHydrated.current = true;
    }

    void hydrateDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    if (hasHydrated.current) {
      void storage.setItem(WIDGET_STORAGE_KEYS.theme, theme);
    }
  }, [theme]);

  const handleLayoutChange = useCallback(
    (_currentLayout: Layout[], nextLayouts: Layouts) => {
      const normalizedLayouts = normalizeLayouts(nextLayouts);
      setLayouts(normalizedLayouts);

      if (hasHydrated.current) {
        void storage.setItem(
          WIDGET_STORAGE_KEYS.layout,
          createLayoutState(normalizedLayouts),
        );
      }
    },
    [],
  );

  const handleResetLayout = useCallback(() => {
    setLayouts(defaultLayouts);
    void storage.setItem(
      WIDGET_STORAGE_KEYS.layout,
      createLayoutState(defaultLayouts),
    );
  }, []);

  return (
    <main className="dashboard-app">
      <WidgetToolbar
        theme={theme}
        onThemeChange={setTheme}
        onResetLayout={handleResetLayout}
      />

      <CollapsePanel
        title="전체 설정"
        summary="학교와 기본 반을 수동으로 관리합니다."
      >
        <SchoolClassSettings />
      </CollapsePanel>

      <DashboardGrid
        widgets={primaryWidgets}
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
      />

      <CollapsePanel
        title="추가 예정 위젯"
        summary="NEIS API와 엑셀 업로드는 아직 Stub 상태입니다."
      >
        <div className="stub-grid">
          <NeisApiStub />
          <ExcelUploadStub />
        </div>
      </CollapsePanel>
    </main>
  );
}
