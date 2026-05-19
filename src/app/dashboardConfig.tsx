import type { Layout, Layouts } from "react-grid-layout";
import type { WidgetDefinition } from "../types/dashboard";
import { ClockWidget } from "../widgets/ClockWidget";
import { CustomAlertWidget } from "../widgets/CustomAlertWidget";
import { MemoWidget } from "../widgets/MemoWidget";
import { StickyNotesWidget } from "../widgets/StickyNotesWidget";
import { StudentRosterWidget } from "../widgets/StudentRosterWidget";
import { TaskWidget } from "../widgets/TaskWidget";

const lgLayouts: Layout[] = [
  { i: "clock", x: 0, y: 0, w: 3, h: 5, minW: 2, minH: 4 },
  { i: "memo", x: 3, y: 0, w: 3, h: 5, minW: 2, minH: 4 },
  { i: "tasks", x: 6, y: 0, w: 3, h: 7, minW: 3, minH: 6 },
  { i: "custom-alerts", x: 9, y: 0, w: 3, h: 7, minW: 3, minH: 6 },
  {
    i: "student-roster",
    x: 0,
    y: 7,
    w: 6,
    h: 9,
    minW: 4,
    minH: 8,
  },
  { i: "sticky-notes", x: 6, y: 15, w: 6, h: 6, minW: 3, minH: 5 },
];

export const defaultLayouts: Layouts = {
  lg: lgLayouts,
  md: [
    { i: "clock", x: 0, y: 0, w: 5, h: 5, minW: 3, minH: 4 },
    { i: "memo", x: 5, y: 0, w: 5, h: 5, minW: 3, minH: 4 },
    { i: "tasks", x: 0, y: 5, w: 5, h: 7, minW: 3, minH: 6 },
    { i: "custom-alerts", x: 5, y: 5, w: 5, h: 7, minW: 3, minH: 6 },
    { i: "student-roster", x: 0, y: 12, w: 10, h: 9, minW: 4, minH: 8 },
    { i: "sticky-notes", x: 0, y: 29, w: 10, h: 6, minW: 4, minH: 5 },
  ],
  sm: [
    { i: "clock", x: 0, y: 0, w: 3, h: 5, minW: 2, minH: 4 },
    { i: "memo", x: 3, y: 0, w: 3, h: 5, minW: 2, minH: 4 },
    { i: "tasks", x: 0, y: 5, w: 3, h: 7, minW: 2, minH: 6 },
    { i: "custom-alerts", x: 3, y: 5, w: 3, h: 7, minW: 2, minH: 6 },
    { i: "student-roster", x: 0, y: 12, w: 6, h: 9, minW: 3, minH: 8 },
    { i: "sticky-notes", x: 0, y: 29, w: 6, h: 6, minW: 3, minH: 5 },
  ],
  xs: [
    { i: "clock", x: 0, y: 0, w: 4, h: 5, minW: 4, minH: 4 },
    { i: "memo", x: 0, y: 5, w: 4, h: 5, minW: 4, minH: 4 },
    { i: "tasks", x: 0, y: 10, w: 4, h: 7, minW: 4, minH: 6 },
    { i: "custom-alerts", x: 0, y: 17, w: 4, h: 7, minW: 4, minH: 6 },
    { i: "student-roster", x: 0, y: 24, w: 4, h: 9, minW: 4, minH: 8 },
    { i: "sticky-notes", x: 0, y: 41, w: 4, h: 6, minW: 4, minH: 5 },
  ],
  xxs: [
    { i: "clock", x: 0, y: 0, w: 2, h: 5, minW: 2, minH: 4 },
    { i: "memo", x: 0, y: 5, w: 2, h: 5, minW: 2, minH: 4 },
    { i: "tasks", x: 0, y: 10, w: 2, h: 7, minW: 2, minH: 6 },
    { i: "custom-alerts", x: 0, y: 17, w: 2, h: 7, minW: 2, minH: 6 },
    { i: "student-roster", x: 0, y: 24, w: 2, h: 9, minW: 2, minH: 8 },
    { i: "sticky-notes", x: 0, y: 41, w: 2, h: 6, minW: 2, minH: 5 },
  ],
};

export const primaryWidgets: WidgetDefinition[] = [
  {
    id: "clock",
    title: "시계",
    subtitle: "현재 날짜와 시간",
    component: ClockWidget,
    accent: "blue",
    defaultLayout: lgLayouts[0],
  },
  {
    id: "memo",
    title: "메모",
    subtitle: "수업 중 빠른 기록",
    component: MemoWidget,
    accent: "green",
    defaultLayout: lgLayouts[1],
  },
  {
    id: "tasks",
    title: "할 일",
    subtitle: "중요도와 마감일",
    component: TaskWidget,
    accent: "orange",
    defaultLayout: lgLayouts[2],
  },
  {
    id: "custom-alerts",
    title: "커스텀 알림",
    subtitle: "D-day 중심 알림",
    component: CustomAlertWidget,
    accent: "pink",
    defaultLayout: lgLayouts[3],
  },
  {
    id: "student-roster",
    title: "학생 명렬표",
    subtitle: "반별 학생과 상담 기록",
    component: StudentRosterWidget,
    accent: "slate",
    defaultLayout: lgLayouts[4],
  },
  {
    id: "sticky-notes",
    title: "포스트잇",
    subtitle: "짧은 메모 카드",
    component: StickyNotesWidget,
    accent: "purple",
    defaultLayout: lgLayouts[5],
  },
];
