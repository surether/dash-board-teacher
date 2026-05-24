interface AcademicEvent {
  date: string;
  title: string;
  type: string;
}

const academicEvents: AcademicEvent[] = [
  { date: "05.27", title: "학급 자치 활동", type: "학급" },
  { date: "06.03", title: "수행평가 점검", type: "평가" },
  { date: "06.10", title: "진로 탐색 활동", type: "진로" },
  { date: "06.18", title: "학교 안전교육", type: "교육" },
];

export function AcademicCalendarWidget() {
  return (
    <div className="academic-calendar-widget">
      <div className="academic-calendar-widget__header">
        <strong>다가오는 예시 일정</strong>
        <span>이번 달/다음 달</span>
      </div>

      <ul className="academic-event-list" aria-label="학사일정 예시 목록">
        {academicEvents.map((event) => (
          <li className="academic-event-card" key={`${event.date}-${event.title}`}>
            <time dateTime={`2026-${event.date.replace(".", "-")}`}>{event.date}</time>
            <span>
              <strong>{event.title}</strong>
              <small>예시 일정</small>
            </span>
            <em>{event.type}</em>
          </li>
        ))}
      </ul>

      <p className="academic-calendar-widget__note">
        현재 학사일정은 기본 예시입니다. 편집과 저장 기능은 후속 Phase에서 추가합니다.
      </p>
    </div>
  );
}
