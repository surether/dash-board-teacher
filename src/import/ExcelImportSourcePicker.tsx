import { Upload } from "lucide-react";
import { useRef } from "react";
import { noopExcelImportSourceAdapter } from "./excelImportAdapter";
import type { ExcelImportSourceResult } from "../types/dashboard";

interface ExcelImportSourcePickerProps {
  disabled?: boolean;
  onRequest: () => void;
  onResult: (result: ExcelImportSourceResult) => void;
  onError: (message: string) => void;
}

export function ExcelImportSourcePicker({
  disabled = false,
  onRequest,
  onResult,
  onError,
}: ExcelImportSourcePickerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleSourceRequest() {
    onRequest();
    inputRef.current?.click();
  }

  async function handleSourceBoundaryChange() {
    try {
      const result = await noopExcelImportSourceAdapter.selectSource();
      onResult(result);
    } catch {
      onError("source adapter 요청 중 오류가 발생했습니다.");
    }
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
