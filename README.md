# 2026 대도시 캠페인ㅡ서울풍납 회중

Next.js 14 기반 캠페인 운영 웹앱입니다.

## 기능
- ID/PW 로그인 (일반/관리자)
- 대시보드 4개 메뉴 + 챗봇
- 봉사 마련 PDF 조회/업로드/수정/삭제
- 구역 지도/호별 카드 링크 조회 및 관리자 URL 수정
- 비상 연락처 CRUD + 비상 PDF 관리
- Gemini 3 Flash 챗봇 스트리밍 응답

## 로컬 실행
1. `cp .env.example .env.local`
2. `npm install`
3. `npx prisma generate`
4. `npm run dev`

## 배포
- GitHub `main` 푸시 시 CI 실행
- Vercel 프로젝트 연결 및 Secrets 설정 필요:
  - `VERCEL_TOKEN`
  - `ORG_ID`
  - `PROJECT_ID`
