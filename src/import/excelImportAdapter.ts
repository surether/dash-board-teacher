import type {
  ExcelImportSourceMeta,
  ExcelImportSourceResult,
  ExcelImportValidationIssue,
  ExcelWorkbookParseResult,
} from "../types/dashboard";

const adapterBlockedIssue: ExcelImportValidationIssue = {
  level: "warning",
  message: "현재 단계에서는 파일 선택과 파싱 adapter 경계만 준비되어 있습니다.",
};

export interface ExcelImportSourceAdapter {
  selectSource(): Promise<ExcelImportSourceResult>;
}

// Future parser implementations should receive this shape after a browser
// boundary has explicitly acquired bytes. Phase 3-J-E does not create buffers.
export interface ExcelWorkbookParseInput {
  source: ExcelImportSourceMeta;
  buffer: ArrayBuffer;
}

// This metadata-only adapter is not enough for real workbook parsing. It cannot
// read file bytes or acquire binary payloads. Browser FileReader work must stay
// in BrowserExcelParserBoundary or a sibling boundary. Keep this blocked/noop
// contract until a later phase replaces it with ExcelWorkbookParseInput.
export interface ExcelWorkbookParserAdapter {
  parseSource(source: ExcelImportSourceMeta): Promise<ExcelWorkbookParseResult>;
}

export const noopExcelImportSourceAdapter: ExcelImportSourceAdapter = {
  async selectSource() {
    return {
      status: "blocked",
      source: null,
      issues: [adapterBlockedIssue],
    };
  },
};

export const noopExcelWorkbookParserAdapter: ExcelWorkbookParserAdapter = {
  async parseSource() {
    return {
      status: "blocked",
      workbook: null,
      issues: [adapterBlockedIssue],
    };
  },
};
