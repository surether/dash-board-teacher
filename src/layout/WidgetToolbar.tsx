import { Moon, RotateCcw, Sun, Wand2 } from "lucide-react";
import type { ThemeMode } from "../types/dashboard";

interface WidgetToolbarProps {
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onResetLayout: () => void;
}

export function WidgetToolbar({
  theme,
  onThemeChange,
  onResetLayout,
}: WidgetToolbarProps) {
  return (
    <header className="widget-toolbar">
      <div className="widget-toolbar__brand">
        <span className="widget-toolbar__mark">
          <Wand2 size={18} strokeWidth={2.2} />
        </span>
        <div>
          <p>OpenixWidgets</p>
          <h1>교사용 대시보드</h1>
        </div>
      </div>

      <div className="widget-toolbar__actions">
        <div className="segmented-control" aria-label="테마">
          <button
            type="button"
            className={theme === "light" ? "is-active" : ""}
            aria-pressed={theme === "light"}
            aria-label="라이트 테마"
            onClick={() => onThemeChange("light")}
            title="라이트 테마"
          >
            <Sun size={16} />
          </button>
          <button
            type="button"
            className={theme === "dark" ? "is-active" : ""}
            aria-pressed={theme === "dark"}
            aria-label="다크 테마"
            onClick={() => onThemeChange("dark")}
            title="다크 테마"
          >
            <Moon size={16} />
          </button>
        </div>

        <button
          type="button"
          className="icon-button"
          onClick={onResetLayout}
          title="레이아웃 초기화"
          aria-label="레이아웃 초기화"
        >
          <RotateCcw size={17} />
        </button>
      </div>
    </header>
  );
}
