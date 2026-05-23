import type { CsvParserBoundaryResult } from "./csvParserBoundary";

const REQUIRED_STUDENT_ROSTER_HEADERS = ["학년", "반", "번호", "성명"] as const;
const NOTE_HEADER = "비고";
const STUDENT_CANDIDATE_PREVIEW_LIMIT = 20;

export type StudentRosterCandidate = {
  grade: string;
  className: string;
  number: string;
  name: string;
  note: string;
  sourceRowIndex: number;
};

export type StudentRosterCandidateIssue = {
  rowIndex?: number;
  level: "error" | "warning";
  message: string;
};

export type StudentRosterCandidateSummary = {
  totalDataRowCount: number;
  recognizedStudentCount: number;
  issueRowCount: number;
};

export type StudentRosterCandidateResult = {
  status: "ready" | "error" | "unsupported";
  candidates: StudentRosterCandidate[];
  previewCandidates: StudentRosterCandidate[];
  issues: StudentRosterCandidateIssue[];
  summary: StudentRosterCandidateSummary;
};

export function createStudentRosterCandidateResult(
  csvPreview: CsvParserBoundaryResult | null,
): StudentRosterCandidateResult | null {
  if (!csvPreview || csvPreview.status !== "ready") {
    return null;
  }

  const [headerRow, ...dataRows] = csvPreview.previewRows;
  const totalDataRowCount = Math.max((csvPreview.rowCount ?? 0) - 1, 0);

  if (!headerRow) {
    return createStudentRosterCandidateErrorResult(
      totalDataRowCount,
      "학생명렬 헤더 행을 찾을 수 없습니다.",
    );
  }

  const headerIndexes = createHeaderIndexMap(headerRow.values);
  const missingHeaders = REQUIRED_STUDENT_ROSTER_HEADERS.filter(
    (header) => headerIndexes.get(header) === undefined,
  );

  if (missingHeaders.length > 0) {
    return createStudentRosterCandidateErrorResult(
      totalDataRowCount,
      `필수 헤더가 없습니다: ${missingHeaders.join(", ")}`,
    );
  }

  const issues: StudentRosterCandidateIssue[] = [];
  const candidates: StudentRosterCandidate[] = [];

  for (const row of dataRows) {
    if (isEmptyCsvRow(row.values)) {
      continue;
    }

    const candidate = {
      grade: getCell(row.values, headerIndexes, "학년"),
      className: getCell(row.values, headerIndexes, "반"),
      number: getCell(row.values, headerIndexes, "번호"),
      name: getCell(row.values, headerIndexes, "성명"),
      note: getCell(row.values, headerIndexes, NOTE_HEADER),
      sourceRowIndex: row.rowIndex,
    };
    const missingFields = getMissingRequiredFields(candidate);

    if (missingFields.length > 0) {
      issues.push({
        rowIndex: row.rowIndex,
        level: "error",
        message: `${missingFields.join(", ")} 값이 비어 있습니다.`,
      });
      continue;
    }

    candidates.push(candidate);
  }

  return {
    status: issues.length > 0 ? "error" : "ready",
    candidates,
    previewCandidates: candidates.slice(0, STUDENT_CANDIDATE_PREVIEW_LIMIT),
    issues,
    summary: {
      totalDataRowCount,
      recognizedStudentCount: candidates.length,
      issueRowCount: issues.length,
    },
  };
}

function createStudentRosterCandidateErrorResult(
  totalDataRowCount: number,
  message: string,
): StudentRosterCandidateResult {
  return {
    status: "error",
    candidates: [],
    previewCandidates: [],
    issues: [
      {
        level: "error",
        message,
      },
    ],
    summary: {
      totalDataRowCount,
      recognizedStudentCount: 0,
      issueRowCount: 1,
    },
  };
}

function createHeaderIndexMap(values: string[]) {
  const entries: Array<[string, number]> = values.map((value, index) => [
    normalizeHeader(value),
    index,
  ]);

  return new Map<string, number>(entries);
}

function normalizeHeader(value: string) {
  return value.replace(/^\uFEFF/, "").trim();
}

function isEmptyCsvRow(values: string[]) {
  return values.every((value) => value.trim().length === 0);
}

function getCell(
  values: string[],
  headerIndexes: Map<string, number>,
  headerName: string,
) {
  const index = headerIndexes.get(headerName);

  if (index === undefined) {
    return "";
  }

  return (values[index] ?? "").trim();
}

function getMissingRequiredFields(candidate: StudentRosterCandidate) {
  const missingFields: string[] = [];

  if (!candidate.grade) {
    missingFields.push("학년");
  }

  if (!candidate.className) {
    missingFields.push("반");
  }

  if (!candidate.number) {
    missingFields.push("번호");
  }

  if (!candidate.name) {
    missingFields.push("성명");
  }

  return missingFields;
}
