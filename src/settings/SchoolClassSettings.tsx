import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, Plus } from "lucide-react";
import { STUDENT_ROSTER_UPDATED_EVENT } from "../storage/dashboardStorage";
import { widgetStorage } from "../storage/widgetStorage";
import type { ClassInfo, SchoolInfo, StudentRosterState } from "../types/dashboard";
import { ExcelImportSettings } from "./ExcelImportSettings";

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}`;
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

function formatClassName(grade: number, classNumber: number) {
  return `${grade}학년 ${classNumber}반`;
}

export function SchoolClassSettings() {
  const [rosterState, setRosterState] = useState<StudentRosterState>(
    createEmptyStudentRosterState,
  );
  const [schoolName, setSchoolName] = useState("");
  const [classSchoolId, setClassSchoolId] = useState("");
  const [grade, setGrade] = useState("1");
  const [classNumber, setClassNumber] = useState("1");
  const [saveStatus, setSaveStatus] = useState("불러오는 중");

  const selectedSchool = useMemo(
    () => rosterState.schools.find((school) => school.id === classSchoolId),
    [classSchoolId, rosterState.schools],
  );

  useEffect(() => {
    let isMounted = true;

    async function hydrateRoster() {
      const savedState = await widgetStorage.loadStudentRosterState();

      if (!isMounted) {
        return;
      }

      setRosterState(savedState);
      setClassSchoolId(savedState.schools[0]?.id ?? "");
      setSaveStatus("저장됨");
    }

    void hydrateRoster();

    function handleRosterUpdated(event: Event) {
      const customEvent = event as CustomEvent<StudentRosterState>;
      setRosterState(customEvent.detail);
      setClassSchoolId((current) => current || customEvent.detail.schools[0]?.id || "");
      setSaveStatus("저장됨");
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

  function markDirty() {
    setSaveStatus("저장 필요");
  }

  function addSchool(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = schoolName.trim();
    if (!name) {
      return;
    }

    const school: SchoolInfo = {
      id: createId("school"),
      name,
    };

    setRosterState((current) => ({
      ...current,
      schools: [...current.schools, school],
    }));
    setClassSchoolId(school.id);
    setSchoolName("");
    markDirty();
  }

  function addClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedGrade = Number.parseInt(grade, 10);
    const parsedClassNumber = Number.parseInt(classNumber, 10);
    const schoolId = classSchoolId || rosterState.schools[0]?.id;

    if (!schoolId || !Number.isFinite(parsedGrade) || !Number.isFinite(parsedClassNumber)) {
      return;
    }

    const classInfo: ClassInfo = {
      id: createId("class"),
      schoolId,
      grade: parsedGrade,
      classNumber: parsedClassNumber,
      displayName: formatClassName(parsedGrade, parsedClassNumber),
    };

    setRosterState((current) => ({
      ...current,
      selectedClassId: current.selectedClassId ?? classInfo.id,
      classes: [...current.classes, classInfo],
    }));
    markDirty();
  }

  function updateSelectedClass(classId: string) {
    setRosterState((current) => ({
      ...current,
      selectedClassId: classId || null,
    }));
    markDirty();
  }

  async function saveSettings() {
    await widgetStorage.saveStudentRosterState(rosterState);
    setSaveStatus("저장됨");
  }

  return (
    <div className="settings-stack">
      <div className="school-settings" aria-label="학교와 반 관리">
        <div className="school-settings__header">
          <div>
            <h3>학교/반 관리</h3>
            <p>NEIS 검색 없이 수동으로 학교와 기본 반을 관리합니다.</p>
          </div>
          <span aria-live="polite">{saveStatus}</span>
        </div>

        <div className="school-settings__grid">
          <section className="settings-section" aria-label="학교 추가">
            <h4>학교</h4>
            <form className="settings-form" onSubmit={addSchool}>
              <label>
                학교명
                <input
                  value={schoolName}
                  placeholder="예: 열린초등학교"
                  onChange={(event) => setSchoolName(event.target.value)}
                />
              </label>
              <button type="submit">
                <Plus size={15} />
                학교 추가
              </button>
            </form>
            <ul className="settings-list">
              {rosterState.schools.map((school) => (
                <li key={school.id}>{school.name}</li>
              ))}
              {rosterState.schools.length === 0 ? (
                <li className="settings-list__empty">등록된 학교가 없습니다.</li>
              ) : null}
            </ul>
          </section>

          <section className="settings-section" aria-label="반 추가">
            <h4>반</h4>
            <form className="settings-form settings-form--class" onSubmit={addClass}>
              <label>
                학교
                <select
                  value={classSchoolId}
                  onChange={(event) => setClassSchoolId(event.target.value)}
                >
                  <option value="">학교 선택</option>
                  {rosterState.schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                학년
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={grade}
                  onChange={(event) => setGrade(event.target.value)}
                />
              </label>
              <label>
                반
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={classNumber}
                  onChange={(event) => setClassNumber(event.target.value)}
                />
              </label>
              <button type="submit" disabled={!selectedSchool}>
                <Plus size={15} />반 추가
              </button>
            </form>

            <label className="settings-select-row">
              기본 반 선택
              <select
                value={rosterState.selectedClassId ?? ""}
                onChange={(event) => updateSelectedClass(event.target.value)}
              >
                <option value="">선택 안 함</option>
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
          </section>
        </div>

        <div className="settings-actions">
          <button type="button" onClick={saveSettings}>
            <Check size={15} />
            저장
          </button>
        </div>
      </div>

      <ExcelImportSettings />
    </div>
  );
}
