import type {
  AttendanceRecord,
  AttendanceStatus,
  CounselingRecord,
  StudentInfo,
  StudentStatusMemo,
} from "../types/dashboard";

export type AttendanceSummary = Record<AttendanceStatus, number>;

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}`;
}

function createEmptyAttendanceSummary(): AttendanceSummary {
  return {
    present: 0,
    absent: 0,
    late: 0,
    earlyLeave: 0,
    officialAbsent: 0,
    unknown: 0,
  };
}

function dateRank(value: string) {
  const timestamp = new Date(`${value}T00:00:00`).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function isValidStudentNumber(value: number) {
  return Number.isFinite(value) && value > 0;
}

function createTextPreview(value: string, maxLength = 28) {
  const text = value.trim().replace(/\s+/g, " ");

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}...`;
}

export function sortStudents(students: StudentInfo[]): StudentInfo[] {
  return [...students].sort((a, b) => {
    const aHasNumber = isValidStudentNumber(a.number);
    const bHasNumber = isValidStudentNumber(b.number);

    if (aHasNumber !== bHasNumber) {
      return aHasNumber ? -1 : 1;
    }

    if (aHasNumber && bHasNumber && a.number !== b.number) {
      return a.number - b.number;
    }

    return a.name.localeCompare(b.name, "ko-KR");
  });
}

export function filterStudents(
  students: StudentInfo[],
  query: string,
): StudentInfo[] {
  const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR");

  if (!normalizedQuery) {
    return students;
  }

  return students.filter((student) => {
    const name = student.name.toLocaleLowerCase("ko-KR");
    const number = isValidStudentNumber(student.number)
      ? String(student.number)
      : "";

    return name.includes(normalizedQuery) || number.includes(normalizedQuery);
  });
}

export function getAttendanceForDate(
  studentId: string,
  date: string,
  records: AttendanceRecord[],
): AttendanceRecord | undefined {
  return records.find(
    (record) => record.studentId === studentId && record.date === date,
  );
}

export function getCounselingForDate(
  studentId: string,
  date: string,
  records: CounselingRecord[],
): CounselingRecord | undefined {
  return records.find(
    (record) => record.studentId === studentId && record.date === date,
  );
}

export function getStudentStatusMemoForDate(
  studentId: string,
  date: string,
  records: StudentStatusMemo[],
): StudentStatusMemo | undefined {
  return records.find(
    (record) => record.studentId === studentId && record.date === date,
  );
}

export function upsertAttendanceRecord(
  records: AttendanceRecord[],
  input: {
    studentId: string;
    date: string;
    status: AttendanceStatus;
    note?: string;
    updatedAt?: string;
  },
): AttendanceRecord[] {
  const existingRecord = getAttendanceForDate(
    input.studentId,
    input.date,
    records,
  );
  const trimmedNote = input.note?.trim();
  const nextRecord: AttendanceRecord = existingRecord
    ? {
        ...existingRecord,
        status: input.status,
        note: trimmedNote || undefined,
        updatedAt: input.updatedAt ?? new Date().toISOString(),
      }
    : {
        id: createId("attendance"),
        studentId: input.studentId,
        date: input.date,
        status: input.status,
        note: trimmedNote || undefined,
        updatedAt: input.updatedAt ?? new Date().toISOString(),
      };

  return existingRecord
    ? records.map((record) =>
        record.id === existingRecord.id ? nextRecord : record,
      )
    : [...records, nextRecord];
}

export function upsertCounselingRecord(
  records: CounselingRecord[],
  input: {
    studentId: string;
    date: string;
    content: string;
    now?: string;
  },
): CounselingRecord[] {
  const existingRecord = getCounselingForDate(
    input.studentId,
    input.date,
    records,
  );
  const now = input.now ?? new Date().toISOString();

  return existingRecord
    ? records.map((record) =>
        record.id === existingRecord.id
          ? { ...record, content: input.content, updatedAt: now }
          : record,
      )
    : [
        ...records,
        {
          id: createId("counseling"),
          studentId: input.studentId,
          date: input.date,
          content: input.content,
          createdAt: now,
          updatedAt: now,
        },
      ];
}

export function upsertStudentStatusMemo(
  records: StudentStatusMemo[],
  input: {
    studentId: string;
    date: string;
    content: string;
    now?: string;
  },
): StudentStatusMemo[] {
  const existingMemo = getStudentStatusMemoForDate(
    input.studentId,
    input.date,
    records,
  );
  const now = input.now ?? new Date().toISOString();

  return existingMemo
    ? records.map((memo) =>
        memo.id === existingMemo.id
          ? { ...memo, content: input.content, updatedAt: now }
          : memo,
      )
    : [
        ...records,
        {
          id: createId("student-status"),
          studentId: input.studentId,
          date: input.date,
          content: input.content,
          createdAt: now,
          updatedAt: now,
        },
      ];
}

export function getAttendanceSummary(
  students: StudentInfo[],
  date: string,
  records: AttendanceRecord[],
): AttendanceSummary {
  const counts = createEmptyAttendanceSummary();

  students.forEach((student) => {
    const status =
      getAttendanceForDate(student.id, date, records)?.status ?? "unknown";
    counts[status] += 1;
  });

  return counts;
}

export function getRecentCounselingRecords(
  studentId: string,
  records: CounselingRecord[],
  limit = 3,
): CounselingRecord[] {
  return records
    .filter((record) => record.studentId === studentId && record.content.trim())
    .sort((a, b) => dateRank(b.date) - dateRank(a.date))
    .slice(0, limit);
}

export function getRecentStudentStatusMemos(
  studentId: string,
  records: StudentStatusMemo[],
  limit = 3,
): StudentStatusMemo[] {
  return records
    .filter((record) => record.studentId === studentId && record.content.trim())
    .sort((a, b) => dateRank(b.date) - dateRank(a.date))
    .slice(0, limit);
}

export function getRecentAttendanceRecords(
  studentId: string,
  records: AttendanceRecord[],
  limit = 3,
): AttendanceRecord[] {
  return records
    .filter((record) => record.studentId === studentId)
    .sort((a, b) => dateRank(b.date) - dateRank(a.date))
    .slice(0, limit);
}

export function previewText(value: string | undefined, fallback = "없음") {
  return value ? createTextPreview(value) : fallback;
}
