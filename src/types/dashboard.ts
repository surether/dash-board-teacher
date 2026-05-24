import type { ComponentType } from "react";
import type { Layout, Layouts } from "react-grid-layout";

export type ThemeMode = "light" | "dark";

export type DashboardWidgetType =
  | "clock"
  | "memo"
  | "tasks"
  | "custom-alerts"
  | "quick-links"
  | "timetable"
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

export type ExcelImportTarget =
  | "studentRoster"
  | "teacherTimetable"
  | "classTimetable";

export interface ExcelColumnMapping {
  sourceColumn: string;
  targetField: string;
  required: boolean;
  label: string;
}

export interface ExcelPreviewRow {
  rowIndex: number;
  values: Record<string, string>;
}

export type ExcelImportValidationLevel = "error" | "warning";

export interface ExcelImportValidationIssue {
  rowIndex?: number;
  field?: string;
  level: ExcelImportValidationLevel;
  message: string;
}

export type ExcelImportDraftStatus =
  | "idle"
  | "selected"
  | "mapped"
  | "validated"
  | "ready"
  | "error";

export interface ExcelImportDraft {
  target: ExcelImportTarget;
  fileName?: string;
  columns: string[];
  mappings: ExcelColumnMapping[];
  previewRows: ExcelPreviewRow[];
  issues: ExcelImportValidationIssue[];
  status: ExcelImportDraftStatus;
}

export type ExcelImportPipelineStage =
  | "source"
  | "parse"
  | "mapping"
  | "preview"
  | "validation"
  | "importPlan"
  | "apply";

export type ExcelImportAdapterStatus =
  | "idle"
  | "ready"
  | "blocked"
  | "error";

export interface ExcelImportSourceMeta {
  id: string;
  fileName: string;
  selectedAt: string;
  size?: number;
  mimeType?: string;
  lastModified?: number;
}

export interface ExcelImportSourceResult {
  status: ExcelImportAdapterStatus;
  source: ExcelImportSourceMeta | null;
  issues: ExcelImportValidationIssue[];
}

export interface ExcelParsedSheet {
  sheetName: string;
  columns: string[];
  rows: ExcelPreviewRow[];
}

export interface ExcelParsedWorkbook {
  source: ExcelImportSourceMeta;
  sheets: ExcelParsedSheet[];
  parsedAt: string;
}

export interface ExcelWorkbookParseResult {
  status: ExcelImportAdapterStatus;
  workbook: ExcelParsedWorkbook | null;
  issues: ExcelImportValidationIssue[];
}

export type ExcelImportApplyBlockReason =
  | "adapter-not-implemented"
  | "no-selected-class"
  | "validation-errors"
  | "student-roster-plan-only"
  | "timetable-storage-not-ready";

export interface StudentRosterImportCandidate {
  rowIndex: number;
  number: number | null;
  name: string;
  gender?: string;
  studentCode?: string;
  note?: string;
}

export interface StudentRosterImportPlanSummary {
  totalRows: number;
  candidateCount: number;
  addCount: number;
  errorCount: number;
  warningCount: number;
}

export interface StudentRosterImportPlan {
  target: "studentRoster";
  selectedClassId: string | null;
  candidates: StudentRosterImportCandidate[];
  issues: ExcelImportValidationIssue[];
  summary: StudentRosterImportPlanSummary;
  canApply: boolean;
  blockReason?: ExcelImportApplyBlockReason;
  createdAt: string;
}

export type TimetableImportApplyTarget = Extract<
  ExcelImportTarget,
  "teacherTimetable" | "classTimetable"
>;

export interface TimetableImportApplyBlocked {
  target: TimetableImportApplyTarget;
  status: "applyBlocked";
  reason: "timetable-storage-not-ready";
  message: string;
}

export type ExcelImportApplyBoundary =
  | StudentRosterImportPlan
  | TimetableImportApplyBlocked;
