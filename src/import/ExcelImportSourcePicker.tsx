import { Upload } from "lucide-react";
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
  async function handleSourceRequest() {
    onRequest();

    try {
      const result = await noopExcelImportSourceAdapter.selectSource();
      onResult(result);
    } catch {
      onError("source adapter 요청 중 오류가 발생했습니다.");
    }
  }

  return (
    <button type="button" disabled={disabled} onClick={handleSourceRequest}>
      <Upload size={15} />
      경계 확인
    </button>
  );
}
