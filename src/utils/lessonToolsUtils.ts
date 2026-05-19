import type {
  AttendanceRecord,
  LadderMatchItem,
  LadderToolState,
  LessonPickOptionsState,
  PomodoroToolState,
  QrCodeToolState,
  RouletteToolState,
  ScoreboardEntry,
  StudentInfo,
  TimerToolState,
} from "../types/dashboard";

const DEFAULT_POMODORO_SECONDS = 25 * 60;
const DEFAULT_POMODORO_BREAK_SECONDS = 5 * 60;
const PICK_EXCLUDED_ATTENDANCE_STATUSES = new Set([
  "absent",
  "earlyLeave",
  "officialAbsent",
]);

function clampPickCount(count: number, max: number) {
  if (!Number.isFinite(count)) {
    return 0;
  }

  return Math.max(0, Math.min(Math.floor(count), max));
}

function shuffleStudents(students: StudentInfo[]): StudentInfo[] {
  const shuffled = [...students];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function shuffleItems<T>(items: T[]): T[] {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

export function pickRandomStudent(students: StudentInfo[]): StudentInfo | null {
  if (students.length === 0) {
    return null;
  }

  return students[Math.floor(Math.random() * students.length)];
}

export function pickRandomStudents(
  students: StudentInfo[],
  count: number,
): StudentInfo[] {
  const limit = clampPickCount(count, students.length);

  if (limit === 0) {
    return [];
  }

  return shuffleStudents(students).slice(0, limit);
}

export function initializeScoreboardFromStudents(
  students: StudentInfo[],
  entries: ScoreboardEntry[],
): ScoreboardEntry[] {
  const now = new Date().toISOString();
  const entryByStudentId = new Map(
    entries.map((entry) => [entry.studentId, entry]),
  );

  return students.map((student) => {
    const existingEntry = entryByStudentId.get(student.id);

    return existingEntry
      ? { ...existingEntry }
      : {
          studentId: student.id,
          score: 0,
          updatedAt: now,
        };
  });
}

export function updateScore(
  entries: ScoreboardEntry[],
  studentId: string,
  delta: number,
): ScoreboardEntry[] {
  const now = new Date().toISOString();
  const existingEntry = entries.find((entry) => entry.studentId === studentId);

  if (!existingEntry) {
    return [
      ...entries,
      {
        studentId,
        score: delta,
        updatedAt: now,
      },
    ];
  }

  return entries.map((entry) =>
    entry.studentId === studentId
      ? {
          ...entry,
          score: entry.score + delta,
          updatedAt: now,
        }
      : entry,
  );
}

export function resetScoreboard(
  students: StudentInfo[],
  entries: ScoreboardEntry[],
): ScoreboardEntry[] {
  const now = new Date().toISOString();
  const studentIds = new Set(students.map((student) => student.id));
  const untouchedEntries = entries.filter(
    (entry) => !studentIds.has(entry.studentId),
  );
  const resetEntries = students.map((student) => ({
    studentId: student.id,
    score: 0,
    updatedAt: now,
  }));

  return [...untouchedEntries, ...resetEntries];
}

export function formatSecondsToMMSS(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0",
  )}`;
}

export function clampTimerInput(value: unknown, min = 0, max = 59) {
  const numericValue =
    typeof value === "number" ? value : Number.parseInt(String(value), 10);

  if (!Number.isFinite(numericValue)) {
    return min;
  }

  return Math.max(min, Math.min(Math.floor(numericValue), max));
}

export function createDefaultTimerState(): TimerToolState {
  return {
    minutes: 5,
    seconds: 0,
    remainingSeconds: 5 * 60,
    status: "idle",
    updatedAt: null,
  };
}

export function createDefaultPomodoroState(): PomodoroToolState {
  return {
    durationSeconds: DEFAULT_POMODORO_SECONDS,
    breakDurationSeconds: DEFAULT_POMODORO_BREAK_SECONDS,
    remainingSeconds: DEFAULT_POMODORO_SECONDS,
    status: "idle",
    mode: "focus",
    completedCount: 0,
    updatedAt: null,
  };
}

export function createDefaultPickOptionsState(): LessonPickOptionsState {
  return {
    presentOnly: false,
  };
}

export function parseMultilineItems(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function createLadderMatches(
  participants: string[],
  results: string[],
): LadderMatchItem[] {
  const shuffledResults = shuffleItems(results);

  return participants.map((participant, index) => ({
    id: createId("ladder"),
    participant,
    result: shuffledResults[index],
  }));
}

export function pickRouletteItem(items: string[]): string | null {
  if (items.length < 2) {
    return null;
  }

  return items[Math.floor(Math.random() * items.length)];
}

export function createDefaultLadderState(): LadderToolState {
  return {
    participantsText: "",
    resultsText: "",
    matches: [],
    updatedAt: null,
  };
}

export function createDefaultRouletteState(): RouletteToolState {
  return {
    itemsText: "",
    selectedItem: null,
    spinCount: 0,
    updatedAt: null,
  };
}

export function createDefaultQrCodeState(): QrCodeToolState {
  return {
    inputText: "",
    lastGeneratedText: "",
    updatedAt: null,
  };
}

export function normalizeQrInput(value: string): string {
  return value.trim();
}

export function isQrInputValid(value: string): boolean {
  return normalizeQrInput(value).length > 0;
}

export function getTodayDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getEligibleStudentsForPick(
  students: StudentInfo[],
  attendanceRecords: AttendanceRecord[],
  date: string,
  presentOnly: boolean,
): StudentInfo[] {
  if (!presentOnly) {
    return students;
  }

  return students.filter((student) => {
    const attendance = attendanceRecords.find(
      (record) => record.studentId === student.id && record.date === date,
    );

    return !PICK_EXCLUDED_ATTENDANCE_STATUSES.has(attendance?.status ?? "");
  });
}

export function fillTextFromStudents(students: StudentInfo[]): string {
  return students
    .map((student) =>
      student.number > 0 ? `${student.number}번 ${student.name}` : student.name,
    )
    .join("\n");
}
