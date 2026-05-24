import type { CsvParserBoundaryResult } from "./csvParserBoundary";
import type {
  AttendanceRecord,
  ClassInfo,
  SchoolInfo,
  StudentInfo,
  StudentRosterState,
} from "../types/dashboard";

const REQUIRED_STUDENT_ROSTER_HEADERS = ["학년", "반", "번호", "성명"] as const;
const NOTE_HEADER = "비고";
const STUDENT_CANDIDATE_PREVIEW_LIMIT = 20;
const SESSION_IMPORT_SCHOOL_ID = "session-import-school";

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

export function createStudentRosterSessionStateFromCandidates(
  candidates: StudentRosterCandidate[],
  appliedAt = new Date().toISOString(),
): StudentRosterState {
  const school: SchoolInfo = {
    id: SESSION_IMPORT_SCHOOL_ID,
    name: "CSV 가져오기",
  };
  const classes: ClassInfo[] = [];
  const classIdByKey = new Map<string, string>();
  const students: StudentInfo[] = [];
  const attendanceRecords: AttendanceRecord[] = [];
  const attendanceDate = formatDateKey(appliedAt);

  candidates.forEach((candidate, index) => {
    const classKey = `${candidate.grade}::${candidate.className}`;
    let classId = classIdByKey.get(classKey);

    if (!classId) {
      classId = `session-class-${classes.length + 1}-${createSlug(
        candidate.grade,
      )}-${createSlug(candidate.className)}`;
      classIdByKey.set(classKey, classId);
      classes.push({
        id: classId,
        schoolId: school.id,
        grade: parseRosterNumber(candidate.grade),
        classNumber: parseRosterNumber(candidate.className),
        displayName: `${candidate.grade}학년 ${candidate.className}반`,
      });
    }

    const studentId = `session-student-${index + 1}-${createSlug(
      candidate.name,
    )}`;
    students.push({
      id: studentId,
      classId,
      number: parseRosterNumber(candidate.number),
      name: candidate.name,
      createdAt: appliedAt,
      updatedAt: appliedAt,
    });
    attendanceRecords.push({
      id: `session-attendance-${index + 1}`,
      studentId,
      date: attendanceDate,
      status: "unknown",
      note: candidate.note || undefined,
      updatedAt: appliedAt,
    });
  });

  const sortedClasses = [...classes].sort(compareClasses);
  const classOrder = new Map(
    sortedClasses.map((classInfo, index) => [classInfo.id, index]),
  );
  const sortedStudents = [...students].sort((a, b) =>
    compareStudents(a, b, classOrder),
  );
  const studentOrder = new Map(
    sortedStudents.map((student, index) => [student.id, index]),
  );
  const sortedAttendanceRecords = [...attendanceRecords].sort(
    (a, b) =>
      (studentOrder.get(a.studentId) ?? Number.MAX_SAFE_INTEGER) -
      (studentOrder.get(b.studentId) ?? Number.MAX_SAFE_INTEGER),
  );

  return {
    selectedClassId: sortedClasses[0]?.id ?? null,
    schools: [school],
    classes: sortedClasses,
    students: sortedStudents,
    attendanceRecords: sortedAttendanceRecords,
    counselingRecords: [],
    studentStatusMemos: [],
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

function compareClasses(a: ClassInfo, b: ClassInfo) {
  const gradeCompare = compareRosterNumbers(a.grade, b.grade);

  if (gradeCompare !== 0) {
    return gradeCompare;
  }

  const classCompare = compareRosterNumbers(a.classNumber, b.classNumber);

  if (classCompare !== 0) {
    return classCompare;
  }

  return a.displayName.localeCompare(b.displayName, "ko-KR");
}

function compareStudents(
  a: StudentInfo,
  b: StudentInfo,
  classOrder: Map<string, number>,
) {
  const classCompare =
    (classOrder.get(a.classId) ?? Number.MAX_SAFE_INTEGER) -
    (classOrder.get(b.classId) ?? Number.MAX_SAFE_INTEGER);

  if (classCompare !== 0) {
    return classCompare;
  }

  const numberCompare = compareRosterNumbers(a.number, b.number);

  if (numberCompare !== 0) {
    return numberCompare;
  }

  return a.name.localeCompare(b.name, "ko-KR");
}

function compareRosterNumbers(a: number, b: number) {
  const aValue = a > 0 ? a : Number.MAX_SAFE_INTEGER;
  const bValue = b > 0 ? b : Number.MAX_SAFE_INTEGER;

  return aValue - bValue;
}

function parseRosterNumber(value: string) {
  const parsed = Number.parseInt(value.trim(), 10);

  return Number.isFinite(parsed) ? parsed : 0;
}

function createSlug(value: string) {
  const normalized = value
    .trim()
    .toLocaleLowerCase("ko-KR")
    .replace(/[^0-9a-z가-힣]+/gi, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "item";
}

function formatDateKey(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
