import type {
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

// Phase 3-J-C keeps this as a FileReader boundary skeleton only.
// A future implementation may own browser-only binary acquisition here, but
// this boundary must stay blocked until a phase explicitly opens file reading.
// It must return parser results only, not preview rows, import plans, or writes.
export interface BrowserExcelParserBoundary {
  parseSelectedSource(): Promise<ExcelWorkbookParseResult>;
}

export const noopBrowserExcelParserBoundary: BrowserExcelParserBoundary = {
  async parseSelectedSource() {
    return parserBoundaryBlockedResult;
  },
};
