import type {
  ExcelColumnMapping,
  ExcelPreviewRow,
  StudentRosterImportPlan,
} from "../types/dashboard";

export const STUDENT_ROSTER_IMPORT_TARGET = "studentRoster" as const;
export const STUDENT_ROSTER_IMPORT_MAPPER_STATUS = "not-implemented" as const;

export interface StudentRosterImportPlanInput {
  selectedClassId: string | null;
  rows: ExcelPreviewRow[];
  mappings: ExcelColumnMapping[];
  createdAt: string;
}

export interface StudentRosterImportMapper {
  createPlan(input: StudentRosterImportPlanInput): StudentRosterImportPlan;
}
