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

// Future FileReader ownership belongs here or in a sibling browser boundary.
// This boundary must return parser results only, not preview rows or import plans.
export interface BrowserExcelParserBoundary {
  parseSelectedSource(): Promise<ExcelWorkbookParseResult>;
}

export const noopBrowserExcelParserBoundary: BrowserExcelParserBoundary = {
  async parseSelectedSource() {
    return parserBoundaryBlockedResult;
  },
};
