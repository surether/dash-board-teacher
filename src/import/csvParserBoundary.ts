import type { ParseError, ParseResult } from "papaparse";
import type { ExcelImportSourceMeta } from "../types/dashboard";
import {
  createUnsupportedExcelParsedPreviewResult,
  type ExcelParsedPreviewResult,
} from "./excelParserBoundary";

export type CsvParserBoundaryInput = {
  source: ExcelImportSourceMeta | null;
  text: string;
};

export type CsvParserBoundaryResult = ExcelParsedPreviewResult;

export type CsvParserBoundaryLibraryTypes = {
  result: ParseResult<unknown>;
  error: ParseError;
};

export function createUnsupportedCsvParsedPreviewResult(
  source: CsvParserBoundaryInput["source"],
): CsvParserBoundaryResult {
  return createUnsupportedExcelParsedPreviewResult(source);
}
