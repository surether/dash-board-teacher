import type { ComponentType } from "react";
import type { Layout, Layouts } from "react-grid-layout";

export type ThemeMode = "light" | "dark";

export type DashboardWidgetType =
  | "clock"
  | "memo"
  | "tasks"
  | "custom-alerts"
  | "sticky-notes"
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