import { Upload } from "lucide-react";
import type { ChangeEvent } from "react";
import { useRef } from "react";
import {
  createCsvParserBoundaryErrorResult,
  createCsvParserBoundaryResult,
  createUnsupportedCsvParsedPreviewResult,
  type CsvParserBoundaryResult,
} from "./csvParserBoundary";
import { noopExcelImportSourceAdapter } from "./excelImportAdapter";
import {
  readBrowserExcelFileAsArrayBuffer,
  type BrowserExcelFileReadResult,
} from "./excelParserBoundary";
import type { ExcelImportSourceResult } from "../types/dashboard";

type ExcelImportFileReadBoundaryState = {
  status: BrowserExcelFileReadResult["status"];
  source: BrowserExcelFileReadResult["source"];
  hasBuffer: boolean;
  issues: BrowserExcelFileReadResult["issues"];
};

interface ExcelImportSourcePickerProps {
  disabled?: boolean;
  onRequest: () => void;
  onResult: (result: ExcelImportSourceResult) => void;
  onFileReadResult?: (result: ExcelImportFileReadBoundaryState) => void;
  onCsvPreviewResult?: (result: CsvParserBoundaryResult) => void;
  onError: (message: string) => void;
}

export function ExcelImportSourcePicker({
  disabled = false,
  onRequest,
  onResult,
  onFileReadResult,
  onCsvPreviewResult,
  onError,
}: ExcelImportSourcePickerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleSourceRequest() {
    onRequest();
    inputRef.current?.click();
    void emitBlockedResult();
  }

  async function emitBlockedResult() {
    try {
      const result = await noopExcelImportSourceAdapter.selectSource();
      onResult(result);
    } catch {
      onError("source adapter 요청 중 오류가 발생했습니다.");
    }
  }

  async function handleSourceBoundaryChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const inputElement = event.currentTarget;
    const selectedFile = inputElement.files?.item(0);

    if (!selectedFile) {
      await emitBlockedResult();
      return;
    }

    const source = {
      id: `${selectedFile.name}-${selectedFile.size}-${selectedFile.lastModified}`,
      fileName: selectedFile.name,
      selectedAt: new Date().toISOString(),
      size: selectedFile.size,
      mimeType: selectedFile.type,
      lastModified: selectedFile.lastModified,
    };
    let fileReadResult: BrowserExcelFileReadResult;

    try {
      fileReadResult = await readBrowserExcelFileAsArrayBuffer(
        selectedFile,
        source,
      );
    } catch {
      onError("파일 읽기 경계에서 오류가 발생했습니다.");
      inputElement.value = "";
      return;
    }

    onFileReadResult?.({
      status: fileReadResult.status,
      source: fileReadResult.source,
      hasBuffer: fileReadResult.buffer !== null,
      issues: fileReadResult.issues,
    });
    if (fileReadResult.status === "ready" && fileReadResult.buffer !== null) {
      if (isCsvFile(selectedFile)) {
        try {
          const csvText = await selectedFile.text();

          onCsvPreviewResult?.(
            createCsvParserBoundaryResult({
              source,
              text: csvText,
            }),
          );
        } catch {
          onCsvPreviewResult?.(
            createCsvParserBoundaryErrorResult(
              source,
              "CSV 텍스트를 읽는 중 오류가 발생했습니다.",
            ),
          );
        }
      } else {
        onCsvPreviewResult?.(createUnsupportedCsvParsedPreviewResult(source));
      }
    }
    onResult({
      status:
        fileReadResult.status === "cancelled" ? "blocked" : fileReadResult.status,
      source: fileReadResult.source,
      issues: fileReadResult.issues,
    });

    inputElement.value = "";
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv,.xlsx,.xls"
        hidden
        tabIndex={-1}
        onChange={handleSourceBoundaryChange}
      />
      <button type="button" disabled={disabled} onClick={handleSourceRequest}>
        <Upload size={15} />
        경계 확인
      </button>
    </>
  );
}

function isCsvFile(file: File) {
  const fileName = file.name.toLowerCase();
  const mimeType = file.type.toLowerCase();

  return fileName.endsWith(".csv") || mimeType === "text/csv";
}
