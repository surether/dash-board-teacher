import type { Layout, Layouts } from "react-grid-layout";
import type { WidgetDefinition } from "../types/dashboard";
import { AcademicCalendarWidget } from "../widgets/AcademicCalendarWidget";
import { ClockWidget } from "../widgets/ClockWidget";
import { CustomAlertWidget } from "../widgets/CustomAlertWidget";
import { LessonToolsWidget } from "../widgets/LessonToolsWidget";
import { MemoWidget } from "../widgets/MemoWidget";
import { QuickLinksWidget } from "../widgets/QuickLinksWidget";
import { StickyNotesWidget } from "../widgets/StickyNotesWidget";
import { StudentRosterWidget } from "../widgets/StudentRosterWidget";
import { TaskWidget } from "../widgets/TaskWidget";
import { TimetableWidget } from "../widgets/TimetableWidget";
import { WeatherReadinessWidget } from "../widgets/WeatherReadinessWidget";

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
  { i: "lesson-tools", x: 6, y: 7, w: 6, h: 8, minW: 4, minH: 7 },
  { i: "quick-links", x: 0, y: 16, w: 6, h: 5, minW: 3, minH: 4 },
  { i: "sticky-notes", x: 6, y: 15, w: 6, h: 6, minW: 3, minH: 5 },
  { i: "timetable", x: 0, y: 21, w: 12, h: 6, minW: 6, minH: 5 },
  { i: "academic-calendar", x: 0, y: 27, w: 6, h: 5, minW: 3, minH: 4 },
  { i: "weather-readiness", x: 6, y: 27, w: 6, h: 5, minW: 3, minH: 4 },
];

export const defaultLayouts: Layouts = {
  lg: lgLayouts,
  md: [
    { i: "clock", x: 0, y: 0, w: 5, h: 5, minW: 3, minH: 4 },
    { i: "memo", x: 5, y: 0, w: 5, h: 5, minW: 3, minH: 4 },
    { i: "tasks", x: 0, y: 5, w: 5, h: 7, minW: 3, minH: 6 },
    { i: "custom-alerts", x: 5, y: 5, w: 5, h: 7, minW: 3, minH: 6 },
    { i: "student-roster", x: 0, y: 12, w: 10, h: 9, minW: 4, minH: 8 },
    { i: "lesson-tools", x: 0, y: 21, w: 10, h: 8, minW: 4, minH: 7 },
    { i: "quick-links", x: 0, y: 29, w: 10, h: 5, minW: 4, minH: 4 },
    { i: "sticky-notes", x: 0, y: 34, w: 10, h: 6, minW: 4, minH: 5 },
    { i: "timetable", x: 0, y: 40, w: 10, h: 6, minW: 4, minH: 5 },
    { i: "academic-calendar", x: 0, y: 46, w: 10, h: 5, minW: 4, minH: 4 },
    { i: "weather-readiness", x: 0, y: 51, w: 10, h: 5, minW: 4, minH: 4 },
  ],
  sm: [
    { i: "clock", x: 0, y: 0, w: 3, h: 5, minW: 2, minH: 4 },
    { i: "memo", x: 3, y: 0, w: 3, h: 5, minW: 2, minH: 4 },
    { i: "tasks", x: 0, y: 5, w: 3, h: 7, minW: 2, minH: 6 },
    { i: "custom-alerts", x: 3, y: 5, w: 3, h: 7, minW: 2, minH: 6 },
    { i: "student-roster", x: 0, y: 12, w: 6, h: 9, minW: 3, minH: 8 },
    { i: "lesson-tools", x: 0, y: 21, w: 6, h: 8, minW: 3, minH: 7 },
    { i: "quick-links", x: 0, y: 29, w: 6, h: 5, minW: 3, minH: 4 },
    { i: "sticky-notes", x: 0, y: 34, w: 6, h: 6, minW: 3, minH: 5 },
    { i: "timetable", x: 0, y: 40, w: 6, h: 6, minW: 3, minH: 5 },
    { i: "academic-calendar", x: 0, y: 46, w: 6, h: 5, minW: 3, minH: 4 },
    { i: "weather-readiness", x: 0, y: 51, w: 6, h: 5, minW: 3, minH: 4 },
  ],
  xs: [
    { i: "clock", x: 0, y: 0, w: 4, h: 5, minW: 4, minH: 4 },
    { i: "memo", x: 0, y: 5, w: 4, h: 5, minW: 4, minH: 4 },
    { i: "tasks", x: 0, y: 10, w: 4, h: 7, minW: 4, minH: 6 },
    { i: "custom-alerts", x: 0, y: 17, w: 4, h: 7, minW: 4, minH: 6 },
    { i: "student-roster", x: 0, y: 24, w: 4, h: 9, minW: 4, minH: 8 },
    { i: "lesson-tools", x: 0, y: 33, w: 4, h: 8, minW: 4, minH: 7 },
    { i: "quick-links", x: 0, y: 41, w: 4, h: 5, minW: 4, minH: 4 },
    { i: "sticky-notes", x: 0, y: 46, w: 4, h: 6, minW: 4, minH: 5 },
    { i: "timetable", x: 0, y: 52, w: 4, h: 6, minW: 4, minH: 5 },
    { i: "academic-calendar", x: 0, y: 58, w: 4, h: 5, minW: 4, minH: 4 },
    { i: "weather-readiness", x: 0, y: 63, w: 4, h: 5, minW: 4, minH: 4 },
  ],
  xxs: [
    { i: "clock", x: 0, y: 0, w: 2, h: 5, minW: 2, minH: 4 },
    { i: "memo", x: 0, y: 5, w: 2, h: 5, minW: 2, minH: 4 },
    { i: "tasks", x: 0, y: 10, w: 2, h: 7, minW: 2, minH: 6 },
    { i: "custom-alerts", x: 0, y: 17, w: 2, h: 7, minW: 2, minH: 6 },
    { i: "student-roster", x: 0, y: 24, w: 2, h: 9, minW: 2, minH: 8 },
    { i: "lesson-tools", x: 0, y: 33, w: 2, h: 8, minW: 2, minH: 7 },
    { i: "quick-links", x: 0, y: 41, w: 2, h: 5, minW: 2, minH: 4 },
    { i: "sticky-notes", x: 0, y: 46, w: 2, h: 6, minW: 2, minH: 5 },
    { i: "timetable", x: 0, y: 52, w: 2, h: 6, minW: 2, minH: 5 },
    { i: "academic-calendar", x: 0, y: 58, w: 2, h: 5, minW: 2, minH: 4 },
    { i: "weather-readiness", x: 0, y: 63, w: 2, h: 5, minW: 2, minH: 4 },
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
    id: "lesson-tools",
    title: "수업도구",
    subtitle: "뽑기와 점수판",
    component: LessonToolsWidget,
    accent: "blue",
    defaultLayout: lgLayouts[5],
  },
  {
    id: "quick-links",
    title: "바로가기",
    subtitle: "교육 사이트와 중요 링크",
    component: QuickLinksWidget,
    accent: "green",
    defaultLayout: lgLayouts[6],
  },
  {
    id: "sticky-notes",
    title: "포스트잇",
    subtitle: "짧은 메모 카드",
    component: StickyNotesWidget,
    accent: "purple",
    defaultLayout: lgLayouts[7],
  },
  {
    id: "timetable",
    title: "시간표",
    subtitle: "월~금 1~7교시 기본 예시",
    component: TimetableWidget,
    accent: "orange",
    defaultLayout: lgLayouts[8],
  },
  {
    id: "academic-calendar",
    title: "학사일정",
    subtitle: "다가오는 예시 일정",
    component: AcademicCalendarWidget,
    accent: "purple",
    defaultLayout: lgLayouts[9],
  },
  {
    id: "weather-readiness",
    title: "날씨 · 등교 준비",
    subtitle: "실시간 연동 없는 확인 안내",
    component: WeatherReadinessWidget,
    accent: "blue",
    defaultLayout: lgLayouts[10],
  },
];
