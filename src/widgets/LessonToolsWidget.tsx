import { useEffect, useMemo, useState } from "react";
import {
  Copy,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Shuffle,
  Users,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  LESSON_TOOLS_UPDATED_EVENT,
  STUDENT_ROSTER_UPDATED_EVENT,
} from "../storage/dashboardStorage";
import { widgetStorage } from "../storage/widgetStorage";
import type {
  LadderToolState,
  LessonToolsState,
  PickHistoryItem,
  PomodoroToolState,
  QrCodeToolState,
  RouletteToolState,
  StudentInfo,
  StudentRosterState,
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
  createLadderMatches,
  fillTextFromStudents,
  formatSecondsToMMSS,
  getEligibleStudentsForPick,
  getTodayDateString,
  initializeScoreboardFromStudents,
  parseMultilineItems,
  pickRandomStudent,
  pickRandomStudents,
  pickRouletteItem,
  isQrInputValid,
  normalizeQrInput,
  resetScoreboard,
  updateScore,
} from "../utils/lessonToolsUtils";
import { sortStudents } from "../utils/studentRosterUtils";

type LessonToolMode =
  | "one"
  | "multiple"
  | "scoreboard"
  | "timer"
  | "ladder"
  | "roulette"
  | "qr"
  | "pomodoro";

const lessonToolTabs: Array<{ id: LessonToolMode; label: string }> = [
  { id: "one", label: "1명 뽑기" },
  { id: "multiple", label: "N명 뽑기" },
  { id: "scoreboard", label: "점수판" },
  { id: "timer", label: "타이머" },
  { id: "ladder", label: "사다리" },
  { id: "roulette", label: "룰렛" },
  { id: "qr", label: "QR코드" },
  { id: "pomodoro", label: "뽀모도로" },
];

function getPomodoroStatusText(pomodoroState: PomodoroToolState) {
  if (pomodoroState.status === "paused") {
    return "일시정지";
  }

  if (pomodoroState.status === "idle") {
    return "대기";
  }

  if (pomodoroState.status === "running") {
    return pomodoroState.mode === "break" ? "휴식 중" : "집중 중";
  }

  return pomodoroState.mode === "break" ? "휴식 완료" : "집중 완료";
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

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}`;
}

function formatStudentName(student: StudentInfo | undefined) {
  if (!student) {
    return "알 수 없는 학생";
  }

  return student.number > 0
    ? `${student.number}번 ${student.name}`
    : student.name;
}

function formatPickedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function findSelectedClassId(
  rosterState: StudentRosterState,
  lessonToolsState: LessonToolsState,
) {
  const lessonClassId = lessonToolsState.selectedClassId;
  const lessonClassExists = rosterState.classes.some(
    (classInfo) => classInfo.id === lessonClassId,
  );

  if (lessonClassId && lessonClassExists) {
    return lessonClassId;
  }

  return rosterState.selectedClassId ?? rosterState.classes[0]?.id ?? "";
}

function getTimerTotalSeconds(timerState: TimerToolState) {
  return timerState.minutes * 60 + timerState.seconds;
}

function playCompletionBeep() {
  try {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    gain.gain.setValueAtTime(0.001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.22);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.24);
    window.setTimeout(() => {
      void audioContext.close();
    }, 320);
  } catch {
    // Browser audio policies can block this. The visual completion state remains.
  }
}

export function LessonToolsWidget() {
  const [rosterState, setRosterState] = useState<StudentRosterState>(
    createEmptyStudentRosterState,
  );
  const [lessonToolsState, setLessonToolsState] = useState<LessonToolsState>(
    createEmptyLessonToolsState,
  );
  const [activeTool, setActiveTool] = useState<LessonToolMode>("one");
  const [singleResultId, setSingleResultId] = useState<string | null>(null);
  const [multipleResultIds, setMultipleResultIds] = useState<string[]>([]);
  const [pickCount, setPickCount] = useState("2");
  const [statusText, setStatusText] = useState("불러오는 중");

  const timerState = lessonToolsState.timerState ?? createDefaultTimerState();
  const pomodoroState =
    lessonToolsState.pomodoroState ?? createDefaultPomodoroState();
  const ladderState = lessonToolsState.ladderState ?? createDefaultLadderState();
  const rouletteState =
    lessonToolsState.rouletteState ?? createDefaultRouletteState();
  const qrCodeState = lessonToolsState.qrCodeState ?? createDefaultQrCodeState();
  const pickOptions =
    lessonToolsState.pickOptions ?? createDefaultPickOptionsState();
  const todayDate = getTodayDateString();
  const selectedClassId = findSelectedClassId(rosterState, lessonToolsState);
  const selectedClass = rosterState.classes.find(
    (classInfo) => classInfo.id === selectedClassId,
  );
  const selectedSchool = rosterState.schools.find(
    (school) => school.id === selectedClass?.schoolId,
  );

  const classStudents = useMemo(
    () =>
      sortStudents(
        rosterState.students.filter(
          (student) => student.classId === selectedClassId,
        ),
      ),
    [rosterState.students, selectedClassId],
  );

  const studentById = useMemo(
    () => new Map(classStudents.map((student) => [student.id, student])),
    [classStudents],
  );

  const scoreboardEntries = useMemo(
    () =>
      initializeScoreboardFromStudents(
        classStudents,
        lessonToolsState.scoreboardEntries,
      ),
    [classStudents, lessonToolsState.scoreboardEntries],
  );

  const scoreboardByStudentId = useMemo(
    () =>
      new Map(scoreboardEntries.map((entry) => [entry.studentId, entry.score])),
    [scoreboardEntries],
  );

  const recentPickHistory = useMemo(
    () =>
      lessonToolsState.pickHistory
        .filter((item) => item.classId === selectedClassId)
        .sort(
          (a, b) =>
            new Date(b.pickedAt).getTime() - new Date(a.pickedAt).getTime(),
        )
        .slice(0, 5),
    [lessonToolsState.pickHistory, selectedClassId],
  );

  const ladderParticipants = useMemo(
    () => parseMultilineItems(ladderState.participantsText),
    [ladderState.participantsText],
  );
  const ladderResults = useMemo(
    () => parseMultilineItems(ladderState.resultsText),
    [ladderState.resultsText],
  );
  const rouletteItems = useMemo(
    () => parseMultilineItems(rouletteState.itemsText),
    [rouletteState.itemsText],
  );
  const eligibleStudents = useMemo(
    () =>
      getEligibleStudentsForPick(
        classStudents,
        rosterState.attendanceRecords,
        todayDate,
        pickOptions.presentOnly,
      ),
    [
      classStudents,
      pickOptions.presentOnly,
      rosterState.attendanceRecords,
      todayDate,
    ],
  );

  useEffect(() => {
    let isMounted = true;

    async function hydrateLessonTools() {
      const [savedRosterState, savedLessonToolsState] = await Promise.all([
        widgetStorage.loadStudentRosterState(),
        widgetStorage.loadLessonToolsState(),
      ]);

      if (!isMounted) {
        return;
      }

      setRosterState(savedRosterState);
      setLessonToolsState(savedLessonToolsState);
      setStatusText("저장됨");
    }

    void hydrateLessonTools();

    function handleRosterUpdated(event: Event) {
      const customEvent = event as CustomEvent<StudentRosterState>;
      setRosterState(customEvent.detail);
    }

    function handleLessonToolsUpdated(event: Event) {
      const customEvent = event as CustomEvent<LessonToolsState>;
      setLessonToolsState(customEvent.detail);
      setStatusText("저장됨");
    }

    window.addEventListener(STUDENT_ROSTER_UPDATED_EVENT, handleRosterUpdated);
    window.addEventListener(LESSON_TOOLS_UPDATED_EVENT, handleLessonToolsUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener(
        STUDENT_ROSTER_UPDATED_EVENT,
        handleRosterUpdated,
      );
      window.removeEventListener(
        LESSON_TOOLS_UPDATED_EVENT,
        handleLessonToolsUpdated,
      );
    };
  }, []);

  useEffect(() => {
    if (timerState.status !== "running") {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setLessonToolsState((currentState) => {
        const currentTimer =
          currentState.timerState ?? createDefaultTimerState();

        if (currentTimer.status !== "running") {
          return currentState;
        }

        const nextRemainingSeconds = Math.max(
          0,
          currentTimer.remainingSeconds - 1,
        );
        const nextTimerState: TimerToolState = {
          ...currentTimer,
          remainingSeconds: nextRemainingSeconds,
          status: nextRemainingSeconds === 0 ? "completed" : "running",
          updatedAt: new Date().toISOString(),
        };
        const nextState = {
          ...currentState,
          timerState: nextTimerState,
        };

        if (nextRemainingSeconds === 0) {
          setStatusText("타이머 완료");
          playCompletionBeep();
          void widgetStorage.saveLessonToolsState(nextState);
        }

        return nextState;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [timerState.status]);

  useEffect(() => {
    if (pomodoroState.status !== "running") {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setLessonToolsState((currentState) => {
        const currentPomodoro =
          currentState.pomodoroState ?? createDefaultPomodoroState();

        if (currentPomodoro.status !== "running") {
          return currentState;
        }

        const nextRemainingSeconds = Math.max(
          0,
          currentPomodoro.remainingSeconds - 1,
        );
        const completedNow = nextRemainingSeconds === 0;
        const completedFocus = completedNow && currentPomodoro.mode === "focus";
        const completedBreak = completedNow && currentPomodoro.mode === "break";
        const nextPomodoroState: PomodoroToolState = {
          ...currentPomodoro,
          remainingSeconds: nextRemainingSeconds,
          status: completedNow ? "completed" : "running",
          completedCount: completedFocus
            ? currentPomodoro.completedCount + 1
            : currentPomodoro.completedCount,
          updatedAt: new Date().toISOString(),
        };
        const nextState = {
          ...currentState,
          pomodoroState: nextPomodoroState,
        };

        if (completedNow) {
          setStatusText(completedBreak ? "휴식 완료" : "집중 완료");
          playCompletionBeep();
          void widgetStorage.saveLessonToolsState(nextState);
        }

        return nextState;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [pomodoroState.status]);

  function persistLessonTools(nextState: LessonToolsState, message = "저장됨") {
    setLessonToolsState(nextState);
    setStatusText(message);
    void widgetStorage.saveLessonToolsState(nextState);
  }

  function selectClass(classId: string) {
    persistLessonTools(
      {
        ...lessonToolsState,
        selectedClassId: classId || null,
      },
      "반 선택 저장됨",
    );
    setSingleResultId(null);
    setMultipleResultIds([]);
  }

  function togglePresentOnlyPick() {
    persistLessonTools(
      {
        ...lessonToolsState,
        pickOptions: {
          ...pickOptions,
          presentOnly: !pickOptions.presentOnly,
        },
      },
      !pickOptions.presentOnly
        ? "출석 학생만 뽑기 켜짐"
        : "전체 학생 뽑기 켜짐",
    );
    setSingleResultId(null);
    setMultipleResultIds([]);
  }

  function addPickHistory(
    pickedStudentIds: string[],
    mode: PickHistoryItem["mode"],
  ) {
    if (!selectedClassId || pickedStudentIds.length === 0) {
      return;
    }

    const nextHistory: PickHistoryItem = {
      id: createId("pick"),
      classId: selectedClassId,
      pickedStudentIds,
      pickedAt: new Date().toISOString(),
      mode,
    };

    persistLessonTools(
      {
        ...lessonToolsState,
        selectedClassId,
        pickHistory: [nextHistory, ...lessonToolsState.pickHistory].slice(0, 80),
      },
      "뽑기 기록 저장됨",
    );
  }

  function pickOne() {
    const pickedStudent = pickRandomStudent(eligibleStudents);

    if (!pickedStudent) {
      setStatusText(
        classStudents.length === 0
          ? "학생을 먼저 추가하세요"
          : "조건에 맞는 학생이 없습니다",
      );
      return;
    }

    setSingleResultId(pickedStudent.id);
    addPickHistory([pickedStudent.id], "one");
  }

  function pickMultiple() {
    const requestedCount = Number.parseInt(pickCount, 10);
    const pickedStudents = pickRandomStudents(
      eligibleStudents,
      Number.isFinite(requestedCount) ? requestedCount : 1,
    );

    if (pickedStudents.length === 0) {
      setStatusText(
        classStudents.length === 0
          ? "학생을 먼저 추가하세요"
          : "조건에 맞는 학생이 없습니다",
      );
      return;
    }

    setMultipleResultIds(pickedStudents.map((student) => student.id));
    addPickHistory(
      pickedStudents.map((student) => student.id),
      "multiple",
    );

    if (requestedCount > eligibleStudents.length) {
      setStatusText(`최대 ${eligibleStudents.length}명까지 뽑았습니다`);
    }
  }

  function changeScore(studentId: string, delta: number) {
    persistLessonTools(
      {
        ...lessonToolsState,
        selectedClassId,
        scoreboardEntries: updateScore(
          lessonToolsState.scoreboardEntries,
          studentId,
          delta,
        ),
      },
      "점수 저장됨",
    );
  }

  function resetScores() {
    persistLessonTools(
      {
        ...lessonToolsState,
        selectedClassId,
        scoreboardEntries: resetScoreboard(
          classStudents,
          lessonToolsState.scoreboardEntries,
        ),
      },
      "점수 초기화됨",
    );
  }

  function updateTimer(nextTimerState: TimerToolState, message: string) {
    persistLessonTools(
      {
        ...lessonToolsState,
        timerState: nextTimerState,
      },
      message,
    );
  }

  function updateTimerInput(field: "minutes" | "seconds", value: string) {
    const nextMinutes =
      field === "minutes" ? clampTimerInput(value, 0, 180) : timerState.minutes;
    const nextSeconds =
      field === "seconds" ? clampTimerInput(value, 0, 59) : timerState.seconds;
    const nextTotalSeconds = nextMinutes * 60 + nextSeconds;

    updateTimer(
      {
        ...timerState,
        minutes: nextMinutes,
        seconds: nextSeconds,
        remainingSeconds:
          timerState.status === "running"
            ? timerState.remainingSeconds
            : nextTotalSeconds,
        status: timerState.status === "completed" ? "idle" : timerState.status,
        updatedAt: new Date().toISOString(),
      },
      "타이머 설정 저장됨",
    );
  }

  function setQuickTimer(minutes: number) {
    updateTimer(
      {
        ...timerState,
        minutes,
        seconds: 0,
        remainingSeconds: minutes * 60,
        status: "idle",
        updatedAt: new Date().toISOString(),
      },
      `${minutes}분 타이머 설정됨`,
    );
  }

  function startTimer() {
    const configuredSeconds = getTimerTotalSeconds(timerState);
    const nextRemainingSeconds =
      timerState.remainingSeconds > 0 &&
      timerState.status !== "completed"
        ? timerState.remainingSeconds
        : configuredSeconds;

    if (nextRemainingSeconds <= 0) {
      setStatusText("타이머 시간을 먼저 설정하세요");
      return;
    }

    updateTimer(
      {
        ...timerState,
        remainingSeconds: nextRemainingSeconds,
        status: "running",
        updatedAt: new Date().toISOString(),
      },
      "타이머 실행 중",
    );
  }

  function pauseTimer() {
    if (timerState.status !== "running") {
      return;
    }

    updateTimer(
      {
        ...timerState,
        status: "paused",
        updatedAt: new Date().toISOString(),
      },
      "타이머 일시정지",
    );
  }

  function resetTimer() {
    updateTimer(
      {
        ...timerState,
        remainingSeconds: getTimerTotalSeconds(timerState),
        status: "idle",
        updatedAt: new Date().toISOString(),
      },
      "타이머 초기화됨",
    );
  }

  function updatePomodoro(
    nextPomodoroState: PomodoroToolState,
    message: string,
  ) {
    persistLessonTools(
      {
        ...lessonToolsState,
        pomodoroState: nextPomodoroState,
      },
      message,
    );
  }

  function startPomodoro() {
    const nextMode =
      pomodoroState.status === "completed" && pomodoroState.mode === "focus"
        ? "break"
        : pomodoroState.status === "completed" && pomodoroState.mode === "break"
          ? "focus"
          : pomodoroState.mode;
    const nextDurationSeconds =
      nextMode === "break"
        ? pomodoroState.breakDurationSeconds
        : pomodoroState.durationSeconds;
    const nextRemainingSeconds =
      pomodoroState.remainingSeconds > 0 &&
      pomodoroState.status !== "completed"
        ? pomodoroState.remainingSeconds
        : nextDurationSeconds;

    updatePomodoro(
      {
        ...pomodoroState,
        mode: nextMode,
        remainingSeconds: nextRemainingSeconds,
        status: "running",
        updatedAt: new Date().toISOString(),
      },
      nextMode === "break" ? "뽀모도로 휴식 중" : "뽀모도로 집중 중",
    );
  }

  function pausePomodoro() {
    if (pomodoroState.status !== "running") {
      return;
    }

    updatePomodoro(
      {
        ...pomodoroState,
        status: "paused",
        updatedAt: new Date().toISOString(),
      },
      "뽀모도로 일시정지",
    );
  }

  function resetPomodoro() {
    updatePomodoro(
      {
        ...pomodoroState,
        mode: "focus",
        remainingSeconds: pomodoroState.durationSeconds,
        status: "idle",
        updatedAt: new Date().toISOString(),
      },
      "뽀모도로 초기화됨",
    );
  }

  function updateLadder(nextLadderState: LadderToolState, message: string) {
    persistLessonTools(
      {
        ...lessonToolsState,
        ladderState: nextLadderState,
      },
      message,
    );
  }

  function updateLadderText(
    field: "participantsText" | "resultsText",
    value: string,
  ) {
    updateLadder(
      {
        ...ladderState,
        [field]: value,
        matches: [],
        updatedAt: new Date().toISOString(),
      },
      "사다리 입력 저장됨",
    );
  }

  function fillLadderParticipantsFromClass() {
    if (classStudents.length === 0) {
      setStatusText("채울 학생이 없습니다");
      return;
    }

    updateLadder(
      {
        ...ladderState,
        participantsText: fillTextFromStudents(classStudents),
        matches: [],
        updatedAt: new Date().toISOString(),
      },
      "선택 반 학생을 사다리에 채웠습니다",
    );
  }

  function buildLadder() {
    if (ladderParticipants.length === 0 || ladderResults.length === 0) {
      setStatusText("참여자와 결과 항목을 입력하세요");
      return;
    }

    if (ladderParticipants.length !== ladderResults.length) {
      setStatusText("참여자 수와 결과 항목 수가 같아야 합니다");
      return;
    }

    updateLadder(
      {
        ...ladderState,
        matches: createLadderMatches(ladderParticipants, ladderResults),
        updatedAt: new Date().toISOString(),
      },
      "사다리 결과 생성됨",
    );
  }

  function resetLadder() {
    updateLadder(createDefaultLadderState(), "사다리 초기화됨");
  }

  function updateRoulette(nextRouletteState: RouletteToolState, message: string) {
    persistLessonTools(
      {
        ...lessonToolsState,
        rouletteState: nextRouletteState,
      },
      message,
    );
  }

  function updateRouletteItems(value: string) {
    updateRoulette(
      {
        ...rouletteState,
        itemsText: value,
        selectedItem: null,
        updatedAt: new Date().toISOString(),
      },
      "룰렛 입력 저장됨",
    );
  }

  function fillRouletteItemsFromClass() {
    if (classStudents.length === 0) {
      setStatusText("채울 학생이 없습니다");
      return;
    }

    updateRoulette(
      {
        ...rouletteState,
        itemsText: fillTextFromStudents(classStudents),
        selectedItem: null,
        updatedAt: new Date().toISOString(),
      },
      "선택 반 학생을 룰렛에 채웠습니다",
    );
  }

  function spinRoulette() {
    const selectedItem = pickRouletteItem(rouletteItems);

    if (!selectedItem) {
      setStatusText("룰렛 항목을 2개 이상 입력하세요");
      return;
    }

    updateRoulette(
      {
        ...rouletteState,
        selectedItem,
        spinCount: rouletteState.spinCount + 1,
        updatedAt: new Date().toISOString(),
      },
      "룰렛 결과 선택됨",
    );
  }

  function resetRoulette() {
    updateRoulette(createDefaultRouletteState(), "룰렛 초기화됨");
  }

  function updateQrCode(nextQrCodeState: QrCodeToolState, message: string) {
    persistLessonTools(
      {
        ...lessonToolsState,
        qrCodeState: nextQrCodeState,
      },
      message,
    );
  }

  function updateQrInput(value: string) {
    updateQrCode(
      {
        ...qrCodeState,
        inputText: value,
        updatedAt: new Date().toISOString(),
      },
      "QR 입력 저장됨",
    );
  }

  function generateQrCode() {
    const normalizedInput = normalizeQrInput(qrCodeState.inputText);

    if (!isQrInputValid(normalizedInput)) {
      setStatusText("QR코드로 만들 텍스트나 URL을 입력하세요");
      return;
    }

    updateQrCode(
      {
        ...qrCodeState,
        inputText: normalizedInput,
        lastGeneratedText: normalizedInput,
        updatedAt: new Date().toISOString(),
      },
      "QR코드 생성됨",
    );
  }

  function resetQrCode() {
    updateQrCode(createDefaultQrCodeState(), "QR코드 초기화됨");
  }

  function copyQrText() {
    if (!qrCodeState.lastGeneratedText) {
      return;
    }

    if (!navigator.clipboard) {
      setStatusText("복사 기능을 사용할 수 없습니다");
      return;
    }

    void navigator.clipboard
      .writeText(qrCodeState.lastGeneratedText)
      .then(() => setStatusText("QR 텍스트 복사됨"))
      .catch(() => setStatusText("복사에 실패했습니다"));
  }

  function renderStudentRequiredEmpty() {
    if (!selectedClass) {
      return (
        <div className="lesson-tool-empty">
          전체 설정에서 학교와 반을 먼저 추가하세요.
        </div>
      );
    }

    if (classStudents.length === 0) {
      return (
        <div className="lesson-tool-empty">
          학생을 먼저 추가하세요. 학생 명렬표 위젯에서 선택 반 학생을 등록하면
          수업도구가 바로 연결됩니다.
        </div>
      );
    }

    return null;
  }

  function renderTimerTool() {
    const isRunning = timerState.status === "running";
    const isCompleted = timerState.status === "completed";

    return (
      <div className="lesson-tool-panel">
        <div className="lesson-time-display" data-completed={isCompleted}>
          <span>{isCompleted ? "완료" : "남은 시간"}</span>
          <strong>{formatSecondsToMMSS(timerState.remainingSeconds)}</strong>
        </div>

        <div className="timer-input-grid">
          <label>
            분
            <input
              type="number"
              min="0"
              max="180"
              disabled={isRunning}
              value={timerState.minutes}
              onChange={(event) => updateTimerInput("minutes", event.target.value)}
            />
          </label>
          <label>
            초
            <input
              type="number"
              min="0"
              max="59"
              disabled={isRunning}
              value={timerState.seconds}
              onChange={(event) => updateTimerInput("seconds", event.target.value)}
            />
          </label>
        </div>

        <div className="quick-time-row" aria-label="빠른 타이머 설정">
          {[1, 3, 5, 10, 15].map((minutes) => (
            <button
              key={minutes}
              type="button"
              disabled={isRunning}
              onClick={() => setQuickTimer(minutes)}
            >
              {minutes}분
            </button>
          ))}
        </div>

        <div className="tool-button-row">
          <button type="button" onClick={startTimer} disabled={isRunning}>
            <Play size={15} />
            시작
          </button>
          <button
            type="button"
            onClick={pauseTimer}
            disabled={!isRunning}
            className="is-secondary"
          >
            <Pause size={15} />
            일시정지
          </button>
          <button type="button" onClick={resetTimer} className="is-secondary">
            <RotateCcw size={14} />
            초기화
          </button>
        </div>

        <p className="lesson-tool-note">알림음은 다음 단계에서 연결합니다.</p>
      </div>
    );
  }

  function renderPomodoroTool() {
    const isRunning = pomodoroState.status === "running";
    const statusText = getPomodoroStatusText(pomodoroState);
    const primaryButtonText =
      pomodoroState.status === "completed" && pomodoroState.mode === "focus"
        ? "휴식 시작"
        : pomodoroState.status === "completed" && pomodoroState.mode === "break"
          ? "새 집중 시작"
          : "시작";

    return (
      <div className="lesson-tool-panel">
        <div
          className="lesson-time-display"
          data-completed={pomodoroState.status === "completed"}
        >
          <span>{pomodoroState.mode === "break" ? "5분 휴식" : "25분 집중"}</span>
          <strong>{formatSecondsToMMSS(pomodoroState.remainingSeconds)}</strong>
        </div>

        <div className="pomodoro-status">
          <span>상태</span>
          <strong>{statusText}</strong>
          <span>완료 {pomodoroState.completedCount}회</span>
        </div>

        <div className="tool-button-row">
          <button type="button" onClick={startPomodoro} disabled={isRunning}>
            <Play size={15} />
            {primaryButtonText}
          </button>
          <button
            type="button"
            onClick={pausePomodoro}
            disabled={!isRunning}
            className="is-secondary"
          >
            <Pause size={15} />
            일시정지
          </button>
          <button
            type="button"
            onClick={resetPomodoro}
            className="is-secondary"
          >
            <RotateCcw size={14} />
            초기화
          </button>
        </div>

        <p className="lesson-tool-note">
          긴 휴식과 사용자 지정 시간은 다음 단계 TODO입니다.
        </p>
      </div>
    );
  }

  function renderLadderTool() {
    const hasCountMismatch =
      ladderParticipants.length > 0 &&
      ladderResults.length > 0 &&
      ladderParticipants.length !== ladderResults.length;

    return (
      <div className="lesson-tool-panel">
        <div className="ladder-tool-grid">
          <label>
            참여자
            <textarea
              value={ladderState.participantsText}
              placeholder={"민수\n지아\n도윤"}
              onChange={(event) =>
                updateLadderText("participantsText", event.target.value)
              }
            />
          </label>
          <label>
            결과 항목
            <textarea
              value={ladderState.resultsText}
              placeholder={"발표\n기록\n정리"}
              onChange={(event) =>
                updateLadderText("resultsText", event.target.value)
              }
            />
          </label>
        </div>

        <div className="lesson-tool-actionbar">
          <button
            type="button"
            onClick={fillLadderParticipantsFromClass}
            className="is-secondary"
          >
            선택 반 학생 채우기
          </button>
          <button type="button" onClick={buildLadder}>
            <Shuffle size={15} />
            사다리 만들기
          </button>
          <button type="button" onClick={resetLadder} className="is-secondary">
            <RotateCcw size={14} />
            초기화
          </button>
          <span>
            참여자 {ladderParticipants.length}명 · 결과 {ladderResults.length}개
          </span>
        </div>

        {hasCountMismatch ? (
          <p className="lesson-tool-warning">
            참여자 수와 결과 항목 수가 같아야 합니다.
          </p>
        ) : null}

        {ladderState.matches.length > 0 ? (
          <ul className="ladder-result-list">
            {ladderState.matches.map((match) => (
              <li key={match.id}>
                <strong>{match.participant}</strong>
                <span>→</span>
                <em>{match.result}</em>
              </li>
            ))}
          </ul>
        ) : (
          <p className="lesson-tool-empty">
            줄바꿈 또는 쉼표로 항목을 입력한 뒤 사다리를 만드세요.
          </p>
        )}
      </div>
    );
  }

  function renderRouletteTool() {
    const canSpin = rouletteItems.length >= 2;

    return (
      <div className="lesson-tool-panel">
        <label className="roulette-input">
          룰렛 항목
          <textarea
            value={rouletteState.itemsText}
            placeholder={"청소\n발표\n문제 풀이\n칭찬 카드"}
            onChange={(event) => updateRouletteItems(event.target.value)}
          />
        </label>

        <div
          className="roulette-wheel"
          data-spinning={rouletteState.spinCount % 2 === 1}
        >
          <span>{rouletteItems.length}개 항목</span>
          <strong>{rouletteState.selectedItem ?? "결과 대기"}</strong>
        </div>

        <div className="tool-button-row">
          <button
            type="button"
            onClick={fillRouletteItemsFromClass}
            className="is-secondary"
          >
            선택 반 학생 채우기
          </button>
          <button type="button" onClick={spinRoulette} disabled={!canSpin}>
            <Shuffle size={15} />
            돌리기
          </button>
          <button
            type="button"
            onClick={resetRoulette}
            className="is-secondary"
          >
            <RotateCcw size={14} />
            초기화
          </button>
        </div>

        {!canSpin ? (
          <p className="lesson-tool-warning">항목을 2개 이상 입력하세요.</p>
        ) : null}

        {rouletteItems.length > 0 ? (
          <ul className="roulette-item-list">
            {rouletteItems.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  function renderQrCodeTool() {
    const hasGeneratedQr = isQrInputValid(qrCodeState.lastGeneratedText);
    const canGenerateQr = isQrInputValid(qrCodeState.inputText);

    return (
      <div className="lesson-tool-panel">
        <label className="qr-input">
          텍스트 또는 URL
          <textarea
            value={qrCodeState.inputText}
            placeholder="https://example.com 또는 공유할 문장을 입력하세요"
            onChange={(event) => updateQrInput(event.target.value)}
          />
        </label>

        <div className="tool-button-row">
          <button type="button" onClick={generateQrCode} disabled={!canGenerateQr}>
            QR코드 생성
          </button>
          <button type="button" onClick={resetQrCode} className="is-secondary">
            <RotateCcw size={14} />
            초기화
          </button>
          {hasGeneratedQr ? (
            <button type="button" onClick={copyQrText} className="is-secondary">
              <Copy size={14} />
              텍스트 복사
            </button>
          ) : null}
        </div>

        {!canGenerateQr ? (
          <p className="lesson-tool-warning">
            QR코드로 만들 텍스트나 URL을 입력하세요.
          </p>
        ) : null}

        {hasGeneratedQr ? (
          <div className="qr-preview-card">
            <div className="qr-preview-card__code">
              <QRCodeSVG
                value={qrCodeState.lastGeneratedText}
                size={176}
                marginSize={4}
                level="M"
              />
            </div>
            <p>{qrCodeState.lastGeneratedText}</p>
          </div>
        ) : (
          <p className="lesson-tool-empty">
            입력 후 QR코드 생성 버튼을 누르면 이곳에 표시됩니다.
          </p>
        )}

        <p className="lesson-tool-note">
          이미지 다운로드와 인쇄는 다음 단계에서 다룹니다.
        </p>
      </div>
    );
  }

  function renderPickOptionControl() {
    return (
      <label className="pick-option-toggle">
        <input
          type="checkbox"
          checked={pickOptions.presentOnly}
          onChange={togglePresentOnlyPick}
        />
        <span>출석 학생만 뽑기</span>
        <small>
          오늘 기준 결석, 조퇴, 인정결석 제외 · 대상 {eligibleStudents.length}명
        </small>
      </label>
    );
  }

  function renderActiveTool() {
    if (activeTool === "timer") {
      return renderTimerTool();
    }

    if (activeTool === "pomodoro") {
      return renderPomodoroTool();
    }

    if (activeTool === "ladder") {
      return renderLadderTool();
    }

    if (activeTool === "roulette") {
      return renderRouletteTool();
    }

    if (activeTool === "qr") {
      return renderQrCodeTool();
    }

    const studentRequiredEmpty = renderStudentRequiredEmpty();

    if (studentRequiredEmpty) {
      return studentRequiredEmpty;
    }

    if (activeTool === "one") {
      const singleResult = singleResultId
        ? studentById.get(singleResultId)
        : undefined;

      return (
        <div className="lesson-tool-panel">
          <div className="lesson-tool-actionbar">
            <button type="button" onClick={pickOne}>
              <Shuffle size={15} />
              {singleResult ? "다시 뽑기" : "1명 뽑기"}
            </button>
            <span>오늘 {todayDate} 출결 기준</span>
          </div>
          {renderPickOptionControl()}
          <div className="lesson-tool-result" data-empty={!singleResult}>
            {singleResult ? (
              <>
                <span>오늘의 학생</span>
                <strong>{formatStudentName(singleResult)}</strong>
              </>
            ) : (
              <span>버튼을 눌러 학생 1명을 뽑으세요.</span>
            )}
          </div>
          <RecentPickList
            history={recentPickHistory.filter((item) => item.mode === "one")}
            studentById={studentById}
          />
        </div>
      );
    }

    if (activeTool === "multiple") {
      const pickedStudents = multipleResultIds
        .map((studentId) => studentById.get(studentId))
        .filter((student): student is StudentInfo => Boolean(student));

      return (
        <div className="lesson-tool-panel">
          <div className="lesson-tool-count">
            <label>
              뽑을 인원 수
              <input
                type="number"
                min="1"
                max={Math.max(1, eligibleStudents.length)}
                value={pickCount}
                onChange={(event) => setPickCount(event.target.value)}
              />
            </label>
            <button type="button" onClick={pickMultiple}>
              <Users size={15} />
              N명 뽑기
            </button>
          </div>
          {renderPickOptionControl()}
          <ResultStudentList
            emptyText="중복 없이 여러 명을 뽑습니다."
            students={pickedStudents}
          />
          <RecentPickList
            history={recentPickHistory.filter(
              (item) => item.mode === "multiple",
            )}
            studentById={studentById}
          />
        </div>
      );
    }

    return (
      <div className="lesson-tool-panel">
        <div className="scoreboard-toolbar">
          <span>{classStudents.length}명 기준 점수판</span>
          <button type="button" onClick={resetScores}>
            <RotateCcw size={14} />
            초기화
          </button>
        </div>
        <ul className="scoreboard-list">
          {classStudents.map((student) => (
            <li key={student.id} className="scoreboard-row">
              <span>{formatStudentName(student)}</span>
              <strong>{scoreboardByStudentId.get(student.id) ?? 0}</strong>
              <div>
                <button
                  type="button"
                  aria-label={`${student.name} 1점 빼기`}
                  onClick={() => changeScore(student.id, -1)}
                >
                  <Minus size={14} />
                </button>
                <button
                  type="button"
                  aria-label={`${student.name} 1점 더하기`}
                  onClick={() => changeScore(student.id, 1)}
                >
                  <Plus size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="lesson-tools-widget">
      <div className="lesson-tools-control">
        <label>
          반 선택
          <select
            value={selectedClassId}
            onChange={(event) => selectClass(event.target.value)}
          >
            <option value="">반 없음</option>
            {rosterState.classes.map((classInfo) => {
              const school = rosterState.schools.find(
                (item) => item.id === classInfo.schoolId,
              );

              return (
                <option key={classInfo.id} value={classInfo.id}>
                  {school?.name ?? "학교 미지정"} · {classInfo.displayName}
                </option>
              );
            })}
          </select>
        </label>
        <span aria-live="polite">{statusText}</span>
      </div>

      {selectedClass ? (
        <div className="lesson-tools-summary">
          <strong>{selectedClass.displayName}</strong>
          <span>
            {selectedSchool?.name ?? "학교 미지정"} · {classStudents.length}명
          </span>
        </div>
      ) : null}

      <div className="lesson-tool-tabs" role="tablist" aria-label="수업도구 선택">
        {lessonToolTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-pressed={activeTool === tab.id}
            className={activeTool === tab.id ? "is-active" : undefined}
            onClick={() => setActiveTool(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {renderActiveTool()}
    </div>
  );
}

interface ResultStudentListProps {
  emptyText: string;
  students: StudentInfo[];
}

function ResultStudentList({ emptyText, students }: ResultStudentListProps) {
  if (students.length === 0) {
    return <p className="lesson-tool-empty">{emptyText}</p>;
  }

  return (
    <ul className="lesson-picked-list">
      {students.map((student) => (
        <li key={student.id}>{formatStudentName(student)}</li>
      ))}
    </ul>
  );
}

interface RecentPickListProps {
  history: PickHistoryItem[];
  studentById: Map<string, StudentInfo>;
}

function RecentPickList({ history, studentById }: RecentPickListProps) {
  if (history.length === 0) {
    return <p className="lesson-tool-empty">최근 뽑기 기록이 없습니다.</p>;
  }

  return (
    <section className="lesson-history">
      <h3>최근 뽑기</h3>
      <ul>
        {history.map((item) => (
          <li key={item.id}>
            <time dateTime={item.pickedAt}>{formatPickedAt(item.pickedAt)}</time>
            <span>
              {item.pickedStudentIds
                .map((studentId) => formatStudentName(studentById.get(studentId)))
                .join(", ")}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
