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

## Supabase 설정 가이드
1. Supabase 프로젝트의 `Connect`에서 DB 비밀번호를 확인합니다.
2. Storage에서 버킷 `campaign-files`를 생성합니다.
3. Supabase `Settings > API Keys`에서 아래 값을 복사합니다.
   - `Project URL` (`https://<project-ref>.supabase.co`)
   - `Publishable key` (`sb_publishable_...`)
   - `Secret key` (`sb_secret_...`) 또는 legacy `service_role`
4. Vercel 환경변수(Production/Preview/Development 모두)에 아래를 등록합니다.
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (호환용, publishable 값과 동일하게 설정 가능)
   - `SUPABASE_SECRET_KEY` (권장) 또는 `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_STORAGE_BUCKET=campaign-files`
   - `DATABASE_URL=<Supabase Connect의 Transaction pooler 연결 문자열>`
   - `DIRECT_URL=<Supabase Connect의 Session pooler 또는 Direct 연결 문자열>`
5. 스키마 적용이 필요하면 로컬에서 다음을 실행합니다.
   - `npx prisma db push`
   - `npm run prisma:seed`
