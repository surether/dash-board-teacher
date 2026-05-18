import { useCallback, useEffect, useRef, useState } from "react";
import type { Layout, Layouts } from "react-grid-layout";
import { CollapsePanel } from "../layout/CollapsePanel";
import { DashboardGrid } from "../layout/DashboardGrid";
import { WidgetToolbar } from "../layout/WidgetToolbar";
import {
  localStorageDashboardAdapter,
  type DashboardStorageAdapter,
} from "../storage/dashboardStorage";
import type { ThemeMode } from "../types/dashboard";
import { AcademicCalendarStub } from "../widgets/stubs/AcademicCalendarStub";
import { ExcelUploadStub } from "../widgets/stubs/ExcelUploadStub";
import { NeisApiStub } from "../widgets/stubs/NeisApiStub";
import { StudentRosterStub } from "../widgets/stubs/StudentRosterStub";
import { defaultLayouts, primaryWidgets } from "./dashboardConfig";

const LAYOUT_STORAGE_KEY = "teacher-widget-dashboard:layouts:v1";
const THEME_STORAGE_KEY = "teacher-widget-dashboard:theme:v1";

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

export function DashboardApp() {
  const [layouts, setLayouts] = useState<Layouts>(defaultLayouts);
  const [theme, setTheme] = useState<ThemeMode>(getPreferredTheme);
  const hasHydrated = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function hydrateDashboard() {
      const [savedLayouts, savedTheme] = await Promise.all([
        storage.getItem<Layouts>(LAYOUT_STORAGE_KEY),
        storage.getItem<ThemeMode>(THEME_STORAGE_KEY),
      ]);

      if (!isMounted) {
        return;
      }

      if (savedLayouts) {
        setLayouts(normalizeLayouts(savedLayouts));
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
      void storage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [theme]);

  const handleLayoutChange = useCallback(
    (_currentLayout: Layout[], nextLayouts: Layouts) => {
      const normalizedLayouts = normalizeLayouts(nextLayouts);
      setLayouts(normalizedLayouts);

      if (hasHydrated.current) {
        void storage.setItem(LAYOUT_STORAGE_KEY, normalizedLayouts);
      }
    },
    [],
  );

  const handleResetLayout = useCallback(() => {
    setLayouts(defaultLayouts);
    void storage.setItem(LAYOUT_STORAGE_KEY, defaultLayouts);
  }, []);

  return (
    <main className="dashboard-app">
      <WidgetToolbar
        theme={theme}
        onThemeChange={setTheme}
        onResetLayout={handleResetLayout}
      />

      <DashboardGrid
        widgets={primaryWidgets}
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
      />

      <CollapsePanel
        title="Reserved modules"
        summary="Phase 2 stubs stay outside the active grid."
      >
        <div className="stub-grid">
          <NeisApiStub />
          <ExcelUploadStub />
          <StudentRosterStub />
          <AcademicCalendarStub />
        </div>
      </CollapsePanel>
    </main>
  );
}
