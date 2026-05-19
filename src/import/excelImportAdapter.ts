import type {
  ExcelImportSourceMeta,
  ExcelImportSourceResult,
  ExcelImportValidationIssue,
  ExcelWorkbookParseResult,
} from "../types/dashboard";

const adapterBlockedIssue: ExcelImportValidationIssue = {
  level: "warning",
  message:
    "Import source and parser adapters are skeletons only in Phase 3-B2.",
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
