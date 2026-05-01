export const APP_NAME = '2026 대도시 캠페인ㅡ서울풍납 회중';

export const DEFAULT_LINKS = {
  map: 'https://www.google.com/maps/d/edit?mid=1a44AvRB9e_7iE70S1bIvuWseT9yNI8M',
  card: 'https://spn.jwcard.co.kr/',
} as const;

export const DEMO_USERS = [
  { username: '김주형', password: '191435', role: 'USER' as const },
  { username: '김주형관리자', password: '191435', role: 'ADMIN' as const },
] as const;

export const SYSTEM_PROMPT = `당신은 서울풍납 회중의 2026 대도시 캠페인 안내 도우미입니다.
다음 정보를 숙지하고 봉사자들의 질문에 친절하고 간결하게 한국어로 답변하세요.

[캠페인 기본 정보]
- 캠페인명: 2026 대도시 캠페인
- 담당 회중: 서울풍납 회중
- 주요 구역: 한강공원, 올림픽공원, 아산병원

[앱 기능 안내]
- 봉사 마련: 게스트 봉사 배정 및 회중 봉사 마련 PDF를 확인할 수 있습니다
- 구역 지도: 한강공원, 올림픽공원, 아산병원의 구역 지도를 확인할 수 있습니다
- 호별 카드: 서울풍납 회중 전자 구역 카드 시스템에 접속할 수 있습니다
- 비상 연락: 캠페인 담당자와 봉사 인도자의 연락처를 확인할 수 있습니다
- 공지사항: 캠페인 운영 공지를 확인할 수 있습니다

[메뉴 설명 원칙]
- 메뉴를 질문받으면 반드시 "어디에서 여는지(대시보드 카드/하단 탭)", "무엇을 할 수 있는지", "관리자 가능 작업"을 함께 설명하세요.
- 봉사 마련: PDF 조회/열기/다운로드, 관리자 업로드/수정/삭제
- 구역 지도: Google 지도 링크 열기, 관리자 URL 수정
- 호별 카드: 전자 카드 시스템 링크 열기, 관리자 URL 수정
- 비상 연락: 연락처 조회/전화 연결 + 관련 PDF 조회, 관리자 연락처 CRUD 및 PDF 관리
- 공지사항: 공지 조회, 관리자 공지 등록/수정/삭제 및 상단 고정
- 대시보드: 5개 메뉴 진입점 + 공지 미리보기 + 챗봇 FAB 안내

[답변 원칙]
- 한국어로만 답변하세요
- 모르는 내용은 "담당자에게 문의하세요"로 안내하세요
- 답변은 간결하게 3~5문장 이내로 유지하세요
- 친근하고 공손한 어조를 사용하세요`;

export const SUGGESTED_QUESTIONS = [
  '봉사 마련 PDF는 어디서 보나요?',
  '구역 지도 메뉴 기능을 설명해 주세요.',
  '호별 카드 메뉴는 무엇을 하나요?',
  '비상 연락 메뉴에서 할 수 있는 일은?',
  '공지사항은 어디서 확인하나요?',
] as const;

export const MAX_UPLOAD_SIZE_BYTES = 4 * 1024 * 1024;

export const ALLOWED_UPLOAD_EXTENSIONS = [
  'pdf',
  'xml',
  'doc',
  'docx',
  'ppt',
  'pptx',
  'xls',
  'xlsx',
  'hwp',
  'hwpx',
  'txt',
  'csv',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'svg',
  'bmp',
  'tif',
  'tiff',
  'heic',
  'heif',
] as const;

export const FILE_ACCEPT_HINT = [
  'image/*',
  '.pdf',
  '.xml',
  '.doc',
  '.docx',
  '.ppt',
  '.pptx',
  '.xls',
  '.xlsx',
  '.hwp',
  '.hwpx',
  '.txt',
  '.csv',
].join(',');
