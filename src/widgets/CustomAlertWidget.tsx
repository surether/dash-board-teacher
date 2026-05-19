import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Plus, X } from "lucide-react";
import { STORAGE_SCHEMA_VERSION, WIDGET_STORAGE_KEYS, widgetStorage } from "../storage/widgetStorage";
import type { CustomAlertItem } from "../types/dashboard";

const defaultAlerts: CustomAlertItem[] = [
  {
    id: "exam",
    label: "수행평가 마감",
    targetDate: todayKey(),
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "meeting",
    label: "학부모 상담 주간",
    targetDate: dateOffsetKey(7),
    createdAt: "2026-01-01T00:00:01.000Z",
  },
];

const migratedDefaultAlertLabels: Record<string, string> = {
  morning: "아침 회의",
  pickup: "하교 픽업 메모",
};

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return String(Date.now());
}

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateOffsetKey(days: number) {
  const next = new Date();
  next.setDate(next.getDate() + days);
  const year = next.getFullYear();
  const month = String(next.getMonth() + 1).padStart(2, "0");
  const day = String(next.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeCreatedAt(value: unknown, index: number) {
  if (typeof value === "string" && !Number.isNaN(Date.parse(value))) {
    return value;
  }

  return new Date(index).toISOString();
}

function normalizeAlerts(
  value: unknown,
  migrationVersion: number | null,
): CustomAlertItem[] {
  if (!Array.isArray(value)) {
    return defaultAlerts;
  }

  return value
    .filter((item) => item && typeof item === "object")
    .map((item, index) => {
      const alert = item as Partial<CustomAlertItem> & { time?: string };
      const shouldMigrateSample =
        migrationVersion !== STORAGE_SCHEMA_VERSION &&
        typeof alert.id === "string" &&
        Boolean(migratedDefaultAlertLabels[alert.id]);

      return {
        id: typeof alert.id === "string" ? alert.id : createId(),
        label: shouldMigrateSample
          ? migratedDefaultAlertLabels[alert.id as string]
          : typeof alert.label === "string"
            ? alert.label
            : "제목 없는 알림",
        targetDate:
          typeof alert.targetDate === "string" && alert.targetDate
            ? alert.targetDate
            : todayKey(),
        createdAt: normalizeCreatedAt(alert.createdAt, index),
        updatedAt:
          typeof alert.updatedAt === "string" ? alert.updatedAt : undefined,
      };
    });
}

function daysUntil(targetDate: string) {
  const today = new Date(`${todayKey()}T00:00:00`);
  const target = new Date(`${targetDate}T00:00:00`);
  return Math.ceil(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
}

function calculateDday(targetDate: string) {
  if (!targetDate) {
    return "날짜 미정";
  }

  const diff = daysUntil(targetDate);

  if (diff === 0) {
    return "D-Day";
  }

  return diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;
}

function formatTargetDate(value: string) {
  if (!value) {
    return "목표 날짜 없음";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function targetDateRank(value: string) {
  const timestamp = new Date(`${value}T00:00:00`).getTime();
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
}

function compareAlerts(a: CustomAlertItem, b: CustomAlertItem) {
  const aDiff = daysUntil(a.targetDate);
  const bDiff = daysUntil(b.targetDate);
  const aPast = aDiff < 0;
  const bPast = bDiff < 0;

  if (aPast !== bPast) {
    return Number(aPast) - Number(bPast);
  }

  const dateDiff = aPast
    ? targetDateRank(b.targetDate) - targetDateRank(a.targetDate)
    : targetDateRank(a.targetDate) - targetDateRank(b.targetDate);
  if (dateDiff !== 0) {
    return dateDiff;
  }

  return Date.parse(a.createdAt) - Date.parse(b.createdAt);
}

export function CustomAlertWidget() {
  const [alerts, setAlerts] = useState<CustomAlertItem[]>(defaultAlerts);
  const [label, setLabel] = useState("");
  const [targetDate, setTargetDate] = useState(todayKey);
  const hasHydrated = useRef(false);

  const sortedAlerts = useMemo(() => [...alerts].sort(compareAlerts), [alerts]);

  useEffect(() => {
    let isMounted = true;

    async function hydrateAlerts() {
      const [savedAlerts, migrationVersion] = await Promise.all([
        widgetStorage.getItem<unknown>(WIDGET_STORAGE_KEYS.customAlerts),
        widgetStorage.getItem<number>(
          WIDGET_STORAGE_KEYS.customAlertsMigrationVersion,
        ),
      ]);

      if (!isMounted) {
        return;
      }

      if (savedAlerts !== null) {
        setAlerts(normalizeAlerts(savedAlerts, migrationVersion));
      }

      hasHydrated.current = true;
      void widgetStorage.setItem(
        WIDGET_STORAGE_KEYS.customAlertsMigrationVersion,
        STORAGE_SCHEMA_VERSION,
      );
    }

    void hydrateAlerts();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (hasHydrated.current) {
      void widgetStorage.setItem(WIDGET_STORAGE_KEYS.customAlerts, alerts);
    }
  }, [alerts]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextLabel = label.trim();

    if (!nextLabel) {
      return;
    }

    const now = new Date().toISOString();
    setAlerts((current) => [
      { id: createId(), label: nextLabel, targetDate, createdAt: now },
      ...current,
    ]);
    setLabel("");
    setTargetDate(todayKey());
  }

  function deleteAlert(alertId: string) {
    setAlerts((current) => current.filter((item) => item.id !== alertId));
  }

  return (
    <div className="custom-alert-widget">
      <form className="alert-form" onSubmit={handleSubmit}>
        <input
          value={label}
          aria-label="알림 제목"
          placeholder="알림 제목"
          onChange={(event) => setLabel(event.target.value)}
        />
        <input
          type="date"
          value={targetDate}
          aria-label="목표 날짜"
          onChange={(event) => setTargetDate(event.target.value)}
        />
        <button type="submit" aria-label="알림 추가">
          <Plus size={16} />
        </button>
      </form>

      <ul className="alert-list">
        {sortedAlerts.map((alert) => (
          <li key={alert.id}>
            <CalendarDays size={15} />
            <span className="alert-list__dday">
              {calculateDday(alert.targetDate)}
            </span>
            <span className="alert-list__content">
              <strong>{alert.label}</strong>
              <small>{formatTargetDate(alert.targetDate)}</small>
            </span>
            <button
              type="button"
              aria-label={`${alert.label} 삭제`}
              onClick={() => deleteAlert(alert.id)}
            >
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
