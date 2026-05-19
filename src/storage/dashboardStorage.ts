import type {
  AttendanceRecord,
  AttendanceStatus,
  ClassInfo,
  CounselingRecord,
  SchoolInfo,
  StudentInfo,
  StudentRosterState,
  StudentStatusMemo,
} from "../types/dashboard";

export const STUDENT_ROSTER_SCHEMA_VERSION = 1;
export const STUDENT_ROSTER_STORAGE_KEY =
  "teacher-widget-dashboard:student-roster:v1";
export const STUDENT_ROSTER_MIGRATION_KEY =
  "teacher-widget-dashboard:student-roster:migration-version";
export const STUDENT_ROSTER_UPDATED_EVENT =
  "teacher-widget-dashboard:student-roster-updated";


export interface DashboardStorageAdapter {
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
  loadStudentRosterState(): Promise<StudentRosterState>;
  saveStudentRosterState(state: StudentRosterState): Promise<void>;
}

interface StudentRosterStorageEnvelope {
  version: number;
  state: StudentRosterState;
  updatedAt: string;
}


function createEmptyStudentRosterState(): StudentRosterState {
  return {
    selectedClassId: null,
    schools: [],
    classes: [],
    students: [],
    attendanceRecords: [],
    counselingRecords: [],
    studentStatusMemos: [],
  };
}


function readStorageValue<T>(key: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(key);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return rawValue as T;
  }
}

function writeStorageValue<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function removeStorageValue(key: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(key);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asOptionalString(value: unknown) {
  return typeof value === "string" && value ? value : undefined;
}

function asNumber(value: unknown, fallback = 0) {
  const numericValue =
    typeof value === "number" ? value : Number.parseInt(String(value), 10);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}


function isAttendanceStatus(value: unknown): value is AttendanceStatus {
  return (
    value === "present" ||
    value === "absent" ||
    value === "late" ||
    value === "earlyLeave" ||
    value === "officialAbsent" ||
    value === "unknown"
  );
}


function normalizeSchools(value: unknown): SchoolInfo[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isObject).map((school, index) => ({
    id: asString(school.id, `school-${index}`),
    name: asString(school.name, "이름 없는 학교"),
    neisSchoolCode: asOptionalString(school.neisSchoolCode),
    officeCode: asOptionalString(school.officeCode),
  }));
}

function normalizeClasses(value: unknown): ClassInfo[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isObject).map((classInfo, index) => {
    const grade = asNumber(classInfo.grade, 1);
    const classNumber = asNumber(classInfo.classNumber, index + 1);

    return {
      id: asString(classInfo.id, `class-${index}`),
      schoolId: asString(classInfo.schoolId),
      grade,
      classNumber,
      displayName: asString(
        classInfo.displayName,
        `${grade}학년 ${classNumber}반`,
      ),
    };
  });
}

function normalizeStudents(value: unknown): StudentInfo[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isObject).map((student, index) => {
    const now = new Date().toISOString();

    return {
      id: asString(student.id, `student-${index}`),
      classId: asString(student.classId),
      number: asNumber(student.number, index + 1),
      name: asString(student.name, "이름 없음"),
      createdAt: asString(student.createdAt, now),
      updatedAt: asString(student.updatedAt, now),
    };
  });
}

function normalizeAttendanceRecords(value: unknown): AttendanceRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isObject).map((record, index) => ({
    id: asString(record.id, `attendance-${index}`),
    studentId: asString(record.studentId),
    date: asString(record.date),
    status: isAttendanceStatus(record.status) ? record.status : "unknown",
    note: asOptionalString(record.note),
    updatedAt: asString(record.updatedAt, new Date().toISOString()),
  }));
}

function normalizeCounselingRecords(value: unknown): CounselingRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isObject).map((record, index) => {
    const now = new Date().toISOString();

    return {
      id: asString(record.id, `counseling-${index}`),
      studentId: asString(record.studentId),
      date: asString(record.date),
      content: asString(record.content),
      createdAt: asString(record.createdAt, now),
      updatedAt: asString(record.updatedAt, now),
    };
  });
}

function normalizeStudentStatusMemos(value: unknown): StudentStatusMemo[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isObject).map((memo, index) => {
    const now = new Date().toISOString();

    return {
      id: asString(memo.id, `student-status-${index}`),
      studentId: asString(memo.studentId),
      date: asString(memo.date),
      content: asString(memo.content),
      createdAt: asString(memo.createdAt, now),
      updatedAt: asString(memo.updatedAt, now),
    };
  });
}


function extractStudentRosterState(value: unknown): unknown {
  if (isObject(value) && "state" in value) {
    return value.state;
  }

  return value;
}


function normalizeStudentRosterState(value: unknown): StudentRosterState {
  if (!isObject(value)) {
    return createEmptyStudentRosterState();
  }

  const classes = normalizeClasses(value.classes);
  const selectedClassId = asOptionalString(value.selectedClassId);
  const selectedClassExists = classes.some((item) => item.id === selectedClassId);

  return {
    selectedClassId: selectedClassExists ? selectedClassId ?? null : null,
    schools: normalizeSchools(value.schools),
    classes,
    students: normalizeStudents(value.students),
    attendanceRecords: normalizeAttendanceRecords(value.attendanceRecords),
    counselingRecords: normalizeCounselingRecords(value.counselingRecords),
    studentStatusMemos: normalizeStudentStatusMemos(value.studentStatusMemos),
  };
}


function createStudentRosterEnvelope(
  state: StudentRosterState,
): StudentRosterStorageEnvelope {
  return {
    version: STUDENT_ROSTER_SCHEMA_VERSION,
    state: normalizeStudentRosterState(state),
    updatedAt: new Date().toISOString(),
  };
}


function notifyStudentRosterUpdated(state: StudentRosterState) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<StudentRosterState>(STUDENT_ROSTER_UPDATED_EVENT, {
      detail: state,
    }),
  );
}


export const localStorageDashboardAdapter: DashboardStorageAdapter = {
  async getItem<T>(key: string) {
    return readStorageValue<T>(key);
  },

  async setItem<T>(key: string, value: T) {
    writeStorageValue(key, value);
  },

  async removeItem(key: string) {
    removeStorageValue(key);
  },

  async loadStudentRosterState() {
    const storedValue = readStorageValue<
      StudentRosterState | StudentRosterStorageEnvelope
    >(STUDENT_ROSTER_STORAGE_KEY);

    const normalizedState = normalizeStudentRosterState(
      extractStudentRosterState(storedValue),
    );

    writeStorageValue(
      STUDENT_ROSTER_MIGRATION_KEY,
      STUDENT_ROSTER_SCHEMA_VERSION,
    );

    return normalizedState;
  },

  async saveStudentRosterState(state: StudentRosterState) {
    const normalizedState = normalizeStudentRosterState(state);

    writeStorageValue(
      STUDENT_ROSTER_STORAGE_KEY,
      createStudentRosterEnvelope(normalizedState),
    );
    writeStorageValue(
      STUDENT_ROSTER_MIGRATION_KEY,
      STUDENT_ROSTER_SCHEMA_VERSION,
    );
    notifyStudentRosterUpdated(normalizedState);
  }
};
