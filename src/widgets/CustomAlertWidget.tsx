import { FormEvent, useEffect, useState } from "react";
import { Bell, Plus, X } from "lucide-react";

interface AlertItem {
  id: string;
  label: string;
  time: string;
}

const ALERT_STORAGE_KEY = "teacher-widget-dashboard:alerts:v1";

const defaultAlerts: AlertItem[] = [
  { id: "morning", label: "Morning meeting", time: "08:30" },
  { id: "pickup", label: "Parent pickup note", time: "15:20" },
];

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return String(Date.now());
}

export function CustomAlertWidget() {
  const [alerts, setAlerts] = useState<AlertItem[]>(defaultAlerts);
  const [label, setLabel] = useState("");
  const [time, setTime] = useState("09:00");

  useEffect(() => {
    const savedAlerts = window.localStorage.getItem(ALERT_STORAGE_KEY);
    if (savedAlerts) {
      setAlerts(JSON.parse(savedAlerts) as AlertItem[]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(ALERT_STORAGE_KEY, JSON.stringify(alerts));
  }, [alerts]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextLabel = label.trim();

    if (!nextLabel) {
      return;
    }

    setAlerts((current) => [
      { id: createId(), label: nextLabel, time },
      ...current,
    ]);
    setLabel("");
  }

  return (
    <div className="custom-alert-widget">
      <form className="alert-form" onSubmit={handleSubmit}>
        <input
          value={label}
          aria-label="Alert label"
          placeholder="Reminder"
          onChange={(event) => setLabel(event.target.value)}
        />
        <input
          type="time"
          value={time}
          aria-label="Alert time"
          onChange={(event) => setTime(event.target.value)}
        />
        <button type="submit" aria-label="Add alert">
          <Plus size={16} />
        </button>
      </form>

      <ul className="alert-list">
        {alerts.map((alert) => (
          <li key={alert.id}>
            <Bell size={15} />
            <span>{alert.time}</span>
            <strong>{alert.label}</strong>
            <button
              type="button"
              aria-label={`Remove ${alert.label}`}
              onClick={() =>
                setAlerts((current) =>
                  current.filter((item) => item.id !== alert.id),
                )
              }
            >
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
