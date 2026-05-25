# GitHub Release Draft: v0.1.0-rc.1

## 1. Release 제목 초안

`v0.1.0-rc.1 - Teacher Dashboard Release Candidate 1`

## 2. Release 요약

`v0.1.0-rc.1`은 교사용 대시보드 위젯개발 프로젝트의 1차 릴리즈 후보입니다.

이 버전은 정식 릴리즈가 아니라 학교 현장 테스트와 Human Lead 검토를 위한 release candidate입니다. 실제 GitHub Release 생성은 이 문서 검토 후 별도 승인으로 진행합니다.

## 3. 기준 정보

- Tag: `v0.1.0-rc.1`
- Tagged commit: `9a551e8cd2c0574f7614c98bbb5ba57f9defc7b8`
- Release notes commit: `f857d6ee780afcf6c2817002668a7cb748dc6a95`
- Field test checklist commit: `4952dcd8dd34a1ac335150f89cbf0884e91ff42d`
- Repository: `https://github.com/surether/dash-board-teacher.git`

## 4. 주요 포함 기능

- 날짜/시간 위젯
- 커스텀 알림
- 포스트잇, 메모, task 계열 기능
- 학생명렬 CSV import
- 학생명렬 저장 및 새로고침 유지
- 학생명렬 기반 뽑기, 사다리, 룰렛 연결
- 타이머, 뽀모도로, QR코드
- 바로가기/중요사이트 정적 링크 위젯
- 정적 시간표 위젯
- 정적 학사일정 위젯
- 정적 날씨 · 등교 준비 위젯

## 5. 학생명렬 CSV import 기준

- 지원 파일: CSV
- 기준 헤더: `학년`, `반`, `번호`, `성명`, `비고`
- 정상 학생만 저장
- 오류 행 제외
- 저장 후 학생명렬 위젯과 수업도구 위젯에서 사용 가능
- 새로고침 후 저장 학생명렬 유지

## 6. 검증 완료 항목

실제 보고된 검증 항목만 기록합니다.

- `npm.cmd run build` 통과
- `git diff --check` 통과
- headless smoke 통과
- console/page error 없음 보고
- 원격 태그 `v0.1.0-rc.1` push 완료
- 원격 태그 peeled commit이 `9a551e8cd2c0574f7614c98bbb5ba57f9defc7b8`을 가리킴
- 최종 작업트리 clean 보고

## 7. 문서화 완료 항목

- `docs/RELEASE_CHECKLIST.md`
- `docs/RELEASE_NOTES_v0.1.0-rc.1.md`
- `docs/FIELD_TEST_CHECKLIST_v0.1.0-rc.1.md`

## 8. 미지원 및 후순위 기능

- `.xlsx` 직접 parsing 미지원
- 성적 import 미지원
- 상담 import 미지원
- mapping/alias 고도화 미지원
- 실제 날씨 API 미연동
- geolocation 미사용
- 로그인/인증 미구현
- 배포 자동화 미구현
- 학교별 링크 편집/저장 미구현
- 시간표/학사일정 편집·저장 미구현

## 9. 사용 전 주의사항

- 이 버전은 release candidate입니다.
- 실제 학교 현장 사용 전 `docs/FIELD_TEST_CHECKLIST_v0.1.0-rc.1.md` 기준으로 확인해야 합니다.
- 개인정보가 포함된 실제 학생 데이터 사용 전 저장소와 브라우저 저장 정책을 다시 확인해야 합니다.
- `.xlsx`, 성적, 상담 데이터는 아직 연결하지 말아야 합니다.
- 실시간 날씨나 외부 API가 필요한 기능은 후속 Phase에서 별도로 구현해야 합니다.

## 10. GitHub Release 본문 초안

아래 Markdown은 실제 GitHub Release 본문에 붙여넣기 위한 초안입니다. 이 문서 작성만으로 GitHub Release를 생성하지 않습니다.

````md
## v0.1.0-rc.1 - Teacher Dashboard Release Candidate 1

This is the first release candidate for the teacher dashboard widget project.

This version is intended for Human Lead review and field testing before a formal release.

### Included

- Date/time widget
- Custom alerts
- Sticky notes, memo, and task features
- Student roster CSV import
- Persistent student roster after refresh
- Student roster integration with picker, ladder, and roulette tools
- Timer, Pomodoro, and QR tools
- Static quick links and important sites widget
- Static timetable widget
- Static academic calendar widget
- Static weather readiness widget

### Student Roster CSV Import

Supported CSV header:

```csv
학년,반,번호,성명,비고
```

- Only valid student rows are saved.
- Error rows are excluded.
- Saved roster data is available in the student roster widget and lesson tools.
- Saved roster data remains after browser refresh.

### Verified

- `npm.cmd run build` passed.
- `git diff --check` passed.
- Headless smoke test passed.
- No console/page error was reported.
- Remote tag `v0.1.0-rc.1` was pushed.
- Remote tag peeled commit points to `9a551e8cd2c0574f7614c98bbb5ba57f9defc7b8`.

### Not Included

- Direct `.xlsx` parsing
- Grade import
- Counseling import
- Mapping/alias enhancement
- Realtime weather API
- Geolocation
- Login/authentication
- Deployment automation
- Link editing/saving
- Timetable or academic calendar editing/saving

### Before Field Use

Use `docs/FIELD_TEST_CHECKLIST_v0.1.0-rc.1.md` before any classroom or school field test.

This release candidate should not be treated as the final production release.
````

## 11. 다음 단계 후보

- Human Lead 검토 후 GitHub Release 실제 생성
- 현장 테스트 체크리스트 기반 테스트 수행
- 현장 테스트 결과 반영 버그 수정 Phase
- 사용자용 실행 안내 문서 작성
