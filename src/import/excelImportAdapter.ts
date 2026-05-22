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
