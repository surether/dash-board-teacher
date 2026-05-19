import { useEffect, useRef, useState } from "react";
import { STORAGE_SCHEMA_VERSION, WIDGET_STORAGE_KEYS, widgetStorage } from "../storage/widgetStorage";
import type { MemoState } from "../types/dashboard";

type SaveStatus = "idle" | "typing" | "saved";

function formatSavedTime(value: string | null) {
  if (!value) {
    return "아직 저장 전";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}

function normalizeMemoState(value: MemoState | string | null): MemoState {
  if (typeof value === "string") {
    return {
      text: value,
      updatedAt: null,
    };
  }

  return {
    text: typeof value?.text === "string" ? value.text : "",
    updatedAt: typeof value?.updatedAt === "string" ? value.updatedAt : null,
  };
}

export function MemoWidget() {
  const [memo, setMemo] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const hasHydrated = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function hydrateMemo() {
      const savedMemo = await widgetStorage.getItem<MemoState | string>(
        WIDGET_STORAGE_KEYS.memo,
      );
      const normalizedMemo = normalizeMemoState(savedMemo);

      if (!isMounted) {
        return;
      }

      setMemo(normalizedMemo.text);
      setLastSavedAt(normalizedMemo.updatedAt);
      setSaveStatus(normalizedMemo.updatedAt ? "saved" : "idle");
      hasHydrated.current = true;
      void widgetStorage.setItem(
        WIDGET_STORAGE_KEYS.memoMigrationVersion,
        STORAGE_SCHEMA_VERSION,
      );
    }

    void hydrateMemo();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasHydrated.current) {
      return;
    }

    setSaveStatus("typing");

    const saveTimer = window.setTimeout(() => {
      const updatedAt = new Date().toISOString();
      void widgetStorage.setItem<MemoState>(WIDGET_STORAGE_KEYS.memo, {
        text: memo,
        updatedAt,
      });
      setLastSavedAt(updatedAt);
      setSaveStatus("saved");
    }, 450);

    return () => window.clearTimeout(saveTimer);
  }, [memo]);

  return (
    <div className="memo-widget">
      <textarea
        value={memo}
        aria-label="메모"
        placeholder="빠른 메모를 입력하세요..."
        onChange={(event) => setMemo(event.target.value)}
      />
      <p className="memo-widget__status" aria-live="polite">
        {saveStatus === "typing"
          ? "입력 중"
          : lastSavedAt
            ? `저장됨 · ${formatSavedTime(lastSavedAt)}`
            : "아직 저장 전"}
      </p>
    </div>
  );
}
