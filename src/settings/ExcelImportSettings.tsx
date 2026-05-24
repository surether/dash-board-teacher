import { RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { ExcelImportSourcePicker } from "../import/ExcelImportSourcePicker";
import type { CsvParserBoundaryResult } from "../import/csvParserBoundary";
import {
  createStudentRosterCandidateResult,
  createStudentRosterSessionStateFromCandidates,
} from "../import/studentRosterCandidateBoundary";
import { widgetStorage } from "../storage/widgetStorage";
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

type FileReadSummaryStatus = "ready" | "blocked" | "error" | "cancelled";

type FileReadSummary = {
  status: FileReadSummaryStatus;
  source: ExcelImportSourceResult["source"];
  hasBuffer: boolean;
  issues: ExcelImportValidationIssue[];
};

type StudentRosterApplySummary = {
  appliedCount: number;
  excludedIssueRowCount: number;
  appliedAt: string;
};

const SOURCE_STATUS_LABELS: Record<SourceBoundaryStatus, string> = {
  idle: "대기",
  requested: "요청 중",
  ready: "준비됨",
  blocked: "차단됨",
  error: "오류",
};

const SOURCE_STATUS_MESSAGES: Record<SourceBoundaryStatus, string> = {
  idle: "파일 선택 전입니다. 학생명렬표 양식은 CSV로 저장해 가져오세요.",
  requested: "source adapter 경계를 확인하는 중입니다.",
  ready: "파일 메타데이터를 받았습니다. CSV 파일이면 미리보기를 생성합니다.",
  blocked: "현재 .xlsx 직접 가져오기는 지원하지 않습니다. 학생명렬표 양식을 CSV로 저장해 가져오세요.",
  error: "source adapter 요청 중 오류가 발생했습니다.",
};

const FILE_READ_STATUS_LABELS: Record<FileReadSummaryStatus, string> = {
  ready: "읽기 준비 완료",
  blocked: "읽기 차단",
  error: "읽기 실패",
  cancelled: "선택 취소",
};

const PARSED_PREVIEW_STATUS_LABELS: Record<
  CsvParserBoundaryResult["status"],
  string
> = {
  idle: "대기",
  ready: "준비됨",
  error: "오류",
  unsupported: "미지원",
};

function formatFileSize(size: number | undefined) {
  if (typeof size !== "number") {
    return "크기 미확인";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function formatDateTime(value: number | string | undefined) {
  if (value === undefined) {
    return "시각 미확인";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "시각 미확인";
  }

  return date.toLocaleString("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

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
  const [fileReadSummary, setFileReadSummary] =
    useState<FileReadSummary | null>(null);
  const [parsedPreviewSummary, setParsedPreviewSummary] =
    useState<CsvParserBoundaryResult | null>(null);
  const [studentRosterApplySummary, setStudentRosterApplySummary] =
    useState<StudentRosterApplySummary | null>(null);
  const [isSavingStudentRoster, setIsSavingStudentRoster] = useState(false);
  const [notice, setNotice] = useState(
    "학생명렬 CSV는 학년, 반, 번호, 성명, 비고 헤더를 기준으로 인식합니다. 현재 .xlsx 직접 가져오기는 지원하지 않습니다.",
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
  const sourceMeta = sourceResult?.source;
  const sourceMetaSummary = sourceMeta
    ? [
        `크기 ${formatFileSize(sourceMeta.size)}`,
        `형식 ${sourceMeta.mimeType || "MIME type 없음"}`,
        `마지막 수정 ${formatDateTime(sourceMeta.lastModified)}`,
        `선택 ${formatDateTime(sourceMeta.selectedAt)}`,
      ].join(" · ")
    : SOURCE_STATUS_MESSAGES[sourceStatus];
  const parsedPreviewColumns = useMemo(() => {
    const maxColumnCount =
      parsedPreviewSummary?.previewRows.reduce(
        (maxCount, row) => Math.max(maxCount, row.values.length),
        0,
      ) ?? 0;

    return Array.from({ length: maxColumnCount }, (_, index) => `열 ${index + 1}`);
  }, [parsedPreviewSummary]);
  const studentRosterCandidateResult = useMemo(
    () => createStudentRosterCandidateResult(parsedPreviewSummary),
    [parsedPreviewSummary],
  );
  const studentRosterApplyCount =
    studentRosterCandidateResult?.candidates.length ?? 0;
  const canApplyStudentRoster =
    draft.target === "studentRoster" && studentRosterApplyCount > 0;

  function updateTarget(target: ExcelImportTarget) {
    setDraft(createEmptyImportDraft(target));
    setSourceStatus("idle");
    setSourceResult(null);
    setFileReadSummary(null);
    setParsedPreviewSummary(null);
    setStudentRosterApplySummary(null);
    setIsSavingStudentRoster(false);
    setNotice(
      target === "studentRoster"
        ? "학생명렬 CSV는 학년, 반, 번호, 성명, 비고 헤더를 기준으로 인식합니다."
        : `${getImportSchema(target).title} 샘플 스키마를 불러왔습니다. 실제 적용은 아직 지원하지 않습니다.`,
    );
  }

  function handleSourceRequest() {
    setSourceStatus("requested");
    setSourceResult(null);
    setFileReadSummary(null);
    setParsedPreviewSummary(null);
    setStudentRosterApplySummary(null);
    setIsSavingStudentRoster(false);
    setNotice("파일 선택 경계를 확인하는 중입니다.");
  }

  function handleFileReadSummary(summary: FileReadSummary) {
    setFileReadSummary(summary);
    setParsedPreviewSummary(null);
    setStudentRosterApplySummary(null);
    setIsSavingStudentRoster(false);
  }

  function handleCsvPreviewResult(result: CsvParserBoundaryResult) {
    setParsedPreviewSummary(result);
    setStudentRosterApplySummary(null);
    setIsSavingStudentRoster(false);
  }

  function handleSourceResult(result: ExcelImportSourceResult) {
    setSourceStatus(result.status);
    setSourceResult(result);
    setNotice(
      result.status === "ready"
        ? "파일 메타데이터를 받았습니다. CSV 파일이면 아래에서 앞부분 미리보기를 확인할 수 있습니다."
        : "현재 .xlsx 직접 가져오기는 지원하지 않습니다. 학생명렬표 양식을 CSV로 저장해 가져오세요.",
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
    setFileReadSummary(null);
    setParsedPreviewSummary(null);
    setStudentRosterApplySummary(null);
    setIsSavingStudentRoster(false);
    setNotice(message);
  }

  function resetDraft() {
    setDraft(createEmptyImportDraft(draft.target));
    setSourceStatus("idle");
    setSourceResult(null);
    setFileReadSummary(null);
    setParsedPreviewSummary(null);
    setStudentRosterApplySummary(null);
    setIsSavingStudentRoster(false);
    setNotice("현재 대상의 샘플 매핑과 검증 결과를 초기화했습니다.");
  }

  async function applyStudentRosterCandidatesToStorage() {
    if (!studentRosterCandidateResult || !canApplyStudentRoster) {
      return;
    }

    const appliedAt = new Date().toISOString();
    const state = createStudentRosterSessionStateFromCandidates(
      studentRosterCandidateResult.candidates,
      appliedAt,
    );
    const appliedCount = studentRosterCandidateResult.candidates.length;
    const excludedIssueRowCount =
      studentRosterCandidateResult.summary.issueRowCount;

    setIsSavingStudentRoster(true);

    try {
      await widgetStorage.saveStudentRosterState(state);
      setStudentRosterApplySummary({
        appliedCount,
        excludedIssueRowCount,
        appliedAt,
      });
      setNotice(
        `학생명렬에 ${appliedCount}명을 적용하고 저장했습니다. 오류 행 ${excludedIssueRowCount}개는 제외했습니다. 새로고침 후에도 유지되며 뽑기/사다리/룰렛에서 사용됩니다.`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "알 수 없는 오류";
      setNotice(`학생명렬 저장 중 오류가 발생했습니다: ${message}`);
    } finally {
      setIsSavingStudentRoster(false);
    }
  }

  return (
    <section className="excel-import-settings" aria-label="엑셀 가져오기">
      <div className="excel-import-settings__header">
        <div>
          <h3>엑셀 가져오기</h3>
          <p>
            학생명렬 CSV를 가져와 미리보고 저장합니다. 교사 시간표와 학급
            시간표는 아직 준비 화면입니다.
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
          onFileReadResult={handleFileReadSummary}
          onCsvPreviewResult={handleCsvPreviewResult}
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
              선택한 파일의 메타데이터와 CSV 미리보기 경계를 표시합니다.
              현재 .xlsx 직접 가져오기는 지원하지 않습니다.
            </p>
          </div>
          <span data-status={sourceStatus}>
            {SOURCE_STATUS_LABELS[sourceStatus]}
          </span>
        </div>
        <div className="excel-import-source__body">
          <div>
            <strong>{sourceMeta?.fileName ?? "선택된 파일 없음"}</strong>
            <small>{sourceMetaSummary}</small>
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

      {fileReadSummary ? (
        <section className="excel-import-source" aria-label="파일 읽기 요약">
          <div className="excel-import-source__header">
            <div>
              <h4>파일 읽기 요약</h4>
              <p>
                선택한 파일을 읽는 경계 결과만 표시합니다. CSV 내용은 아래
                미리보기에서 제한된 범위로만 표시합니다.
              </p>
            </div>
            <span
              data-status={
                fileReadSummary.status === "cancelled"
                  ? "blocked"
                  : fileReadSummary.status
              }
            >
              {FILE_READ_STATUS_LABELS[fileReadSummary.status]}
            </span>
          </div>
          <div className="excel-import-source__body">
            <div>
              <strong>
                {fileReadSummary.source?.fileName ?? "선택된 파일 없음"}
              </strong>
              <small>
                바이트 준비 {fileReadSummary.hasBuffer ? "예" : "아니오"} ·
                이슈 {fileReadSummary.issues.length}개
              </small>
            </div>
            {fileReadSummary.issues.length > 0 ? (
              <ul className="excel-source-issue-list">
                {fileReadSummary.issues.map((issue) => (
                  <li key={issue.message} data-level={issue.level}>
                    {issue.message}
                  </li>
                ))}
              </ul>
            ) : (
              <p>파일 읽기 경계에서 보고된 이슈가 없습니다.</p>
            )}
          </div>
        </section>
      ) : null}

      {parsedPreviewSummary ? (
        <section className="excel-import-source" aria-label="CSV 미리보기 요약">
          <div className="excel-import-source__header">
            <div>
              <h4>CSV 미리보기</h4>
              <p>
                CSV 파일의 앞부분만 표로 표시합니다. 학생명렬 저장은 아래
                학생 후보 미리보기에서 정상 행만 대상으로 실행합니다.
              </p>
            </div>
            <span
              data-status={
                parsedPreviewSummary.status === "unsupported"
                  ? "blocked"
                  : parsedPreviewSummary.status
              }
            >
              {PARSED_PREVIEW_STATUS_LABELS[parsedPreviewSummary.status]}
            </span>
          </div>
          <div className="excel-import-source__body">
            <div>
              <strong>
                {parsedPreviewSummary.source?.fileName ?? "선택된 파일 없음"}
              </strong>
              <small>
                행 수{" "}
                {parsedPreviewSummary.rowCount ?? "미지원"} · 열 수{" "}
                {parsedPreviewSummary.columnCount ?? "미지원"} · 이슈{" "}
                {parsedPreviewSummary.issues.length}개
              </small>
            </div>
            {parsedPreviewSummary.issues.length > 0 ? (
              <ul className="excel-source-issue-list">
                {parsedPreviewSummary.issues.map((issue) => (
                  <li key={issue.message} data-level={issue.level}>
                    {issue.message}
                  </li>
                ))}
              </ul>
            ) : null}
            {parsedPreviewSummary.previewRows.length > 0 ? (
              <div className="excel-preview-table-wrap">
                <table className="excel-preview-table">
                  <thead>
                    <tr>
                      <th scope="col">행</th>
                      {parsedPreviewColumns.map((column) => (
                        <th key={column} scope="col">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedPreviewSummary.previewRows.map((row) => (
                      <tr key={row.rowIndex}>
                        <th scope="row">{row.rowIndex}</th>
                        {parsedPreviewColumns.map((column, columnIndex) => (
                          <td key={`${row.rowIndex}-${column}`}>
                            {row.values[columnIndex] || "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="excel-import-empty">
                표시할 CSV 미리보기 데이터가 없습니다.
              </p>
            )}
          </div>
        </section>
      ) : null}

      {studentRosterCandidateResult ? (
        <section
          className="excel-import-source"
          aria-label="학생 후보 미리보기"
        >
          <div className="excel-import-source__header">
            <div>
              <h4>학생 후보 미리보기</h4>
              <p>
                학년, 반, 번호, 성명, 비고 헤더를 기준으로 학생 후보만
                해석합니다. 적용 버튼은 기존 학생명렬 저장 구조에 정상
                학생만 저장하고 오류 행은 제외합니다.
              </p>
            </div>
            <span
              data-status={
                studentRosterCandidateResult.status === "unsupported"
                  ? "blocked"
                  : studentRosterCandidateResult.status
              }
            >
              {studentRosterCandidateResult.status === "ready"
                ? "인식됨"
                : studentRosterCandidateResult.status === "error"
                  ? "확인 필요"
                  : "미지원"}
            </span>
          </div>
          <div className="excel-import-source__body">
            <div>
              <strong>학생 후보 요약</strong>
              <small>
                전체 데이터 행 수{" "}
                {studentRosterCandidateResult.summary.totalDataRowCount} · 인식
                학생 수{" "}
                {studentRosterCandidateResult.summary.recognizedStudentCount} ·
                누락/오류 행 수{" "}
                {studentRosterCandidateResult.summary.issueRowCount}
              </small>
            </div>
            {studentRosterCandidateResult.issues.length > 0 ? (
              <ul className="excel-source-issue-list">
                {studentRosterCandidateResult.issues.map((issue) => (
                  <li
                    key={`${issue.rowIndex ?? "header"}-${issue.message}`}
                    data-level={issue.level}
                  >
                    {issue.rowIndex ? `${issue.rowIndex}행: ` : ""}
                    {issue.message}
                  </li>
                ))}
              </ul>
            ) : null}
            <div
              className="excel-import-settings__controls"
              aria-label="학생 후보 적용"
            >
              <p>
                적용 시 현재 저장된 학생명렬이 선택한 CSV의 정상 학생 목록으로
                교체됩니다. 오류 행은 제외되며 병합하지 않습니다. 저장 후
                새로고침해도 유지되고 뽑기/사다리/룰렛에서 사용됩니다.
              </p>
              <button
                type="button"
                disabled={!canApplyStudentRoster || isSavingStudentRoster}
                onClick={applyStudentRosterCandidatesToStorage}
              >
                {isSavingStudentRoster
                  ? "학생명렬 저장 중"
                  : `정상 학생 ${studentRosterApplyCount}명 적용하고 저장`}
              </button>
            </div>
            {studentRosterApplySummary ? (
              <p className="excel-import-settings__notice" aria-live="polite">
                학생명렬에 {studentRosterApplySummary.appliedCount}명을
                적용하고 저장했습니다. 오류 행{" "}
                {studentRosterApplySummary.excludedIssueRowCount}개는
                제외했습니다. 새로고침 후에도 유지되고 학생 기반 위젯에서
                사용됩니다.
              </p>
            ) : null}
            {studentRosterCandidateResult.previewCandidates.length > 0 ? (
              <div className="excel-preview-table-wrap">
                <table className="excel-preview-table">
                  <thead>
                    <tr>
                      <th scope="col">학년</th>
                      <th scope="col">반</th>
                      <th scope="col">번호</th>
                      <th scope="col">성명</th>
                      <th scope="col">비고</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentRosterCandidateResult.previewCandidates.map(
                      (candidate) => (
                        <tr key={candidate.sourceRowIndex}>
                          <td>{candidate.grade}</td>
                          <td>{candidate.className}</td>
                          <td>{candidate.number}</td>
                          <td>{candidate.name}</td>
                          <td>{candidate.note || "-"}</td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="excel-import-empty">
                표시할 학생 후보 데이터가 없습니다.
              </p>
            )}
          </div>
        </section>
      ) : null}

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
