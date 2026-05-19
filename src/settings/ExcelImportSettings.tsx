import { RotateCcw, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import type {
  ExcelImportDraftStatus,
  ExcelImportTarget,
  ExcelImportValidationIssue,
} from "../types/dashboard";
import {
  createEmptyImportDraft,
  getImportSchema,
  getRequiredFieldsForImportTarget,
} from "../utils/excelImportSchema";

const IMPORT_TARGET_OPTIONS: Array<{
  value: ExcelImportTarget;
  label: string;
}> = [
  { value: "studentRoster", label: "학생 명렬표" },
  { value: "teacherTimetable", label: "교사 시간표" },
  { value: "classTimetable", label: "학급 시간표" },
];

const DRAFT_STATUS_LABELS: Record<ExcelImportDraftStatus, string> = {
  idle: "대기",
  selected: "파일 선택됨",
  mapped: "매핑됨",
  validated: "검증됨",
  ready: "적용 준비",
  error: "오류",
};

function getIssueLabel(issue: ExcelImportValidationIssue) {
  const row = issue.rowIndex ? `${issue.rowIndex}행` : "전체";
  const field = issue.field ? ` · ${issue.field}` : "";

  return `${row}${field}`;
}

export function ExcelImportSettings() {
  const [draft, setDraft] = useState(() => createEmptyImportDraft());
  const [notice, setNotice] = useState(
    "샘플 스키마만 표시합니다. 실제 파일 선택과 적용은 다음 단계에서 구현합니다.",
  );

  const schema = useMemo(() => getImportSchema(draft.target), [draft.target]);
  const requiredFields = useMemo(
    () => getRequiredFieldsForImportTarget(draft.target),
    [draft.target],
  );
  const issueSummary = useMemo(() => {
    const errorCount = draft.issues.filter(
      (issue) => issue.level === "error",
    ).length;
    const warningCount = draft.issues.filter(
      (issue) => issue.level === "warning",
    ).length;

    return { errorCount, warningCount };
  }, [draft.issues]);

  function updateTarget(target: ExcelImportTarget) {
    setDraft(createEmptyImportDraft(target));
    setNotice(`${getImportSchema(target).title} 샘플 스키마를 불러왔습니다.`);
  }

  function handleFileButtonClick() {
    setNotice("다음 단계에서 실제 파일 선택을 구현합니다.");
  }

  function resetDraft() {
    setDraft(createEmptyImportDraft(draft.target));
    setNotice("현재 대상의 샘플 매핑과 검증 결과를 초기화했습니다.");
  }

  return (
    <section className="excel-import-settings" aria-label="엑셀 가져오기">
      <div className="excel-import-settings__header">
        <div>
          <h3>엑셀 가져오기</h3>
          <p>
            학생 명렬표와 시간표 import를 위한 컬럼 매핑, 미리보기, 검증
            결과 UI입니다.
          </p>
        </div>
        <span>{DRAFT_STATUS_LABELS[draft.status]}</span>
      </div>

      <div className="excel-import-settings__controls">
        <label>
          가져오기 대상
          <select
            value={draft.target}
            onChange={(event) =>
              updateTarget(event.target.value as ExcelImportTarget)
            }
          >
            {IMPORT_TARGET_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={handleFileButtonClick}>
          <Upload size={15} />
          파일 선택
        </button>
        <button type="button" className="is-secondary" onClick={resetDraft}>
          <RotateCcw size={15} />
          초기화
        </button>
        <button type="button" disabled>
          적용
        </button>
      </div>

      <p className="excel-import-settings__notice" aria-live="polite">
        {notice}
      </p>

      <div className="excel-import-settings__meta">
        <span>{schema.description}</span>
        <span>
          필수 필드 {requiredFields.length}개 · 검증 이슈{" "}
          {draft.issues.length}개
        </span>
      </div>

      <div className="excel-import-settings__grid">
        <section className="excel-import-card" aria-label="컬럼 매핑">
          <h4>컬럼 매핑</h4>
          <ul className="excel-mapping-list">
            {draft.mappings.map((mapping) => (
              <li key={mapping.targetField}>
                <span>{mapping.sourceColumn}</span>
                <small>→</small>
                <strong>{mapping.label}</strong>
                <em>{mapping.required ? "필수" : "선택"}</em>
              </li>
            ))}
          </ul>
        </section>

        <section className="excel-import-card" aria-label="샘플 미리보기">
          <h4>샘플 미리보기</h4>
          <div className="excel-preview-table-wrap">
            <table className="excel-preview-table">
              <thead>
                <tr>
                  <th scope="col">행</th>
                  {draft.columns.map((column) => (
                    <th key={column} scope="col">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {draft.previewRows.map((row) => (
                  <tr key={row.rowIndex}>
                    <th scope="row">{row.rowIndex}</th>
                    {draft.columns.map((column) => (
                      <td key={`${row.rowIndex}-${column}`}>
                        {row.values[column] || "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="excel-import-card" aria-label="검증 결과">
          <h4>검증 결과</h4>
          <div className="excel-validation-summary">
            <span data-level="error">오류 {issueSummary.errorCount}</span>
            <span data-level="warning">경고 {issueSummary.warningCount}</span>
          </div>
          {draft.issues.length > 0 ? (
            <ul className="excel-issue-list">
              {draft.issues.map((issue) => (
                <li
                  key={`${issue.rowIndex ?? "all"}-${issue.field ?? "field"}-${
                    issue.message
                  }`}
                  data-level={issue.level}
                >
                  <strong>{getIssueLabel(issue)}</strong>
                  <span>{issue.message}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="excel-import-empty">
              샘플 기준으로 표시할 검증 이슈가 없습니다.
            </p>
          )}
        </section>
      </div>
    </section>
  );
}
