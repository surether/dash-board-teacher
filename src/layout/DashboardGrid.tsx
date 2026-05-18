import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import type { Layout, Layouts } from "react-grid-layout";
import { Responsive, WidthProvider } from "react-grid-layout";
import type { WidgetDefinition } from "../types/dashboard";
import { WidgetFrame } from "./WidgetFrame";

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardGridProps {
  widgets: WidgetDefinition[];
  layouts: Layouts;
  onLayoutChange: (currentLayout: Layout[], allLayouts: Layouts) => void;
}

export function DashboardGrid({
  widgets,
  layouts,
  onLayoutChange,
}: DashboardGridProps) {
  return (
    <section className="dashboard-grid-wrap" aria-label="Widget dashboard">
      <ResponsiveGridLayout
        className="dashboard-grid"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={36}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        draggableHandle=".widget-frame__drag-handle"
        compactType="vertical"
        useCSSTransforms
        onLayoutChange={onLayoutChange}
      >
        {widgets.map((widget) => {
          const Widget = widget.component;

          return (
            <div key={widget.id}>
              <WidgetFrame
                title={widget.title}
                subtitle={widget.subtitle}
                accent={widget.accent}
              >
                <Widget />
              </WidgetFrame>
            </div>
          );
        })}
      </ResponsiveGridLayout>
    </section>
  );
}
