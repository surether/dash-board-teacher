import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { STORAGE_SCHEMA_VERSION, WIDGET_STORAGE_KEYS, widgetStorage } from "../storage/widgetStorage";
import type { TaskItem, TaskPriority } from "../types/dashboard";

const defaultTasks: TaskItem[] = [
  {
    id: "attendance",
    label: "출석 확인",
    done: false,
    priority: "green",
    dueDate: "",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "homeroom",
    label: "학급 전달사항 점검",
    done: false,
    priority: "yellow",
    dueDate: "",
    createdAt: "2026-01-01T00:00:01.000Z",
  },
  {
    id: "materials",
    label: "수업 자료 준비",
    done: true,
    priority: "red",
    dueDate: "",
    createdAt: "2026-01-01T00:00:02.000Z",
  },
];

const migratedDefaultTaskLabels: Record<string, string> = {
  attendance: "출석 확인",
  homeroom: "학급 전달사항 점검",
  materials: "수업 자료 준비",
};

const priorityOptions: Array<{ value: TaskPriority; label: string }> = [
  { value: "green", label: "낮음" },
  { value: "yellow", label: "보통" },
  { value: "red", label: "높음" },
];

const priorityRank: Record<TaskPriority, number> = {
  red: 0,
  yellow: 1,
  green: 2,
};

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return String(Date.now());
}

function isTaskPriority(value: unknown): value is TaskPriority {
  return value === "green" || value === "yellow" || value === "red";
}

function normalizeCreatedAt(value: unknown, index: number) {
  if (typeof value === "string" && !Number.isNaN(Date.parse(value))) {
    return value;
  }

  return new Date(index).toISOString();
}

function normalizeTasks(value: unknown, migrationVersion: number | null): TaskItem[] {
  if (!Array.isArray(value)) {
    return defaultTasks;
  }

  return value
    .filter((item) => item && typeof item === "object")
    .map((item, index) => {
      const task = item as Partial<TaskItem>;
      const shouldMigrateSample =
        migrationVersion !== STORAGE_SCHEMA_VERSION &&
        typeof task.id === "string" &&
        Boolean(migratedDefaultTaskLabels[task.id]);

      return {
        id: typeof task.id === "string" ? task.id : createId(),
        label: shouldMigrateSample
          ? migratedDefaultTaskLabels[task.id as string]
          : typeof task.label === "string"
            ? task.label
            : "제목 없는 할 일",
        done: Boolean(task.done),
        priority: isTaskPriority(task.priority) ? task.priority : "green",
        dueDate: typeof task.dueDate === "string" ? task.dueDate : "",
        createdAt: normalizeCreatedAt(task.createdAt, index),
        updatedAt:
          typeof task.updatedAt === "string" ? task.updatedAt : undefined,
      };
    });
}

function formatDueDate(value: string) {
  if (!value) {
    return "마감일 없음";
  }

  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function dueDateRank(value: string) {
  if (!value) {
    return Number.MAX_SAFE_INTEGER;
  }

  const timestamp = new Date(`${value}T00:00:00`).getTime();
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
}

function compareTasks(a: TaskItem, b: TaskItem) {
  if (a.done !== b.done) {
    return Number(a.done) - Number(b.done);
  }

  const dueDiff = dueDateRank(a.dueDate) - dueDateRank(b.dueDate);
  if (dueDiff !== 0) {
    return dueDiff;
  }

  const priorityDiff = priorityRank[a.priority] - priorityRank[b.priority];
  if (priorityDiff !== 0) {
    return priorityDiff;
  }

  return Date.parse(a.createdAt) - Date.parse(b.createdAt);
}

export function TaskWidget() {
  const [tasks, setTasks] = useState<TaskItem[]>(defaultTasks);
  const [draft, setDraft] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("green");
  const [dueDate, setDueDate] = useState("");
  const hasHydrated = useRef(false);

  const sortedTasks = useMemo(() => [...tasks].sort(compareTasks), [tasks]);

  useEffect(() => {
    let isMounted = true;

    async function hydrateTasks() {
      const [savedTasks, migrationVersion] = await Promise.all([
        widgetStorage.getItem<unknown>(WIDGET_STORAGE_KEYS.tasks),
        widgetStorage.getItem<number>(WIDGET_STORAGE_KEYS.tasksMigrationVersion),
      ]);

      if (!isMounted) {
        return;
      }

      if (savedTasks !== null) {
        setTasks(normalizeTasks(savedTasks, migrationVersion));
      }

      hasHydrated.current = true;
      void widgetStorage.setItem(
        WIDGET_STORAGE_KEYS.tasksMigrationVersion,
        STORAGE_SCHEMA_VERSION,
      );
    }

    void hydrateTasks();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (hasHydrated.current) {
      void widgetStorage.setItem(WIDGET_STORAGE_KEYS.tasks, tasks);
    }
  }, [tasks]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const label = draft.trim();

    if (!label) {
      return;
    }

    const now = new Date().toISOString();
    setTasks((current) => [
      { id: createId(), label, done: false, priority, dueDate, createdAt: now },
      ...current,
    ]);
    setDraft("");
    setPriority("green");
    setDueDate("");
  }

  function toggleTask(taskId: string) {
    const now = new Date().toISOString();
    setTasks((current) =>
      current.map((item) =>
        item.id === taskId
          ? { ...item, done: !item.done, updatedAt: now }
          : item,
      ),
    );
  }

  function deleteTask(taskId: string) {
    setTasks((current) => current.filter((item) => item.id !== taskId));
  }

  return (
    <div className="task-widget">
      <form className="task-form" onSubmit={handleSubmit}>
        <input
          value={draft}
          aria-label="새 할 일"
          placeholder="할 일 입력"
          onChange={(event) => setDraft(event.target.value)}
        />
        <div className="priority-picker" aria-label="중요도 선택">
          {priorityOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={priority === option.value ? "is-active" : ""}
              data-priority={option.value}
              aria-pressed={priority === option.value}
              aria-label={`${option.label} 중요도`}
              onClick={() => setPriority(option.value)}
              title={`${option.label} 중요도`}
            >
              <span />
            </button>
          ))}
        </div>
        <input
          type="date"
          value={dueDate}
          aria-label="마감일"
          onChange={(event) => setDueDate(event.target.value)}
        />
        <button type="submit" aria-label="할 일 추가">
          <Plus size={16} />
        </button>
      </form>

      <ul className="task-list">
        {sortedTasks.map((task) => (
          <li key={task.id} data-priority={task.priority}>
            <label className={task.done ? "is-done" : ""}>
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleTask(task.id)}
              />
              <span className="task-list__priority" aria-hidden="true" />
              <span className="task-list__content">
                <strong>{task.label}</strong>
                <small>{formatDueDate(task.dueDate)}</small>
              </span>
            </label>
            <button
              type="button"
              className="task-list__delete"
              aria-label={`${task.label} 삭제`}
              onClick={() => deleteTask(task.id)}
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
