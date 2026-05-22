import { RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { ExcelImportSourcePicker } from "../import/ExcelImportSourcePicker";
import type {
  ExcelImportAdapterStatus,
  ExcelImportDraftStatus,
  ExcelImportSourceResult,
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

type SourceBoundaryStatus = "requested" | ExcelImportAdapterStatus;

const SOURCE_STATUS_LABELS: Record<SourceBoundaryStatus, string> = {
  idle: "대기",
  requested: "요청 중",
  ready: "준비됨",
  blocked: "차단됨",
  error: "오류",
};

const SOURCE_STATUS_MESSAGES: Record<SourceBoundaryStatus, string> = {
  idle: "source adapter 요청 전입니다. 실제 파일 선택 입력은 아직 연결하지 않았습니다.",
  requested: "source adapter 경계를 확인하는 중입니다.",
  ready: "source adapter가 파일 메타데이터를 반환할 준비가 된 상태입니다.",
  blocked: "현재 단계에서는 noop adapter가 실제 파일 선택을 차단합니다.",
  error: "source adapter 요청 중 오류가 발생했습니다.",
};

function getIssueLabel(issue: ExcelImportValidationIssue) {
  const row = issue.rowIndex ? `${issue.rowIndex}행` : "전체";
  const field = issue.field ? ` · ${issue.field}` : "";

  return `${row}${field}`;
}

export function ExcelImportSettings() {
  const [draft, setDraft] = useState(() => createEmptyImportDraft());
  const [sourceStatus, setSourceStatus] =
    useState<SourceBoundaryStatus>("idle");
  const [sourceResult, setSourceResult] =
    useState<ExcelImportSourceResult | null>(null);
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
  const sourceIssues = sourceResult?.issues ?? [];

  function updateTarget(target: ExcelImportTarget) {
    setDraft(createEmptyImportDraft(target));
    setSourceStatus("idle");
    setSourceResult(null);
    setNotice(`${getImportSchema(target).title} 샘플 스키마를 불러왔습니다.`);
  }

  function handleSourceRequest() {
    setSourceStatus("requested");
    setSourceResult(null);
    setNotice("파일 선택 source adapter 경계를 확인하는 중입니다.");
  }

  function handleSourceResult(result: ExcelImportSourceResult) {
    setSourceStatus(result.status);
    setSourceResult(result);
    setNotice(
      "source picker가 noop adapter의 blocked 결과를 전달했습니다. 실제 파일 선택은 아직 연결하지 않습니다.",
    );
  }

  function handleSourceError(message: string) {
    setSourceStatus("error");
    setSourceResult({
      status: "error",
      source: null,
      issues: [
        {
          level: "error",
          message,
        },
      ],
    });
    setNotice(message);
  }

  function resetDraft() {
    setDraft(createEmptyImportDraft(draft.target));
    setSourceStatus("idle");
    setSourceResult(null);
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
        <ExcelImportSourcePicker
          onRequest={handleSourceRequest}
          onResult={handleSourceResult}
          onError={handleSourceError}
        />
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

      <section className="excel-import-source" aria-label="파일 선택 경계">
        <div className="excel-import-source__header">
          <div>
            <h4>파일 선택 경계</h4>
            <p>
              나중에 source adapter가 파일 메타데이터를 넘겨줄 위치입니다.
              현재는 실제 선택 없이 blocked 결과만 표시합니다.
            </p>
          </div>
          <span data-status={sourceStatus}>
            {SOURCE_STATUS_LABELS[sourceStatus]}
          </span>
        </div>
        <div className="excel-import-source__body">
          <div>
            <strong>
              {sourceResult?.source?.fileName ?? "선택된 파일 없음"}
            </strong>
            <small>
              {sourceResult?.source
                ? `${sourceResult.source.selectedAt} · ${
                    sourceResult.source.mimeType ?? "파일 형식 미확인"
                  }`
                : SOURCE_STATUS_MESSAGES[sourceStatus]}
            </small>
          </div>
          {sourceIssues.length > 0 ? (
            <ul className="excel-source-issue-list">
              {sourceIssues.map((issue) => (
                <li key={issue.message} data-level={issue.level}>
                  {issue.message}
                </li>
              ))}
            </ul>
          ) : (
            <p>아직 source adapter 결과가 없습니다.</p>
          )}
        </div>
      </section>

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
