import { FormEvent, useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { STORAGE_SCHEMA_VERSION, WIDGET_STORAGE_KEYS, widgetStorage } from "../storage/widgetStorage";
import type { StickyNoteColor, StickyNoteItem } from "../types/dashboard";

const defaultNotes: StickyNoteItem[] = [
  {
    id: "welcome",
    text: "오늘 확인할 내용을 적어두세요.",
    color: "yellow",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

const stickyColors: Array<{ value: StickyNoteColor; label: string }> = [
  { value: "yellow", label: "노랑" },
  { value: "green", label: "초록" },
  { value: "blue", label: "파랑" },
  { value: "pink", label: "분홍" },
  { value: "gray", label: "회색" },
];

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return String(Date.now());
}

function isStickyNoteColor(value: unknown): value is StickyNoteColor {
  return (
    value === "yellow" ||
    value === "green" ||
    value === "blue" ||
    value === "pink" ||
    value === "gray"
  );
}

function normalizeCreatedAt(value: unknown, index: number) {
  if (typeof value === "string" && !Number.isNaN(Date.parse(value))) {
    return value;
  }

  return new Date(index).toISOString();
}

function normalizeNotes(value: unknown): StickyNoteItem[] {
  if (!Array.isArray(value)) {
    return defaultNotes;
  }

  return value
    .filter((item) => item && typeof item === "object")
    .map((item, index) => {
      const note = item as Partial<StickyNoteItem>;

      return {
        id: typeof note.id === "string" ? note.id : createId(),
        text: typeof note.text === "string" ? note.text : "",
        color: isStickyNoteColor(note.color) ? note.color : "yellow",
        createdAt: normalizeCreatedAt(note.createdAt, index),
        updatedAt:
          typeof note.updatedAt === "string" ? note.updatedAt : undefined,
      };
    });
}

export function StickyNotesWidget() {
  const [notes, setNotes] = useState<StickyNoteItem[]>(defaultNotes);
  const [draft, setDraft] = useState("");
  const [draftColor, setDraftColor] = useState<StickyNoteColor>("yellow");
  const hasHydrated = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function hydrateNotes() {
      const savedNotes = await widgetStorage.getItem<unknown>(
        WIDGET_STORAGE_KEYS.stickyNotes,
      );

      if (!isMounted) {
        return;
      }

      if (savedNotes !== null) {
        setNotes(normalizeNotes(savedNotes));
      }

      hasHydrated.current = true;
      void widgetStorage.setItem(
        WIDGET_STORAGE_KEYS.stickyNotesMigrationVersion,
        STORAGE_SCHEMA_VERSION,
      );
    }

    void hydrateNotes();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (hasHydrated.current) {
      void widgetStorage.setItem(WIDGET_STORAGE_KEYS.stickyNotes, notes);
    }
  }, [notes]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();

    if (!text) {
      return;
    }

    setNotes((current) => [
      {
        id: createId(),
        text,
        color: draftColor,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
    setDraft("");
    setDraftColor("yellow");
  }

  function updateNote(noteId: string, patch: Partial<StickyNoteItem>) {
    const updatedAt = new Date().toISOString();
    setNotes((current) =>
      current.map((item) =>
        item.id === noteId ? { ...item, ...patch, updatedAt } : item,
      ),
    );
  }

  function deleteNote(noteId: string) {
    setNotes((current) => current.filter((item) => item.id !== noteId));
  }

  return (
    <div className="sticky-notes-widget">
      <form className="sticky-note-form" onSubmit={handleSubmit}>
        <input
          value={draft}
          aria-label="포스트잇 내용"
          maxLength={80}
          placeholder="짧은 메모"
          onChange={(event) => setDraft(event.target.value)}
        />
        <div className="sticky-color-picker" aria-label="포스트잇 색상 선택">
          {stickyColors.map((color) => (
            <button
              key={color.value}
              type="button"
              data-color={color.value}
              className={draftColor === color.value ? "is-active" : ""}
              aria-label={`${color.label} 포스트잇`}
              aria-pressed={draftColor === color.value}
              onClick={() => setDraftColor(color.value)}
              title={`${color.label} 포스트잇`}
            >
              <span />
            </button>
          ))}
        </div>
        <button type="submit" aria-label="포스트잇 추가">
          <Plus size={16} />
        </button>
      </form>

      <ul className="sticky-note-list">
        {notes.map((note) => (
          <li key={note.id} data-color={note.color}>
            <textarea
              value={note.text}
              aria-label="포스트잇"
              maxLength={120}
              onChange={(event) =>
                updateNote(note.id, { text: event.target.value })
              }
            />
            <div className="sticky-note-list__colors" aria-label="포스트잇 색상 변경">
              {stickyColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  data-color={color.value}
                  className={note.color === color.value ? "is-active" : ""}
                  aria-label={`${color.label}으로 변경`}
                  aria-pressed={note.color === color.value}
                  onClick={() => updateNote(note.id, { color: color.value })}
                >
                  <span />
                </button>
              ))}
            </div>
            <button
              type="button"
              className="sticky-note-list__delete"
              aria-label="포스트잇 삭제"
              onClick={() => deleteNote(note.id)}
            >
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
