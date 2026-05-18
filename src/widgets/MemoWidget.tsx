import { useEffect, useState } from "react";

const MEMO_STORAGE_KEY = "teacher-widget-dashboard:memo:v1";

export function MemoWidget() {
  const [memo, setMemo] = useState("");

  useEffect(() => {
    const savedMemo = window.localStorage.getItem(MEMO_STORAGE_KEY);
    if (savedMemo) {
      setMemo(savedMemo);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(MEMO_STORAGE_KEY, memo);
  }, [memo]);

  return (
    <div className="memo-widget">
      <textarea
        value={memo}
        aria-label="Memo"
        placeholder="Capture a quick note..."
        onChange={(event) => setMemo(event.target.value)}
      />
    </div>
  );
}
