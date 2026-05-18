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
          <h1>Teacher Dashboard</h1>
        </div>
      </div>

      <div className="widget-toolbar__actions">
        <div className="segmented-control" aria-label="Theme">
          <button
            type="button"
            className={theme === "light" ? "is-active" : ""}
            aria-pressed={theme === "light"}
            aria-label="Light theme"
            onClick={() => onThemeChange("light")}
            title="Light theme"
          >
            <Sun size={16} />
          </button>
          <button
            type="button"
            className={theme === "dark" ? "is-active" : ""}
            aria-pressed={theme === "dark"}
            aria-label="Dark theme"
            onClick={() => onThemeChange("dark")}
            title="Dark theme"
          >
            <Moon size={16} />
          </button>
        </div>

        <button
          type="button"
          className="icon-button"
          onClick={onResetLayout}
          title="Reset layout"
          aria-label="Reset layout"
        >
          <RotateCcw size={17} />
        </button>
      </div>
    </header>
  );
}
