import type { Layout, Layouts } from "react-grid-layout";
import type { WidgetDefinition } from "../types/dashboard";
import { ClockWidget } from "../widgets/ClockWidget";
import { CustomAlertWidget } from "../widgets/CustomAlertWidget";
import { MemoWidget } from "../widgets/MemoWidget";
import { TaskWidget } from "../widgets/TaskWidget";

const lgLayouts: Layout[] = [
  { i: "clock", x: 0, y: 0, w: 3, h: 5, minW: 2, minH: 4 },
  { i: "memo", x: 3, y: 0, w: 3, h: 5, minW: 2, minH: 4 },
  { i: "tasks", x: 6, y: 0, w: 3, h: 6, minW: 2, minH: 5 },
  { i: "custom-alerts", x: 9, y: 0, w: 3, h: 6, minW: 2, minH: 5 },
];

export const defaultLayouts: Layouts = {
  lg: lgLayouts,
  md: [
    { i: "clock", x: 0, y: 0, w: 5, h: 5, minW: 3, minH: 4 },
    { i: "memo", x: 5, y: 0, w: 5, h: 5, minW: 3, minH: 4 },
    { i: "tasks", x: 0, y: 5, w: 5, h: 6, minW: 3, minH: 5 },
    { i: "custom-alerts", x: 5, y: 5, w: 5, h: 6, minW: 3, minH: 5 },
  ],
  sm: [
    { i: "clock", x: 0, y: 0, w: 3, h: 5, minW: 2, minH: 4 },
    { i: "memo", x: 3, y: 0, w: 3, h: 5, minW: 2, minH: 4 },
    { i: "tasks", x: 0, y: 5, w: 3, h: 6, minW: 2, minH: 5 },
    { i: "custom-alerts", x: 3, y: 5, w: 3, h: 6, minW: 2, minH: 5 },
  ],
  xs: [
    { i: "clock", x: 0, y: 0, w: 4, h: 5, minW: 4, minH: 4 },
    { i: "memo", x: 0, y: 5, w: 4, h: 5, minW: 4, minH: 4 },
    { i: "tasks", x: 0, y: 10, w: 4, h: 6, minW: 4, minH: 5 },
    { i: "custom-alerts", x: 0, y: 16, w: 4, h: 6, minW: 4, minH: 5 },
  ],
  xxs: [
    { i: "clock", x: 0, y: 0, w: 2, h: 5, minW: 2, minH: 4 },
    { i: "memo", x: 0, y: 5, w: 2, h: 5, minW: 2, minH: 4 },
    { i: "tasks", x: 0, y: 10, w: 2, h: 6, minW: 2, minH: 5 },
    { i: "custom-alerts", x: 0, y: 16, w: 2, h: 6, minW: 2, minH: 5 },
  ],
};

export const primaryWidgets: WidgetDefinition[] = [
  {
    id: "clock",
    title: "Clock",
    subtitle: "Live date and time",
    component: ClockWidget,
    accent: "blue",
    defaultLayout: lgLayouts[0],
  },
  {
    id: "memo",
    title: "Memo",
    subtitle: "Quick classroom notes",
    component: MemoWidget,
    accent: "green",
    defaultLayout: lgLayouts[1],
  },
  {
    id: "tasks",
    title: "Tasks",
    subtitle: "Today checklist",
    component: TaskWidget,
    accent: "orange",
    defaultLayout: lgLayouts[2],
  },
  {
    id: "custom-alerts",
    title: "Custom Alerts",
    subtitle: "Local reminders",
    component: CustomAlertWidget,
    accent: "pink",
    defaultLayout: lgLayouts[3],
  },
];
