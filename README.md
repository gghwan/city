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
1. `npm install`
2. `npm run env:local`
3. `npm run dev`

## 전체 기능 로컬 테스트(업로드/DB/챗봇 포함)
1. `.env.local`에서 Supabase/DB/API 키 값을 실제 값으로 입력
2. `npm run local:setup`
3. `npm run dev`

## 로컬 테스트 체크리스트
1. 로그인: 아이디 아무 값 + 비밀번호 `191435`
2. 관리자 로그인: 아이디 끝에 `관리자`를 붙이고 비밀번호 `191435`
3. 파일 업로드 테스트: `SUPABASE_SECRET_KEY` 또는 `SUPABASE_SERVICE_ROLE_KEY` 필요
4. 챗봇 테스트: `GOOGLE_AI_API_KEY` 설정 필요

## 로컬 명령어
- `npm run env:local`: `.env.local` 생성/보정 + `.env` 동기화(Prisma CLI용)
- `npm run prisma:push`: 로컬 DB 스키마 반영
- `npm run prisma:seed`: 기본 데이터(링크/계정) 시드
- `npm run local:setup`: 로컬 테스트 준비 일괄 실행

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
