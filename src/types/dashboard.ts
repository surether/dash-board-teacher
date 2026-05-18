import type { ComponentType } from "react";
import type { Layout } from "react-grid-layout";

export type ThemeMode = "light" | "dark";

export type WidgetId =
  | "clock"
  | "memo"
  | "tasks"
  | "custom-alerts"
  | "neis-api"
  | "excel-upload"
  | "student-roster"
  | "academic-calendar";

export interface WidgetDefinition {
  id: WidgetId;
  title: string;
  subtitle: string;
  component: ComponentType;
  accent: "blue" | "green" | "orange" | "pink" | "purple" | "slate";
  defaultLayout: Layout;
}
