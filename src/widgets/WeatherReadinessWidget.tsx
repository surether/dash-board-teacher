interface WeatherHint {
  title: string;
  detail: string;
}

interface ReadinessItem {
  label: string;
  description: string;
}

const weatherHints: WeatherHint[] = [
  {
    title: "비 오는 날",
    detail: "우산, 여분 양말, 실내화 상태를 확인하세요.",
  },
  {
    title: "더운 날",
    detail: "물병, 손수건, 냉방 대비 겉옷을 확인하세요.",
  },
  {
    title: "미세먼지 나쁨",
    detail: "마스크와 실외 활동 여부를 확인하세요.",
  },
];

const readinessItems: ReadinessItem[] = [
  {
    label: "우산 확인",
    description: "비 예보가 있는 날은 우산을 준비하세요.",
  },
  {
    label: "미세먼지 확인",
    description: "등교 전 미세먼지 단계와 마스크 필요 여부를 확인하세요.",
  },
  {
    label: "체육복 확인",
    description: "체육 수업 또는 활동이 있는 날은 체육복을 준비하세요.",
  },
  {
    label: "물병 준비",
    description: "더운 날에는 개인 물병을 준비하세요.",
  },
];

export function WeatherReadinessWidget() {
  return (
    <div className="weather-readiness-widget">
      <p className="weather-readiness-widget__notice">
        현재 위젯은 등교 준비용 예시 안내입니다. 실시간 날씨 연동은 후속 Phase에서 검토합니다.
      </p>

      <section className="weather-readiness-widget__section" aria-labelledby="weather-readiness-hints">
        <h3 id="weather-readiness-hints">확인 안내</h3>
        <div className="weather-hint-grid">
          {weatherHints.map((hint) => (
            <article className="weather-hint-card" key={hint.title}>
              <strong>{hint.title}</strong>
              <span>{hint.detail}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="weather-readiness-widget__section" aria-labelledby="weather-readiness-items">
        <h3 id="weather-readiness-items">등교 준비</h3>
        <ul className="readiness-list">
          {readinessItems.map((item) => (
            <li className="readiness-item" key={item.label}>
              <span>
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
