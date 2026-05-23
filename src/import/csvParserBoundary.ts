import * as Papa from "papaparse";
import type { ParseError, ParseResult } from "papaparse";
import type { ExcelImportSourceMeta } from "../types/dashboard";
import {
  createUnsupportedExcelParsedPreviewResult,
  type ExcelParsedPreviewIssue,
  type ExcelParsedPreviewResult,
} from "./excelParserBoundary";

const CSV_PREVIEW_ROW_LIMIT = 20;
const CSV_PREVIEW_COLUMN_LIMIT = 20;

export type CsvParserBoundaryInput = {
  source: ExcelImportSourceMeta | null;
  text: string;
};

export type CsvParsedPreviewRow = {
  rowIndex: number;
  values: string[];
};

export type CsvParserBoundaryResult = ExcelParsedPreviewResult & {
  previewRows: CsvParsedPreviewRow[];
};

export type CsvParserBoundaryLibraryTypes = {
  result: ParseResult<string[]>;
  error: ParseError;
};

export function createCsvParserBoundaryResult(
  input: CsvParserBoundaryInput,
): CsvParserBoundaryResult {
  if (input.text.trim().length === 0) {
    return createCsvParserBoundaryErrorResult(
      input.source,
      "CSV 파일에 표시할 데이터가 없습니다.",
    );
  }

  const parseResult = Papa.parse<string[]>(input.text, {
    header: false,
    skipEmptyLines: true,
  });
  const normalizedRows = parseResult.data.map(normalizeCsvRow);
  const issues = parseResult.errors.map(createCsvPreviewIssue);

  if (normalizedRows.length === 0) {
    issues.push({
      level: "error",
      message: "CSV 파일에 표시할 데이터가 없습니다.",
    });
  }

  return {
    status: issues.some((issue) => issue.level === "error") ? "error" : "ready",
    source: input.source,
    rowCount: normalizedRows.length,
    columnCount: normalizedRows.reduce(
      (maxCount, row) => Math.max(maxCount, row.length),
      0,
    ),
    issues,
    previewRows: normalizedRows
      .slice(0, CSV_PREVIEW_ROW_LIMIT)
      .map((row, index) => ({
        rowIndex: index + 1,
        values: row.slice(0, CSV_PREVIEW_COLUMN_LIMIT),
      })),
  };
}

export function createCsvParserBoundaryErrorResult(
  source: CsvParserBoundaryInput["source"],
  message: string,
): CsvParserBoundaryResult {
  return {
    status: "error",
    source,
    rowCount: null,
    columnCount: null,
    issues: [
      {
        level: "error",
        message,
      },
    ],
    previewRows: [],
  };
}

export function createUnsupportedCsvParsedPreviewResult(
  source: CsvParserBoundaryInput["source"],
): CsvParserBoundaryResult {
  return {
    ...createUnsupportedExcelParsedPreviewResult(source),
    previewRows: [],
  };
}

function normalizeCsvRow(row: unknown): string[] {
  if (Array.isArray(row)) {
    return row.map(formatCsvPreviewCell);
  }

  return [formatCsvPreviewCell(row)];
}

function formatCsvPreviewCell(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function createCsvPreviewIssue(error: ParseError): ExcelParsedPreviewIssue {
  return {
    level: "error",
    message: error.message,
  };
}
