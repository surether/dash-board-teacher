import { Upload } from "lucide-react";
import type { ChangeEvent } from "react";
import { useRef } from "react";
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
  onError: (message: string) => void;
}

export function ExcelImportSourcePicker({
  disabled = false,
  onRequest,
  onResult,
  onFileReadResult,
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
    const selectedFile = event.currentTarget.files?.item(0);

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
      event.currentTarget.value = "";
      return;
    }

    onFileReadResult?.({
      status: fileReadResult.status,
      source: fileReadResult.source,
      hasBuffer: fileReadResult.buffer !== null,
      issues: fileReadResult.issues,
    });
    onResult({
      status:
        fileReadResult.status === "cancelled" ? "blocked" : fileReadResult.status,
      source: fileReadResult.source,
      issues: fileReadResult.issues,
    });

    event.currentTarget.value = "";
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
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
