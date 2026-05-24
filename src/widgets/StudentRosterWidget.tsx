import { FormEvent, useEffect, useMemo, useState } from "react";
import { ChevronDown, MessageSquare, Plus, Trash2 } from "lucide-react";
import { STUDENT_ROSTER_UPDATED_EVENT } from "../storage/dashboardStorage";
import { widgetStorage } from "../storage/widgetStorage";
import type {
  AttendanceStatus,
  StudentInfo,
  StudentRosterState,
} from "../types/dashboard";
import {
  filterStudents,
  getAttendanceForDate,
  getAttendanceSummary,
  getCounselingForDate,
  getRecentAttendanceRecords,
  getRecentCounselingRecords,
  getRecentStudentStatusMemos,
  getStudentStatusMemoForDate,
  previewText,
  sortStudents,
  upsertAttendanceRecord,
  upsertCounselingRecord,
  upsertStudentStatusMemo,
} from "../utils/studentRosterUtils";

const attendanceOptions: Array<{ value: AttendanceStatus; label: string }> = [
  { value: "present", label: "출석" },
  { value: "absent", label: "결석" },
  { value: "late", label: "지각" },
  { value: "earlyLeave", label: "조퇴" },
  { value: "officialAbsent", label: "인정결석" },
  { value: "unknown", label: "미확인" },
];

const attendanceLabels: Record<AttendanceStatus, string> =
  Object.fromEntries(
    attendanceOptions.map((option) => [option.value, option.label]),
  ) as Record<AttendanceStatus, string>;

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}`;
}

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

function isExpanded(studentId: string, expandedStudentIds: string[]) {
  return expandedStudentIds.includes(studentId);
}

export function StudentRosterWidget() {
  const [rosterState, setRosterState] = useState<StudentRosterState>(
    createEmptyStudentRosterState,
  );
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [studentNumber, setStudentNumber] = useState("1");
  const [studentName, setStudentName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedStudentIds, setExpandedStudentIds] = useState<string[]>([]);
  const [attendanceNoteDrafts, setAttendanceNoteDrafts] = useState<
    Record<string, string>
  >({});
  const [counselingDrafts, setCounselingDrafts] = useState<
    Record<string, string>
  >({});
  const [statusMemoDrafts, setStatusMemoDrafts] = useState<
    Record<string, string>
  >({});
  const [statusText, setStatusText] = useState("불러오는 중");

  const selectedClassId =
    rosterState.selectedClassId ?? rosterState.classes[0]?.id ?? "";
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
  const visibleStudents = useMemo(
    () => filterStudents(classStudents, searchQuery),
    [classStudents, searchQuery],
  );
  const attendanceSummary = useMemo(
    () =>
      getAttendanceSummary(
        classStudents,
        selectedDate,
        rosterState.attendanceRecords,
      ),
    [classStudents, rosterState.attendanceRecords, selectedDate],
  );

  useEffect(() => {
    let isMounted = true;

    async function hydrateRoster() {
      const savedState = await widgetStorage.loadStudentRosterState();

      if (!isMounted) {
        return;
      }

      setRosterState(savedState);
      setStatusText("저장됨");
    }

    void hydrateRoster();

    function handleRosterUpdated(event: Event) {
      const customEvent = event as CustomEvent<StudentRosterState>;
      setRosterState(customEvent.detail);
      setStatusText("저장됨");
    }

    window.addEventListener(STUDENT_ROSTER_UPDATED_EVENT, handleRosterUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener(
        STUDENT_ROSTER_UPDATED_EVENT,
        handleRosterUpdated,
      );
    };
  }, []);

  useEffect(() => {
    const nextAttendanceNotes: Record<string, string> = {};
    const nextCounselingDrafts: Record<string, string> = {};
    const nextStatusMemoDrafts: Record<string, string> = {};

    classStudents.forEach((student) => {
      nextAttendanceNotes[student.id] =
        getAttendanceForDate(
          student.id,
          selectedDate,
          rosterState.attendanceRecords,
        )?.note ?? "";
      nextCounselingDrafts[student.id] =
        getCounselingForDate(
          student.id,
          selectedDate,
          rosterState.counselingRecords,
        )?.content ?? "";
      nextStatusMemoDrafts[student.id] =
        getStudentStatusMemoForDate(
          student.id,
          selectedDate,
          rosterState.studentStatusMemos,
        )?.content ?? "";
    });

    setAttendanceNoteDrafts(nextAttendanceNotes);
    setCounselingDrafts(nextCounselingDrafts);
    setStatusMemoDrafts(nextStatusMemoDrafts);
  }, [
    classStudents,
    rosterState.attendanceRecords,
    rosterState.counselingRecords,
    rosterState.studentStatusMemos,
    selectedDate,
  ]);

  function persistRoster(nextState: StudentRosterState, message = "저장됨") {
    setRosterState(nextState);
    setStatusText(message);
    void widgetStorage.saveStudentRosterState(nextState);
  }

  function selectClass(classId: string) {
    persistRoster(
      {
        ...rosterState,
        selectedClassId: classId || null,
      },
      "반 선택 저장됨",
    );
    setExpandedStudentIds([]);
  }

  function getAttendanceStatus(studentId: string): AttendanceStatus {
    return (
      getAttendanceForDate(studentId, selectedDate, rosterState.attendanceRecords)
        ?.status ?? "unknown"
    );
  }

  function saveAttendance(
    studentId: string,
    status: AttendanceStatus,
    note: string | undefined,
    message = "출결 저장됨",
  ) {
    persistRoster(
      {
        ...rosterState,
        attendanceRecords: upsertAttendanceRecord(
          rosterState.attendanceRecords,
          {
            studentId,
            date: selectedDate,
            status,
            note,
          },
        ),
      },
      message,
    );
  }

  function addStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const number = Number.parseInt(studentNumber, 10);
    const name = studentName.trim();

    if (!selectedClassId || !name) {
      return;
    }

    const now = new Date().toISOString();
    const student: StudentInfo = {
      id: createId("student"),
      classId: selectedClassId,
      number: Number.isFinite(number) ? number : 0,
      name,
      createdAt: now,
      updatedAt: now,
    };

    persistRoster(
      {
        ...rosterState,
        selectedClassId,
        students: [...rosterState.students, student],
        attendanceRecords: upsertAttendanceRecord(
          rosterState.attendanceRecords,
          {
            studentId: student.id,
            date: selectedDate,
            status: "unknown",
          },
        ),
      },
      "학생 저장됨",
    );
    setStudentName("");
    setStudentNumber(Number.isFinite(number) ? String(number + 1) : "");
    setExpandedStudentIds((current) => [...current, student.id]);
  }

  function deleteStudent(studentId: string) {
    persistRoster(
      {
        ...rosterState,
        students: rosterState.students.filter(
          (student) => student.id !== studentId,
        ),
        attendanceRecords: rosterState.attendanceRecords.filter(
          (record) => record.studentId !== studentId,
        ),
        counselingRecords: rosterState.counselingRecords.filter(
          (record) => record.studentId !== studentId,
        ),
        studentStatusMemos: rosterState.studentStatusMemos.filter(
          (memo) => memo.studentId !== studentId,
        ),
      },
      "학생 삭제됨",
    );
    setExpandedStudentIds((current) =>
      current.filter((item) => item !== studentId),
    );
  }

  function saveAttendanceNote(studentId: string) {
    const note = attendanceNoteDrafts[studentId] ?? "";
    const existingRecord = getAttendanceForDate(
      studentId,
      selectedDate,
      rosterState.attendanceRecords,
    );

    if (!note.trim() && !existingRecord) {
      return;
    }

    saveAttendance(
      studentId,
      existingRecord?.status ?? "unknown",
      note,
      "출결 비고 저장됨",
    );
  }

  function saveCounseling(studentId: string) {
    const content = (counselingDrafts[studentId] ?? "").trim();
    if (!content) {
      return;
    }

    persistRoster(
      {
        ...rosterState,
        counselingRecords: upsertCounselingRecord(
          rosterState.counselingRecords,
          {
            studentId,
            date: selectedDate,
            content,
          },
        ),
      },
      "상담 저장됨",
    );
  }

  function saveStatusMemo(studentId: string) {
    const content = (statusMemoDrafts[studentId] ?? "").trim();
    if (!content) {
      return;
    }

    persistRoster(
      {
        ...rosterState,
        studentStatusMemos: upsertStudentStatusMemo(
          rosterState.studentStatusMemos,
          {
            studentId,
            date: selectedDate,
            content,
          },
        ),
      },
      "상태 메모 저장됨",
    );
  }

  function toggleStudent(studentId: string) {
    setExpandedStudentIds((current) =>
      isExpanded(studentId, current)
        ? current.filter((item) => item !== studentId)
        : [...current, studentId],
    );
  }

  return (
    <div className="student-roster-widget">
      <div className="roster-control">
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
        <label className="roster-date-control">
          기준 날짜
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value || todayKey())}
          />
        </label>
        <span aria-live="polite">{statusText}</span>
      </div>

      {selectedClass ? (
        <>
          <div className="roster-summary">
            <strong>{selectedClass.displayName}</strong>
            <span>
              {selectedSchool?.name ?? "학교 미지정"} · {classStudents.length}명
              {searchQuery.trim() ? ` · 검색 ${visibleStudents.length}명` : ""}
            </span>
          </div>

          <div className="attendance-summary" aria-label="선택 날짜 출결 요약">
            {attendanceOptions.map((option) => (
              <span key={option.value} data-status={option.value}>
                {option.label} {attendanceSummary[option.value]}
              </span>
            ))}
          </div>

          <div className="student-roster-tools">
            <label>
              학생 검색
              <input
                value={searchQuery}
                placeholder="이름 또는 번호 검색"
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>
          </div>

          <form className="student-form" onSubmit={addStudent}>
            <input
              type="number"
              min="1"
              value={studentNumber}
              aria-label="학생 번호"
              placeholder="번호"
              onChange={(event) => setStudentNumber(event.target.value)}
            />
            <input
              value={studentName}
              aria-label="학생 이름"
              placeholder="학생 이름"
              onChange={(event) => setStudentName(event.target.value)}
            />
            <button type="submit" aria-label="학생 추가">
              <Plus size={15} />
            </button>
          </form>

          <ul className="student-list">
            {visibleStudents.map((student) => {
              const attendanceRecord = getAttendanceForDate(
                student.id,
                selectedDate,
                rosterState.attendanceRecords,
              );
              const attendance = attendanceRecord?.status ?? "unknown";
              const selectedCounseling = getCounselingForDate(
                student.id,
                selectedDate,
                rosterState.counselingRecords,
              );
              const selectedStatusMemo = getStudentStatusMemoForDate(
                student.id,
                selectedDate,
                rosterState.studentStatusMemos,
              );
              const recentCounseling = getRecentCounselingRecords(
                student.id,
                rosterState.counselingRecords,
              );
              const recentStatusMemos = getRecentStudentStatusMemos(
                student.id,
                rosterState.studentStatusMemos,
              );
              const recentAttendance = getRecentAttendanceRecords(
                student.id,
                rosterState.attendanceRecords,
              );
              const expanded = isExpanded(student.id, expandedStudentIds);

              return (
                <li
                  key={student.id}
                  className="student-card"
                  data-expanded={expanded}
                >
                  <div className="student-card__header">
                    <div className="student-card__identity">
                      <strong>
                        {student.number > 0 ? `${student.number}. ` : ""}
                        {student.name}
                      </strong>
                      <span
                        className="attendance-pill"
                        data-status={attendance}
                      >
                        {attendanceLabels[attendance]}
                      </span>
                    </div>

                    <label className="student-card__attendance">
                      <span>출석 상태</span>
                      <select
                        value={attendance}
                        onChange={(event) =>
                          saveAttendance(
                            student.id,
                            event.target.value as AttendanceStatus,
                            attendanceNoteDrafts[student.id],
                          )
                        }
                      >
                        {attendanceOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="student-card__meta">
                      <span>{previewText(attendanceRecord?.note, "비고 없음")}</span>
                      <span data-active={Boolean(selectedCounseling)}>
                        상담 {selectedCounseling ? "있음" : "없음"}
                      </span>
                      <span data-active={Boolean(selectedStatusMemo)}>
                        상태 {selectedStatusMemo ? "있음" : "없음"}
                      </span>
                    </div>

                    <div className="student-card__actions">
                      <button
                        type="button"
                        aria-label={`${student.name} 상세 ${
                          expanded ? "접기" : "펼치기"
                        }`}
                        aria-expanded={expanded}
                        onClick={() => toggleStudent(student.id)}
                      >
                        <ChevronDown size={15} />
                      </button>
                      <button
                        type="button"
                        aria-label={`${student.name} 삭제`}
                        onClick={() => deleteStudent(student.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {expanded ? (
                    <div className="student-card__detail">
                      <div className="attendance-control">
                        <label>
                          출결 비고
                          <input
                            value={attendanceNoteDrafts[student.id] ?? ""}
                            placeholder="짧은 비고"
                            onChange={(event) =>
                              setAttendanceNoteDrafts((current) => ({
                                ...current,
                                [student.id]: event.target.value,
                              }))
                            }
                            onBlur={() => saveAttendanceNote(student.id)}
                          />
                        </label>
                      </div>

                      <div className="student-notes">
                        <label>
                          상담 기록
                          <textarea
                            value={counselingDrafts[student.id] ?? ""}
                            placeholder="선택 날짜 상담 내용"
                            onChange={(event) =>
                              setCounselingDrafts((current) => ({
                                ...current,
                                [student.id]: event.target.value,
                              }))
                            }
                          />
                          <button
                            type="button"
                            onClick={() => saveCounseling(student.id)}
                          >
                            <MessageSquare size={14} />
                            상담 저장
                          </button>
                        </label>
                        <label>
                          상태 메모
                          <textarea
                            value={statusMemoDrafts[student.id] ?? ""}
                            placeholder="선택 날짜 학생 상태 메모"
                            onChange={(event) =>
                              setStatusMemoDrafts((current) => ({
                                ...current,
                                [student.id]: event.target.value,
                              }))
                            }
                          />
                          <button
                            type="button"
                            onClick={() => saveStatusMemo(student.id)}
                          >
                            상태 저장
                          </button>
                        </label>
                      </div>

                      <div className="student-history-grid">
                        <section>
                          <h4>최근 상담</h4>
                          <RecentTextList
                            emptyText="상담 기록 없음"
                            items={recentCounseling.map((record) => ({
                              id: record.id,
                              date: record.date,
                              content: record.content,
                            }))}
                          />
                        </section>
                        <section>
                          <h4>최근 상태 메모</h4>
                          <RecentTextList
                            emptyText="상태 메모 없음"
                            items={recentStatusMemos.map((memo) => ({
                              id: memo.id,
                              date: memo.date,
                              content: memo.content,
                            }))}
                          />
                        </section>
                        <section>
                          <h4>최근 출결</h4>
                          <RecentTextList
                            emptyText="출결 기록 없음"
                            items={recentAttendance.map((record) => ({
                              id: record.id,
                              date: record.date,
                              content: `${attendanceLabels[record.status]}${
                                record.note ? ` · ${record.note}` : ""
                              }`,
                            }))}
                          />
                        </section>
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
            {visibleStudents.length === 0 ? (
              <li className="student-list__empty">
                {classStudents.length === 0
                  ? "저장된 학생명렬이 없습니다. 전체 설정에서 학생명렬 CSV를 가져오거나 학생을 직접 추가하세요."
                  : "검색 결과가 없습니다."}
              </li>
            ) : null}
          </ul>
        </>
      ) : (
        <div className="student-roster-empty">
          저장된 학생명렬이 없습니다. 전체 설정에서 학생명렬 CSV를 가져오면
          이 위젯에 학생 목록이 표시됩니다.
        </div>
      )}
    </div>
  );
}

interface RecentTextListProps {
  emptyText: string;
  items: Array<{
    id: string;
    date: string;
    content: string;
  }>;
}

function RecentTextList({ emptyText, items }: RecentTextListProps) {
  if (items.length === 0) {
    return <p className="student-history-empty">{emptyText}</p>;
  }

  return (
    <ul className="student-history-list">
      {items.map((item) => (
        <li key={item.id}>
          <time dateTime={item.date}>{item.date}</time>
          <span>{previewText(item.content, "내용 없음")}</span>
        </li>
      ))}
    </ul>
  );
}
