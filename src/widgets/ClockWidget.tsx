import { useEffect, useMemo, useState } from "react";

export function ClockWidget() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const formatted = useMemo(() => {
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    return {
      time: `${hours}:${minutes}:${seconds}`,
      date: new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      }).format(now),
    };
  }, [now]);

  return (
    <div className="clock-widget">
      <div className="clock-widget__time">{formatted.time}</div>
      <div className="clock-widget__date">{formatted.date}</div>
      <div className="clock-widget__status">
        <span />
        수업 준비 상태
      </div>
    </div>
  );
}
