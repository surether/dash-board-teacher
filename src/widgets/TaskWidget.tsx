import { FormEvent, useEffect, useState } from "react";
import { Plus } from "lucide-react";

interface TaskItem {
  id: string;
  label: string;
  done: boolean;
}

const TASK_STORAGE_KEY = "teacher-widget-dashboard:tasks:v1";

const defaultTasks: TaskItem[] = [
  { id: "attendance", label: "Check attendance", done: false },
  { id: "homeroom", label: "Review homeroom notes", done: false },
  { id: "materials", label: "Prepare lesson materials", done: true },
];

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return String(Date.now());
}

export function TaskWidget() {
  const [tasks, setTasks] = useState<TaskItem[]>(defaultTasks);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const savedTasks = window.localStorage.getItem(TASK_STORAGE_KEY);
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks) as TaskItem[]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const label = draft.trim();

    if (!label) {
      return;
    }

    setTasks((current) => [
      { id: createId(), label, done: false },
      ...current,
    ]);
    setDraft("");
  }

  return (
    <div className="task-widget">
      <form className="inline-form" onSubmit={handleSubmit}>
        <input
          value={draft}
          aria-label="New task"
          placeholder="Add task"
          onChange={(event) => setDraft(event.target.value)}
        />
        <button type="submit" aria-label="Add task">
          <Plus size={16} />
        </button>
      </form>

      <ul className="task-list">
        {tasks.map((task) => (
          <li key={task.id}>
            <label>
              <input
                type="checkbox"
                checked={task.done}
                onChange={() =>
                  setTasks((current) =>
                    current.map((item) =>
                      item.id === task.id ? { ...item, done: !item.done } : item,
                    ),
                  )
                }
              />
              <span>{task.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
