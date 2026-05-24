# 1차 릴리즈 후보 최종 체크리스트

이 문서는 교사용 대시보드 위젯개발 1차 릴리즈 후보를 태그로 고정하기 전에 확인해야 할 최종 체크리스트이다.

## 1. 릴리즈 후보 개요

- 현재 문서는 1차 릴리즈 후보 최종 체크리스트이다.
- 기준 커밋: `99b54dc0d975fbecd9a75816b223e3d22ccdf919` 이후 Phase 3-S 문서 커밋
- 목표: 기본 대시보드 1차 릴리즈 후보 상태 고정
- 실제 Git tag 생성은 Human Lead 승인 후 별도 Phase에서 진행한다.
- 사용 안내 문서: `docs/RELEASE_CANDIDATE_GUIDE.md`

## 2. 현재 사용 가능한 기능

- 날짜/시간
- 커스텀 알림
- 포스트잇
- 메모
- task
- 학생명렬 위젯
- 학생명렬 CSV import
- 뽑기
- 사다리
- 룰렛
- 타이머
- 뽀모도로
- QR코드
- 바로가기/중요사이트 링크 위젯
- 시간표 위젯
- 학사일정 위젯
- 날씨 · 등교 준비 위젯

## 3. 학생명렬 CSV 기준

학생명렬 CSV는 다음 헤더와 구조를 기준으로 검증한다.

```csv
학년,반,번호,성명,비고
1,1,1,김가온,
1,1,2,이나래,
1,1,3,박도윤,
```

규칙:

- 필수 헤더: `학년`, `반`, `번호`, `성명`, `비고`
- 정상 학생만 저장
- 오류 행 제외
- 적용 시 기존 학생명렬 교체
- 새로고침 후 유지
- 뽑기/사다리/룰렛에서 사용 가능

## 4. 최종 검증 명령

릴리즈 후보 태그 생성 전 최소 검증 명령:

```bash
git status --short
npm.cmd run build
git diff --check
```

필요 시 다음 금지 구현 검색도 확인한다.

```bash
rg "fetch\(|axios|geolocation|getCurrentPosition|xlsx|XLSX|readAsArrayBuffer|readAsText|FileReader|Papa|papaparse|openweather|기상청" src
rg "score|grade|counsel|상담|성적|평가|mapping|alias" src
```

검색 결과는 기존 구현인지, 이번 릴리즈 후보 고정 과정에서 새로 추가된 것인지 구분해서 판단한다.

## 5. 최종 화면 확인 체크리스트

- [ ] 대시보드 진입 가능
- [ ] 날짜/시간 표시 정상
- [ ] 알림 위젯 렌더링 정상
- [ ] 포스트잇/메모/task 렌더링 정상
- [ ] 학생명렬 위젯 렌더링 정상
- [ ] 학생명렬 CSV import 정상
- [ ] 새로고침 후 학생명렬 유지
- [ ] 뽑기/사다리/룰렛 학생명렬 연결 정상
- [ ] 타이머/뽀모도로/QR코드 탭 정상
- [ ] 바로가기/중요사이트 링크 6개 표시
- [ ] 바로가기 링크 새 탭 속성 정상
- [ ] 시간표 월~금, 1~7교시 표시
- [ ] 학사일정 정적 일정 4개 표시
- [ ] 날씨 · 등교 준비 위젯 안내 카드/준비 항목 표시
- [ ] console/page error 없음
- [ ] `.xlsx` unsupported 흐름 유지

## 6. 미지원/후순위 기능

- 바로가기 링크 편집/저장
- 시간표 편집/저장
- 학사일정 편집/저장
- 실제 날씨 API 연동
- 위치 권한/geolocation
- `.xlsx` 직접 import
- 성적 파일 import
- 상담 파일 import
- mapping/alias 고도화
- NEIS/나이스 연동
- Google Calendar 연동
- 로그인/인증
- 배포 자동화

## 7. 알려진 제한 사항

- 현재 시간표/학사일정/날씨는 정적 예시 위젯이다.
- 학생명렬 import는 CSV 기준으로 검증되었다.
- `.xlsx` 직접 파싱은 아직 지원하지 않는다.
- 성적/상담 파일은 아직 대시보드 데이터로 반영하지 않는다.
- 일부 위젯은 편집/저장 기능이 없다.
- Git 작업 시 `.git/index.lock` 생성 권한 문제가 재발할 수 있다.

## 8. 태그 후보

실제 태그는 이번 Phase에서 생성하지 않는다.

- 권장 태그 후보: `v0.1.0-rc.1`
- 내부 Phase 추적용 후보: `phase-3-rc1`

판단 기준:

- 일반적인 릴리즈 후보 표기는 `v0.1.0-rc.1`이 더 적절하다.
- 내부 Phase 추적용이면 `phase-3-rc1`도 가능하다.
- 실제 tag 생성은 Human Lead 승인 후 별도 Phase에서 진행한다.

## 9. 태그 생성 전 조건

- `git status --short` clean
- `npm.cmd run build` 통과
- `git diff --check` 통과
- 최종 headless 또는 브라우저 렌더링 검증 통과
- `docs/RELEASE_CHECKLIST.md` 최신 상태
- `docs/RELEASE_CANDIDATE_GUIDE.md` 최신 상태
- Human Lead 승인 완료
