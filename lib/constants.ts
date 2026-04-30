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

[답변 원칙]
- 한국어로만 답변하세요
- 모르는 내용은 "담당자에게 문의하세요"로 안내하세요
- 답변은 간결하게 3~5문장 이내로 유지하세요
- 친근하고 공손한 어조를 사용하세요`;

export const SUGGESTED_QUESTIONS = [
  '봉사 마련 PDF는 어디서 보나요?',
  '구역 지도는 어떻게 열어요?',
  '담당자 연락처를 알려주세요.',
] as const;

export const MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024;
