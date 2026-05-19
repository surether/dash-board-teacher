import type {
  AttendanceRecord,
  AttendanceStatus,
  ClassInfo,
  CounselingRecord,
  LadderMatchItem,
  LadderToolState,
  LessonPickOptionsState,
  LessonToolRunStatus,
  LessonToolsState,
  PickHistoryItem,
  PomodoroToolState,
  QrCodeToolState,
  RouletteToolState,
  SchoolInfo,
  ScoreboardEntry,
  StudentInfo,
  StudentRosterState,
  StudentStatusMemo,
  TimerToolState,
} from "../types/dashboard";
import {
  clampTimerInput,
  createDefaultLadderState,
  createDefaultPickOptionsState,
  createDefaultPomodoroState,
  createDefaultQrCodeState,
  createDefaultRouletteState,
  createDefaultTimerState,
} from "../utils/lessonToolsUtils";

export const STUDENT_ROSTER_SCHEMA_VERSION = 1;
export const STUDENT_ROSTER_STORAGE_KEY =
  "teacher-widget-dashboard:student-roster:v1";
export const STUDENT_ROSTER_MIGRATION_KEY =
  "teacher-widget-dashboard:student-roster:migration-version";
export const STUDENT_ROSTER_UPDATED_EVENT =
  "teacher-widget-dashboard:student-roster-updated";

export const LESSON_TOOLS_SCHEMA_VERSION = 1;
export const LESSON_TOOLS_STORAGE_KEY =
  "teacher-widget-dashboard:lesson-tools:v1";
export const LESSON_TOOLS_MIGRATION_KEY =
  "teacher-widget-dashboard:lesson-tools:migration-version";
export const LESSON_TOOLS_UPDATED_EVENT =
  "teacher-widget-dashboard:lesson-tools-updated";

export interface DashboardStorageAdapter {
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
  loadStudentRosterState(): Promise<StudentRosterState>;
  saveStudentRosterState(state: StudentRosterState): Promise<void>;
  loadLessonToolsState(): Promise<LessonToolsState>;
  saveLessonToolsState(state: LessonToolsState): Promise<void>;
}

interface StudentRosterStorageEnvelope {
  version: number;
  state: StudentRosterState;
  updatedAt: string;
}

interface LessonToolsStorageEnvelope {
  version: number;
  state: LessonToolsState;
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

function createEmptyLessonToolsState(): LessonToolsState {
  return {
    selectedClassId: null,
    scoreboardEntries: [],
    pickHistory: [],
    pickOptions: createDefaultPickOptionsState(),
    timerState: createDefaultTimerState(),
    pomodoroState: createDefaultPomodoroState(),
    ladderState: createDefaultLadderState(),
    rouletteState: createDefaultRouletteState(),
    qrCodeState: createDefaultQrCodeState(),
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

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
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

function isPickMode(value: unknown): value is PickHistoryItem["mode"] {
  return value === "one" || value === "multiple";
}

function isLessonToolRunStatus(
  value: unknown,
): value is LessonToolRunStatus {
  return (
    value === "idle" ||
    value === "running" ||
    value === "paused" ||
    value === "completed"
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

function normalizeScoreboardEntries(value: unknown): ScoreboardEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isObject)
    .map((entry) => ({
      studentId: asString(entry.studentId),
      score: asNumber(entry.score),
      updatedAt: asString(entry.updatedAt, new Date().toISOString()),
    }))
    .filter((entry) => entry.studentId);
}

function normalizePickHistory(value: unknown): PickHistoryItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isObject)
    .map((history, index) => {
      const pickedStudentIds = asStringArray(history.pickedStudentIds);

      return {
        id: asString(history.id, `pick-${index}`),
        classId: asString(history.classId),
        pickedStudentIds,
        pickedAt: asString(history.pickedAt, new Date().toISOString()),
        mode: isPickMode(history.mode)
          ? history.mode
          : pickedStudentIds.length <= 1
            ? "one"
            : "multiple",
      };
    })
    .filter((history) => history.classId && history.pickedStudentIds.length > 0);
}

function normalizePickOptions(value: unknown): LessonPickOptionsState {
  const fallback = createDefaultPickOptionsState();

  if (!isObject(value)) {
    return fallback;
  }

  return {
    presentOnly:
      typeof value.presentOnly === "boolean"
        ? value.presentOnly
        : fallback.presentOnly,
  };
}

function normalizeLadderMatches(value: unknown): LadderMatchItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isObject)
    .map((match, index) => ({
      id: asString(match.id, `ladder-${index}`),
      participant: asString(match.participant),
      result: asString(match.result),
    }))
    .filter((match) => match.participant && match.result);
}

function normalizeTimerState(value: unknown): TimerToolState {
  const fallback = createDefaultTimerState();

  if (!isObject(value)) {
    return fallback;
  }

  const minutes = clampTimerInput(value.minutes, 0, 180);
  const seconds = clampTimerInput(value.seconds, 0, 59);
  const totalSeconds = minutes * 60 + seconds;
  const remainingSeconds = Math.max(
    0,
    Math.min(asNumber(value.remainingSeconds, totalSeconds), totalSeconds),
  );

  return {
    minutes,
    seconds,
    remainingSeconds,
    status: isLessonToolRunStatus(value.status) ? value.status : fallback.status,
    updatedAt: asOptionalString(value.updatedAt) ?? null,
  };
}

function normalizePomodoroState(value: unknown): PomodoroToolState {
  const fallback = createDefaultPomodoroState();

  if (!isObject(value)) {
    return fallback;
  }

  const durationSeconds = Math.max(
    60,
    Math.min(asNumber(value.durationSeconds, fallback.durationSeconds), 180 * 60),
  );
  const breakDurationSeconds = Math.max(
    60,
    Math.min(
      asNumber(value.breakDurationSeconds, fallback.breakDurationSeconds),
      60 * 60,
    ),
  );
  const mode = value.mode === "break" ? "break" : "focus";
  const activeDurationSeconds =
    mode === "break" ? breakDurationSeconds : durationSeconds;
  const remainingSeconds = Math.max(
    0,
    Math.min(
      asNumber(value.remainingSeconds, activeDurationSeconds),
      activeDurationSeconds,
    ),
  );

  return {
    durationSeconds,
    breakDurationSeconds,
    remainingSeconds,
    status: isLessonToolRunStatus(value.status) ? value.status : fallback.status,
    mode,
    completedCount: Math.max(0, asNumber(value.completedCount)),
    updatedAt: asOptionalString(value.updatedAt) ?? null,
  };
}

function normalizeLadderState(value: unknown): LadderToolState {
  const fallback = createDefaultLadderState();

  if (!isObject(value)) {
    return fallback;
  }

  return {
    participantsText: asString(value.participantsText),
    resultsText: asString(value.resultsText),
    matches: normalizeLadderMatches(value.matches),
    updatedAt: asOptionalString(value.updatedAt) ?? null,
  };
}

function normalizeRouletteState(value: unknown): RouletteToolState {
  const fallback = createDefaultRouletteState();

  if (!isObject(value)) {
    return fallback;
  }

  return {
    itemsText: asString(value.itemsText),
    selectedItem: asOptionalString(value.selectedItem) ?? null,
    spinCount: Math.max(0, asNumber(value.spinCount)),
    updatedAt: asOptionalString(value.updatedAt) ?? null,
  };
}

function normalizeQrCodeState(value: unknown): QrCodeToolState {
  const fallback = createDefaultQrCodeState();

  if (!isObject(value)) {
    return fallback;
  }

  return {
    inputText: asString(value.inputText),
    lastGeneratedText: asString(value.lastGeneratedText),
    updatedAt: asOptionalString(value.updatedAt) ?? null,
  };
}

function extractStudentRosterState(value: unknown): unknown {
  if (isObject(value) && "state" in value) {
    return value.state;
  }

  return value;
}

function extractLessonToolsState(value: unknown): unknown {
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

function normalizeLessonToolsState(value: unknown): LessonToolsState {
  if (!isObject(value)) {
    return createEmptyLessonToolsState();
  }

  return {
    selectedClassId: asOptionalString(value.selectedClassId) ?? null,
    scoreboardEntries: normalizeScoreboardEntries(value.scoreboardEntries),
    pickHistory: normalizePickHistory(value.pickHistory),
    pickOptions: normalizePickOptions(value.pickOptions),
    timerState: normalizeTimerState(value.timerState),
    pomodoroState: normalizePomodoroState(value.pomodoroState),
    ladderState: normalizeLadderState(value.ladderState),
    rouletteState: normalizeRouletteState(value.rouletteState),
    qrCodeState: normalizeQrCodeState(value.qrCodeState),
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

function createLessonToolsEnvelope(
  state: LessonToolsState,
): LessonToolsStorageEnvelope {
  return {
    version: LESSON_TOOLS_SCHEMA_VERSION,
    state: normalizeLessonToolsState(state),
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

function notifyLessonToolsUpdated(state: LessonToolsState) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<LessonToolsState>(LESSON_TOOLS_UPDATED_EVENT, {
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
  },

  async loadLessonToolsState() {
    const storedValue = readStorageValue<
      LessonToolsState | LessonToolsStorageEnvelope
    >(LESSON_TOOLS_STORAGE_KEY);

    const normalizedState = normalizeLessonToolsState(
      extractLessonToolsState(storedValue),
    );

    writeStorageValue(
      LESSON_TOOLS_MIGRATION_KEY,
      LESSON_TOOLS_SCHEMA_VERSION,
    );

    return normalizedState;
  },

  async saveLessonToolsState(state: LessonToolsState) {
    const normalizedState = normalizeLessonToolsState(state);

    writeStorageValue(
      LESSON_TOOLS_STORAGE_KEY,
      createLessonToolsEnvelope(normalizedState),
    );
    writeStorageValue(
      LESSON_TOOLS_MIGRATION_KEY,
      LESSON_TOOLS_SCHEMA_VERSION,
    );
    notifyLessonToolsUpdated(normalizedState);
  },
};
