import { useEffect, useMemo, useState } from "react";

export function ClockWidget() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const formatted = useMemo(() => {
    return {
      time: new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(now),
      date: new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(now),
    };
  }, [now]);

  return (
    <div className="clock-widget">
      <div className="clock-widget__time">{formatted.time}</div>
      <div className="clock-widget__date">{formatted.date}</div>
      <div className="clock-widget__status">
        <span />
        Ready for class
      </div>
    </div>
  );
}
