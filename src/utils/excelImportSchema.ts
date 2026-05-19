import type {
  ExcelColumnMapping,
  ExcelImportDraft,
  ExcelImportTarget,
  ExcelImportValidationIssue,
  ExcelPreviewRow,
} from "../types/dashboard";

export interface ExcelImportSchema {
  target: ExcelImportTarget;
  title: string;
  description: string;
  mappings: ExcelColumnMapping[];
}

const VALID_WEEKDAYS = new Set(["월", "화", "수", "목", "금"]);

const IMPORT_SCHEMAS: Record<ExcelImportTarget, ExcelImportSchema> = {
  studentRoster: {
    target: "studentRoster",
    title: "학생 명렬표",
    description: "번호와 이름을 중심으로 학생 목록을 준비합니다.",
    mappings: [
      {
        sourceColumn: "번호",
        targetField: "number",
        required: false,
        label: "번호",
      },
      {
        sourceColumn: "이름",
        targetField: "name",
        required: true,
        label: "이름",
      },
      {
        sourceColumn: "성별",
        targetField: "gender",
        required: false,
        label: "성별",
      },
      {
        sourceColumn: "학번",
        targetField: "studentCode",
        required: false,
        label: "학번",
      },
      {
        sourceColumn: "비고",
        targetField: "note",
        required: false,
        label: "비고",
      },
    ],
  },
  teacherTimetable: {
    target: "teacherTimetable",
    title: "교사 시간표",
    description: "요일, 교시, 수업명을 기준으로 교사 시간표를 준비합니다.",
    mappings: [
      {
        sourceColumn: "요일",
        targetField: "weekday",
        required: true,
        label: "요일",
      },
      {
        sourceColumn: "교시",
        targetField: "period",
        required: true,
        label: "교시",
      },
      {
        sourceColumn: "과목/수업명",
        targetField: "subject",
        required: false,
        label: "과목/수업명",
      },
      {
        sourceColumn: "반",
        targetField: "className",
        required: false,
        label: "반",
      },
      {
        sourceColumn: "교실",
        targetField: "room",
        required: false,
        label: "교실",
      },
      {
        sourceColumn: "비고",
        targetField: "note",
        required: false,
        label: "비고",
      },
    ],
  },
  classTimetable: {
    target: "classTimetable",
    title: "학급 시간표",
    description: "학급 기준의 요일, 교시, 과목 정보를 준비합니다.",
    mappings: [
      {
        sourceColumn: "요일",
        targetField: "weekday",
        required: true,
        label: "요일",
      },
      {
        sourceColumn: "교시",
        targetField: "period",
        required: true,
        label: "교시",
      },
      {
        sourceColumn: "과목",
        targetField: "subject",
        required: true,
        label: "과목",
      },
      {
        sourceColumn: "담당교사",
        targetField: "teacherName",
        required: false,
        label: "담당교사",
      },
      {
        sourceColumn: "교실",
        targetField: "room",
        required: false,
        label: "교실",
      },
      {
        sourceColumn: "비고",
        targetField: "note",
        required: false,
        label: "비고",
      },
    ],
  },
};

const SAMPLE_PREVIEW_ROWS: Record<ExcelImportTarget, ExcelPreviewRow[]> = {
  studentRoster: [
    {
      rowIndex: 2,
      values: {
        번호: "1",
        이름: "김민준",
        성별: "남",
        학번: "20260101",
        비고: "",
      },
    },
    {
      rowIndex: 3,
      values: {
        번호: "2",
        이름: "이서연",
        성별: "여",
        학번: "20260102",
        비고: "전입",
      },
    },
    {
      rowIndex: 4,
      values: {
        번호: "2",
        이름: "박도윤",
        성별: "남",
        학번: "20260103",
        비고: "",
      },
    },
  ],
  teacherTimetable: [
    {
      rowIndex: 2,
      values: {
        요일: "월",
        교시: "1",
        "과목/수업명": "국어",
        반: "3학년 2반",
        교실: "3-2",
        비고: "",
      },
    },
    {
      rowIndex: 3,
      values: {
        요일: "수",
        교시: "4",
        "과목/수업명": "",
        반: "3학년 2반",
        교실: "과학실",
        비고: "교과전담",
      },
    },
  ],
  classTimetable: [
    {
      rowIndex: 2,
      values: {
        요일: "화",
        교시: "2",
        과목: "수학",
        담당교사: "김교사",
        교실: "3-2",
        비고: "",
      },
    },
    {
      rowIndex: 3,
      values: {
        요일: "금",
        교시: "6",
        과목: "창체",
        담당교사: "이교사",
        교실: "강당",
        비고: "동아리",
      },
    },
  ],
};

export function getImportSchema(target: ExcelImportTarget): ExcelImportSchema {
  return IMPORT_SCHEMAS[target];
}

export function getRequiredFieldsForImportTarget(
  target: ExcelImportTarget,
): string[] {
  return getImportSchema(target)
    .mappings.filter((mapping) => mapping.required)
    .map((mapping) => mapping.targetField);
}

export function getSamplePreviewRows(
  target: ExcelImportTarget,
): ExcelPreviewRow[] {
  return SAMPLE_PREVIEW_ROWS[target].map((row) => ({
    rowIndex: row.rowIndex,
    values: { ...row.values },
  }));
}

export function createEmptyImportDraft(
  target: ExcelImportTarget = "studentRoster",
): ExcelImportDraft {
  const schema = getImportSchema(target);
  const previewRows = getSamplePreviewRows(target);

  return {
    target,
    columns: schema.mappings.map((mapping) => mapping.sourceColumn),
    mappings: schema.mappings.map((mapping) => ({ ...mapping })),
    previewRows,
    issues: validatePreviewRows(target, previewRows),
    status: "idle",
  };
}

export function validatePreviewRows(
  target: ExcelImportTarget,
  rows: ExcelPreviewRow[],
): ExcelImportValidationIssue[] {
  if (target === "studentRoster") {
    return validateStudentRosterRows(rows);
  }

  return validateTimetableRows(rows, target);
}

function getMappedValue(
  target: ExcelImportTarget,
  row: ExcelPreviewRow,
  targetField: string,
) {
  const mapping = getImportSchema(target).mappings.find(
    (item) => item.targetField === targetField,
  );

  if (!mapping) {
    return "";
  }

  return (row.values[mapping.sourceColumn] ?? "").trim();
}

function validateStudentRosterRows(
  rows: ExcelPreviewRow[],
): ExcelImportValidationIssue[] {
  const issues: ExcelImportValidationIssue[] = [];
  const rowsByNumber = new Map<string, number[]>();

  rows.forEach((row) => {
    const number = getMappedValue("studentRoster", row, "number");
    const name = getMappedValue("studentRoster", row, "name");

    if (!name) {
      issues.push({
        rowIndex: row.rowIndex,
        field: "name",
        level: "error",
        message: "이름은 필수입니다.",
      });
    }

    if (!number) {
      issues.push({
        rowIndex: row.rowIndex,
        field: "number",
        level: "warning",
        message: "번호가 없으면 정렬 정확도가 낮아질 수 있습니다.",
      });
      return;
    }

    rowsByNumber.set(number, [...(rowsByNumber.get(number) ?? []), row.rowIndex]);
  });

  rowsByNumber.forEach((rowIndexes, number) => {
    if (rowIndexes.length <= 1) {
      return;
    }

    rowIndexes.forEach((rowIndex) => {
      issues.push({
        rowIndex,
        field: "number",
        level: "warning",
        message: `${number}번이 다른 행과 중복됩니다.`,
      });
    });
  });

  return issues;
}

function validateTimetableRows(
  rows: ExcelPreviewRow[],
  target: Extract<ExcelImportTarget, "teacherTimetable" | "classTimetable">,
): ExcelImportValidationIssue[] {
  const issues: ExcelImportValidationIssue[] = [];
  const subjectLevel = target === "classTimetable" ? "error" : "warning";

  rows.forEach((row) => {
    const weekday = getMappedValue(target, row, "weekday");
    const period = getMappedValue(target, row, "period");
    const subject = getMappedValue(target, row, "subject");

    if (!weekday || !VALID_WEEKDAYS.has(weekday)) {
      issues.push({
        rowIndex: row.rowIndex,
        field: "weekday",
        level: "error",
        message: "요일은 월~금 중 하나여야 합니다.",
      });
    }

    if (!period || !isValidPeriod(period)) {
      issues.push({
        rowIndex: row.rowIndex,
        field: "period",
        level: "error",
        message: "교시는 1~7 범위여야 합니다.",
      });
    }

    if (!subject) {
      issues.push({
        rowIndex: row.rowIndex,
        field: "subject",
        level: subjectLevel,
        message:
          target === "classTimetable"
            ? "학급 시간표의 과목은 필수입니다."
            : "교사 시간표의 과목/수업명이 비어 있습니다.",
      });
    }
  });

  return issues;
}

function isValidPeriod(value: string) {
  const period = Number.parseInt(value, 10);

  return String(period) === value && period >= 1 && period <= 7;
}
