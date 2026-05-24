type WeekdayKey = "mon" | "tue" | "wed" | "thu" | "fri";

interface WeekdayColumn {
  key: WeekdayKey;
  label: string;
}

const weekdays: WeekdayColumn[] = [
  { key: "mon", label: "월" },
  { key: "tue", label: "화" },
  { key: "wed", label: "수" },
  { key: "thu", label: "목" },
  { key: "fri", label: "금" },
];

const timetableRows: Array<Record<WeekdayKey, string> & { period: number }> = [
  { period: 1, mon: "국어", tue: "수학", wed: "영어", thu: "과학", fri: "사회" },
  { period: 2, mon: "수학", tue: "국어", wed: "체육", thu: "영어", fri: "과학" },
  { period: 3, mon: "영어", tue: "사회", wed: "국어", thu: "수학", fri: "음악" },
  { period: 4, mon: "과학", tue: "미술", wed: "수학", thu: "국어", fri: "체육" },
  { period: 5, mon: "사회", tue: "영어", wed: "창체", thu: "미술", fri: "수학" },
  { period: 6, mon: "체육", tue: "과학", wed: "사회", thu: "창체", fri: "국어" },
  { period: 7, mon: "자율", tue: "창체", wed: "음악", thu: "사회", fri: "자율" },
];

function getCurrentWeekdayKey(): WeekdayKey | null {
  const day = new Date().getDay();
  if (day < 1 || day > 5) {
    return null;
  }

  return weekdays[day - 1].key;
}

export function TimetableWidget() {
  const currentWeekdayKey = getCurrentWeekdayKey();

  return (
    <div className="timetable-widget">
      <div className="timetable-widget__table-wrap">
        <table className="timetable-table" aria-label="월요일부터 금요일까지 1교시부터 7교시 시간표">
          <thead>
            <tr>
              <th scope="col">교시</th>
              {weekdays.map((day) => (
                <th
                  className={day.key === currentWeekdayKey ? "is-current-day" : undefined}
                  key={day.key}
                  scope="col"
                >
                  {day.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timetableRows.map((row) => (
              <tr key={row.period}>
                <th scope="row">{row.period}교시</th>
                {weekdays.map((day) => (
                  <td
                    className={day.key === currentWeekdayKey ? "is-current-day" : undefined}
                    key={day.key}
                  >
                    {row[day.key] || "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="timetable-widget__note">
        현재 시간표는 기본 예시입니다. 편집과 저장 기능은 후속 Phase에서 추가합니다.
      </p>
    </div>
  );
}
