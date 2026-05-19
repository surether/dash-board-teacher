import {
  LESSON_TOOLS_MIGRATION_KEY,
  LESSON_TOOLS_STORAGE_KEY,
  STUDENT_ROSTER_MIGRATION_KEY,
  STUDENT_ROSTER_STORAGE_KEY,
  localStorageDashboardAdapter,
} from "./dashboardStorage";

export const widgetStorage = localStorageDashboardAdapter;

export const STORAGE_SCHEMA_VERSION = 1;

export const WIDGET_STORAGE_KEYS = {
  layout: "teacher-widget-dashboard:layouts:v1",
  theme: "teacher-widget-dashboard:theme:v1",
  memo: "teacher-widget-dashboard:memo:v1",
  memoMigrationVersion: "teacher-widget-dashboard:memo:migration-version",
  tasks: "teacher-widget-dashboard:tasks:v1",
  tasksMigrationVersion: "teacher-widget-dashboard:tasks:migration-version",
  customAlerts: "teacher-widget-dashboard:alerts:v1",
  customAlertsMigrationVersion:
    "teacher-widget-dashboard:alerts:migration-version",
  stickyNotes: "teacher-widget-dashboard:sticky-notes:v1",
  stickyNotesMigrationVersion:
    "teacher-widget-dashboard:sticky-notes:migration-version",
  studentRoster: STUDENT_ROSTER_STORAGE_KEY,
  studentRosterMigrationVersion: STUDENT_ROSTER_MIGRATION_KEY,
  lessonTools: LESSON_TOOLS_STORAGE_KEY,
  lessonToolsMigrationVersion: LESSON_TOOLS_MIGRATION_KEY,
} as const;
