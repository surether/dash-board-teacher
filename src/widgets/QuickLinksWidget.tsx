import { ExternalLink } from "lucide-react";

interface QuickLinkItem {
  label: string;
  description: string;
  url: string;
}

interface QuickLinkSection {
  title: string;
  links: QuickLinkItem[];
}

const linkSections: QuickLinkSection[] = [
  {
    title: "바로가기",
    links: [
      {
        label: "나이스",
        description: "학교 행정과 학사 업무",
        url: "https://www.neis.go.kr",
      },
      {
        label: "에듀넷",
        description: "수업 자료와 교육 정보",
        url: "https://www.edunet.net",
      },
      {
        label: "학교알리미",
        description: "학교 주요 공시 정보",
        url: "https://www.schoolinfo.go.kr",
      },
    ],
  },
  {
    title: "중요사이트",
    links: [
      {
        label: "교육부",
        description: "정책과 공지 확인",
        url: "https://www.moe.go.kr",
      },
      {
        label: "EBS",
        description: "학습 콘텐츠",
        url: "https://www.ebs.co.kr",
      },
      {
        label: "기상청",
        description: "날씨와 기상 특보",
        url: "https://www.weather.go.kr",
      },
    ],
  },
];

export function QuickLinksWidget() {
  return (
    <div className="quick-links-widget">
      <p className="quick-links-widget__intro">
        자주 쓰는 교육 사이트를 새 탭으로 엽니다.
      </p>

      <div className="quick-links-widget__groups">
        {linkSections.map((section) => (
          <section className="quick-links-widget__section" key={section.title}>
            <h3>{section.title}</h3>
            <div className="quick-links-widget__list">
              {section.links.map((link) => (
                <a
                  className="quick-link-card"
                  href={link.url}
                  key={link.url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span>
                    <strong>{link.label}</strong>
                    <small>{link.description}</small>
                  </span>
                  <ExternalLink size={15} strokeWidth={2.2} aria-hidden="true" />
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
