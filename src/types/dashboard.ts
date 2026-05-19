import type { ComponentType } from "react";
import type { Layout, Layouts } from "react-grid-layout";

export type ThemeMode = "light" | "dark";

export type DashboardWidgetType =
  | "clock"
  | "memo"
  | "tasks"
  | "custom-alerts"
  | "sticky-notes"
  | "lesson-tools"
  | "neis-api"
  | "excel-upload"
  | "student-roster"
  | "academic-calendar";

export type WidgetId = DashboardWidgetType;

export interface DashboardWidgetConfig {
  id: DashboardWidgetType;
  title: string;
  subtitle: string;
  component: ComponentType;
  accent: "blue" | "green" | "orange" | "pink" | "purple" | "slate";
  defaultLayout: Layout;
}

export type WidgetDefinition = DashboardWidgetConfig;

export interface WidgetLayoutState {
  version: number;
  layouts: Layouts;
  updatedAt: string;
}

export type TaskPriority = "green" | "yellow" | "red";

export interface TaskItem {
  id: string;
  label: string;
  done: boolean;
  priority: TaskPriority;
  dueDate: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CustomAlertItem {
  id: string;
  label: string;
  targetDate: string;
  createdAt: string;
  updatedAt?: string;
}

export type StickyNoteColor = "yellow" | "green" | "blue" | "pink" | "gray";

export interface StickyNoteItem {
  id: string;
  text: string;
  color: StickyNoteColor;
  createdAt: string;
  updatedAt?: string;
}

export interface MemoState {
  text: string;
  updatedAt: string | null;
}

export interface SchoolInfo {
  id: string;
  name: string;
  neisSchoolCode?: string;
  officeCode?: string;
}

export interface ClassInfo {
  id: string;
  schoolId: string;
  grade: number;
  classNumber: number;
  displayName: string;
}

export interface StudentInfo {
  id: string;
  classId: string;
  number: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export type AttendanceStatus =
  | "present"
  | "absent"
  | "late"
  | "earlyLeave"
  | "officialAbsent"
  | "unknown";

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  note?: string;
  updatedAt: string;
}

export interface CounselingRecord {
  id: string;
  studentId: string;
  date: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentStatusMemo {
  id: string;
  studentId: string;
  date: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentRosterState {
  selectedClassId: string | null;
  schools: SchoolInfo[];
  classes: ClassInfo[];
  students: StudentInfo[];
  attendanceRecords: AttendanceRecord[];
  counselingRecords: CounselingRecord[];
  studentStatusMemos: StudentStatusMemo[];
}

export interface ScoreboardEntry {
  studentId: string;
  score: number;
  updatedAt: string;
}

export interface PickHistoryItem {
  id: string;
  classId: string;
  pickedStudentIds: string[];
  pickedAt: string;
  mode: "one" | "multiple";
}

export type LessonToolRunStatus = "idle" | "running" | "paused" | "completed";

export interface LessonPickOptionsState {
  presentOnly: boolean;
}

export interface TimerToolState {
  minutes: number;
  seconds: number;
  remainingSeconds: number;
  status: LessonToolRunStatus;
  updatedAt: string | null;
}

export interface PomodoroToolState {
  durationSeconds: number;
  breakDurationSeconds: number;
  remainingSeconds: number;
  status: LessonToolRunStatus;
  mode: "focus" | "break";
  completedCount: number;
  updatedAt: string | null;
}

export interface LadderMatchItem {
  id: string;
  participant: string;
  result: string;
}

export interface LadderToolState {
  participantsText: string;
  resultsText: string;
  matches: LadderMatchItem[];
  updatedAt: string | null;
}

export interface RouletteToolState {
  itemsText: string;
  selectedItem: string | null;
  spinCount: number;
  updatedAt: string | null;
}

export interface QrCodeToolState {
  inputText: string;
  lastGeneratedText: string;
  updatedAt: string | null;
}

export interface LessonToolsState {
  selectedClassId: string | null;
  scoreboardEntries: ScoreboardEntry[];
  pickHistory: PickHistoryItem[];
  pickOptions: LessonPickOptionsState;
  timerState: TimerToolState;
  pomodoroState: PomodoroToolState;
  ladderState: LadderToolState;
  rouletteState: RouletteToolState;
  qrCodeState: QrCodeToolState;
}
