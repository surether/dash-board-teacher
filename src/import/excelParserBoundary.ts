import type {
  ExcelImportSourceMeta,
  ExcelImportValidationIssue,
  ExcelWorkbookParseResult,
} from "../types/dashboard";

const parserBoundaryBlockedIssue: ExcelImportValidationIssue = {
  level: "warning",
  message:
    "브라우저 parser boundary는 아직 실제 파일 내용 읽기와 파싱을 수행하지 않습니다.",
};

const parserBoundaryBlockedResult = {
  status: "blocked",
  workbook: null,
  issues: [parserBoundaryBlockedIssue],
} satisfies ExcelWorkbookParseResult;

export type BrowserExcelFileReadResult =
  | {
      status: "ready";
      source: ExcelImportSourceMeta;
      buffer: ArrayBuffer;
      issues: ExcelImportValidationIssue[];
    }
  | {
      status: "blocked" | "error" | "cancelled";
      source: ExcelImportSourceMeta | null;
      buffer: null;
      issues: ExcelImportValidationIssue[];
    };

function createFileReadIssue(
  level: ExcelImportValidationIssue["level"],
  message: string,
): ExcelImportValidationIssue {
  return {
    level,
    message,
  };
}

export function readBrowserExcelFileAsArrayBuffer(
  file: File | null,
  source: ExcelImportSourceMeta | null,
): Promise<BrowserExcelFileReadResult> {
  if (!file || !source) {
    return Promise.resolve({
      status: "cancelled",
      source,
      buffer: null,
      issues: [
        createFileReadIssue(
          "warning",
          "File reading was cancelled because no file source was provided.",
        ),
      ],
    });
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve({
          status: "ready",
          source,
          buffer: reader.result,
          issues: [],
        });
        return;
      }

      resolve({
        status: "error",
        source,
        buffer: null,
        issues: [
          createFileReadIssue(
            "error",
            "File reading finished without an ArrayBuffer result.",
          ),
        ],
      });
    };

    reader.onerror = () => {
      resolve({
        status: "error",
        source,
        buffer: null,
        issues: [
          createFileReadIssue(
            "error",
            reader.error?.message || "File reading failed.",
          ),
        ],
      });
    };

    reader.onabort = () => {
      resolve({
        status: "cancelled",
        source,
        buffer: null,
        issues: [createFileReadIssue("warning", "File reading was cancelled.")],
      });
    };

    reader.readAsArrayBuffer(file);
  });
}

// Phase 3-K-B opens file reading above, but parser execution remains blocked.
// It must return parser results only, not preview rows, import plans, or writes.
// Future flow: selected File stays here -> bytes are acquired -> parser input
// is formed -> parser adapter runs outside React settings components.
export interface BrowserExcelParserBoundary {
  parseSelectedSource(): Promise<ExcelWorkbookParseResult>;
}

export const noopBrowserExcelParserBoundary: BrowserExcelParserBoundary = {
  async parseSelectedSource() {
    return parserBoundaryBlockedResult;
  },
};
