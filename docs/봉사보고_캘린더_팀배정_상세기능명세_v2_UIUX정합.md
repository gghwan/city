# 봉사보고 · 캘린더 · 팀배정 상세 기능명세 v2 (기존 UI/UX 정합)

- 작성일: 2026-05-08
- 기준 문서:
  - [봉사보고_캘린더_팀배정_기능명세_v1.md](/Users/gimgyeonghwan/Documents/New%20project/docs/봉사보고_캘린더_팀배정_기능명세_v1.md)
  - [schedule-2026-seed.json](/Users/gimgyeonghwan/Documents/New%20project/data/campaign/schedule-2026-seed.json)
- 목표: 현재 서비스 스타일/구조를 유지한 채, 일정·보고·배정 기능을 바로 구현 가능한 수준으로 구체화

---

## 1. 현재 UI/UX 기준 (반드시 유지)

1. 레이아웃
- `AppShell` 구조 유지: 상단 `Header` + 본문 + 하단 `BottomNav`
- 본문 폭 `max-w-3xl`, 카드형 섹션 중심 레이아웃

2. 디자인 토큰
- 색상/타이포/반경은 `app/globals.css` 변수 기반 사용
- 카드: `rounded-2xl border border-borderColor bg-white`
- 입력: `rounded-lg border border-borderColor ... focus:border-primary`
- 관리자 제어영역: `details` 기반 “관리 옵션 열기” 패턴 유지

3. 인터랙션
- 라우트 이동 시 `useNavigationStore` + `RouteLoadingOverlay` 유지
- 모바일 확대 방지(16px 입력 폰트) 규칙 유지
- destructive 액션은 항상 `confirm` 유지

4. 내비게이션 정책 (v2)
- 하단 탭 구조는 당분간 유지
- 신규 모듈은 우선 `더보기` 또는 대시보드 카드에서 진입
- 기존 메뉴명/흐름을 깨지 않는 방식으로 점진 확장

---

## 2. 정보구조(IA) 확정안

1. 신규 페이지
- `/schedule` : 월간 캘린더
- `/schedule/[date]` : 날짜 상세
- `/schedule/[date]/[eventId]` : 일정 상세 + 팀 상세
- `/report` : 보고 작성/내역
- `/admin/assignments` : 관리자 팀배정
- `/admin/reports` : 관리자 보고 관리
- `/guest/report/[token]` : 비회원 보고 제출

2. 진입 경로
- 대시보드 카드 1개 추가:
  - 제목: `봉사 보고`
  - 설명: `날짜별 보고 작성 및 내역 확인`
  - 링크: `/report`
- 대시보드 카드 1개 추가:
  - 제목: `일정 캘린더`
  - 설명: `날짜별 봉사 일정 및 팀 배정`
  - 링크: `/schedule`
- 관리자 전용 버튼은 각 페이지 상단 우측 작은 텍스트 버튼으로 제공

---

## 3. 데이터 구조 (프론트 Seed + 추후 DB 반영)

## 3.1 즉시 사용 Seed 파일
- 파일: `data/campaign/schedule-2026-seed.json`
- 구조 핵심:
  - `dates[].sessions[].slots[]`
  - 신청 가능한 슬롯: `status: "open"` + `applications: []`

## 3.2 Seed 구조 규칙
1. `status: "assigned"` 슬롯
- 이미 배정된 이름이 있으면 `memberName` 필수
- 운영 중 신청은 받지 않음 (기본 정책)

2. `status: "open"` 슬롯
- `label` 권장(`"8 (봉사신청가능)"` 형식)
- 반드시 `applications: []` 빈 배열 유지

3. 신청 데이터(런타임)
- 신청 발생 시 `applications`에 push:
```json
{
  "applicationId": "uuid",
  "applicantName": "홍길동",
  "congregation": "서울풍납",
  "role": "형제",
  "submittedAt": "2026-05-08T00:00:00.000Z",
  "note": ""
}
```

---

## 4. 기능 모듈 상세

## 4.1 캘린더 모듈 (`/schedule`)

1. 월간 뷰
- 상단: 캠페인 기간 라벨
- 본문: 월간 그리드(일~토)
- 날짜 셀 상태:
  - 기본
  - 일정 있음
  - 오늘
  - 선택됨

2. 날짜 셀 배지
- `AM` / `PM` 일정 수 표시
- 신청 가능한 슬롯이 1개 이상이면 `신청 가능` 배지 표시

3. 날짜 클릭 동작
- `/schedule/YYYY-MM-DD` 이동
- 이동 전 `startRouteLoading()` 호출

4. 실패/빈 상태
- 데이터 로드 실패: 에러 카드
- 해당 월 일정 없음: 빈 상태 카드

## 4.2 날짜 상세 (`/schedule/[date]`)

1. 상단 정보
- 날짜 제목 + 요약(총 일정 수/총 오픈 슬롯 수)

2. 일정 카드 반복
- 제목(예: `순회구봉사 한강공원`)
- 시간/장소/인도자
- 안내문(있으면)
- 팀 요약(배정 인원 수)
- `자세히 보기` 버튼

3. 관리자 버튼
- 카드 우측 상단 `팀 편집` 노출 (ADMIN/LEADER)

## 4.3 일정 상세 + 팀 명단 (`/schedule/[date]/[eventId]`)

1. 섹션 구성
- 일정 정보 카드
- 안내 카드
- 팀별 명단 카드 목록

2. 팀 카드 내용
- 팀명 (예: `올림픽 공원 3구역→5구역`)
- 인원 목록(이름/회중/형제자매)
- 상태 태그: `배정완료`, `신청대기`

3. 관리자/인도자 편집
- 슬롯별 신청자 리스트
- `신청 승인`, `배정 이동`, `신청 반려`
- 팀당 권장인원 2~3명 경고 표시

## 4.4 보고 작성 (`/report`)

1. 입력 섹션
- 봉사 참여일
- 회중봉사/순회구 봉사 수치 입력
- 지하철 전시대 입력(시간대/장소/수치/기타)
- 경험담(참여유형/경험유형/내용)

2. 입력 UI 규칙
- 수치형은 스텝퍼 버튼 `- / +`
- 기본값 `0`
- 텍스트 미입력 허용
- 제출 버튼 하단 안내:
  - `건수만 입력하거나 내용을 비워 두어도 제출할 수 있습니다.`

3. 저장/제출
- `임시저장` + `제출` 2버튼
- 제출 후 상태 `submitted`
- 사용자 본인 내역은 `/report` 하단 리스트로 노출

## 4.5 관리자 보고 관리 (`/admin/reports`)

1. 필터
- 날짜 범위
- 제출상태(draft/submitted)
- 보고자명
- 봉사유형

2. 목록
- 카드형 리스트 유지(기존 서비스/공지 패턴)
- 각 카드에서 상세 열람/수정/삭제 가능

3. 액션
- 상세 보기
- 상태 변경(제출 취소/재제출)
- CSV 내보내기(v2.1)

## 4.6 관리자 팀배정 (`/admin/assignments`)

1. 상단 필터
- 날짜
- 일정
- 상태(미배정/부분배정/완료)

2. 본문 2열
- 좌측: 신청자 대기 목록
- 우측: 팀/슬롯 목록

3. 배정 방식
- 버튼 방식 우선(`선택 후 배정`)
- 드래그앤드롭은 v2.1 옵션

4. 검증
- 동일 시간대 중복 배정 차단
- 팀당 2~3명 권장 경고
- 저장 시 유효성 실패 항목 안내

## 4.7 비회원 제출 (`/guest/report/[token]`)

1. 공개 입력 최소화
- 이름
- 보고일
- 보고 항목 동일

2. 제한
- 토큰 만료/횟수 초과 시 차단
- 성공 시 완료 메시지 및 재제출 제한

---

## 5. 역할/권한 상세

1. USER
- 본인 보고 CRUD
- 일정/팀 조회
- 오픈 슬롯 신청

2. LEADER
- 담당 일정 배정 편집
- 담당 일정 보고 조회

3. ADMIN
- 전체 읽기/쓰기/삭제

4. GUEST
- 토큰 기반 보고 제출만 가능

---

## 6. API/Action 초안 (기존 패턴 정합)

1. 조회
- `getScheduleMonth(month)`
- `getScheduleByDate(date)`
- `getEventDetail(eventId)`
- `getReports(filters)`

2. 변경
- `submitApplicationAction(formData)`
- `assignTeamAction(formData)`
- `createReportAction(formData)`
- `updateReportAction(formData)`
- `deleteReportAction(formData)` (ADMIN)

3. 일관성 원칙
- 입력 검증 실패: `E007`(422) 패턴 유지
- 권한 실패: `E001/E003` 계열 유지
- 변경 후 `revalidatePath()` 적용

---

## 7. Prisma 스키마 확장안 (v2)

1. 신규 모델
- `MemberProfile`
- `ScheduleEvent`
- `ScheduleTeam`
- `ScheduleSlot`
- `SlotApplication`
- `TeamAssignment`
- `ServiceReport`
- `GuestReportToken`

2. 핵심 인덱스/제약
- `ScheduleEvent(date)`
- `ScheduleSlot(eventId, slotNo, sessionKey)`
- `TeamAssignment(eventId, memberId)` unique (중복배정 방지)
- `ServiceReport(reportDate, reporterName)`

3. JSON 필드 사용
- 보고서 세부 수치/경험담은 JSON 컬럼으로 1차 구현 가능

---

## 8. UI 컴포넌트 명세 (재사용 우선)

1. 신규 컴포넌트
- `components/schedule/CalendarMonth.tsx`
- `components/schedule/DateEventList.tsx`
- `components/schedule/EventTeamBoard.tsx`
- `components/report/ReportForm.tsx`
- `components/report/CounterField.tsx`
- `components/admin/AssignmentPanel.tsx`

2. 기존 컴포넌트 재사용
- `LoadingSpinner`
- `EmptyState`
- `NavigationLink`
- `RouteLoadingOverlay`

3. 클래스 스타일 가이드
- 카드: `rounded-2xl border border-borderColor bg-white p-4`
- 작은 액션 버튼: `rounded-lg bg-surface px-2 py-1 text-xs font-semibold`
- 주요 CTA: `rounded-lg bg-primary ... text-white`

---

## 9. 상태/예외 UX

1. 로딩
- 페이지 전환: 전역 오버레이
- 섹션 로딩: 스켈레톤 카드 3개

2. 에러
- 상단 인라인 에러 카드 표시
- 재시도 버튼 제공

3. 성공
- 저장/제출 후 토스트(또는 인라인 성공 배너)

4. 충돌
- 중복 배정 시 어떤 사용자/시간에서 충돌인지 명시

---

## 10. 단계별 개발 범위 (실행 순서 고정)

1. Phase 1 (MVP)
- 캘린더 조회 + 날짜 상세 (Seed 기반)
- 보고 작성/조회(사용자 본인)
- 관리자 팀배정(버튼 방식)

2. Phase 2
- 비회원 토큰 제출
- 관리자 보고 필터/관리
- 신청자 대기열

3. Phase 3
- CSV export
- 드래그앤드롭 배정
- 통계 대시보드

---

## 11. QA 체크리스트

1. 모바일(iPhone Safari/Chrome)
- 입력 확대(줌) 발생 여부
- 날짜 탭 반응속도
- 하단 탭과 상세 스크롤 충돌

2. 권한
- USER가 관리자 액션 접근 차단
- 토큰 만료 처리

3. 데이터
- `applications: []` 초기값 유지
- 신청/배정 후 데이터 일관성

---

## 12. 즉시 확정 권장값 (v2 기준)

1. `LEADER` 롤 추가: `USER/LEADER/ADMIN`
2. 팀 인원 규칙: 2~3명 `경고 + 저장 허용` (운영상 유연성)
3. 보고 마감: 기본 마감 없음, 관리자 수동 마감
4. 비회원 제출: 이름 필수, 연락처 선택
5. 초도 데이터 주입: `schedule-2026-seed.json`을 기준으로 서버 시드

---

이 문서는 “현재 앱 UI/UX를 유지하면서 기능을 확장”하기 위한 구현 기준 문서다.  
다음 단계는 이 문서를 기준으로 Prisma 스키마와 Server Action 계약을 먼저 고정한 뒤, 캘린더/보고/배정 화면을 순차 구현한다.
