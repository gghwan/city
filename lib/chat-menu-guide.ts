const MENU_RESPONSES = {
  service:
    '봉사 마련 메뉴에서는 게스트 봉사 배정표와 회중 봉사 PDF를 확인할 수 있습니다. 하단 탭의 봉사마련 또는 대시보드의 봉사 마련 카드를 누르시면 됩니다. 관리자는 PDF 업로드, 파일명/설명 수정, 삭제까지 할 수 있습니다.',
  map:
    '구역 지도 메뉴에서는 한강공원, 올림픽공원, 아산병원 관련 구역 지도를 확인할 수 있습니다. 지도 열기 버튼을 누르면 새 탭으로 Google 지도가 열립니다. 관리자는 지도 URL을 직접 수정해 최신 링크로 관리할 수 있습니다.',
  card:
    '호별 카드 메뉴에서는 서울풍납 회중 전자 구역 카드 시스템으로 이동할 수 있습니다. 카드 시스템 열기 버튼을 누르면 spn.jwcard.co.kr로 연결됩니다. 관리자는 링크를 최신 주소로 변경할 수 있습니다.',
  emergency:
    '비상 연락 메뉴에서는 캠페인 담당자와 봉사 인도자 연락처를 확인하고 바로 전화 연결할 수 있습니다. 관련 비상 PDF도 함께 조회할 수 있습니다. 관리자는 연락처 추가/수정/삭제와 비상 PDF 업로드/삭제를 할 수 있습니다.',
  notice:
    '공지사항 메뉴에서는 캠페인 운영 공지를 최신순으로 확인할 수 있습니다. 대시보드의 공지사항 카드 또는 하단 탭 공지에서 열 수 있습니다. 관리자는 공지 등록/수정/삭제와 상단 고정 설정을 할 수 있습니다.',
  dashboard:
    '대시보드는 캠페인 핵심 메뉴의 시작 화면입니다. 봉사 마련, 구역 지도, 호별 카드, 비상 연락, 공지사항 메뉴를 카드 형태로 바로 이동할 수 있습니다. 최근 공지사항 미리보기와 우측 하단 챗봇 버튼도 함께 제공합니다.',
} as const;

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

export function getMenuGuideResponse(rawText: string): string | null {
  const text = rawText.toLowerCase();

  if (includesAny(text, ['봉사 마련', '봉사마련', 'service', 'pdf', '자료'])) {
    return MENU_RESPONSES.service;
  }

  if (includesAny(text, ['구역 지도', '구역지도', '지도', 'map', '한강공원', '올림픽공원', '아산병원'])) {
    return MENU_RESPONSES.map;
  }

  if (includesAny(text, ['호별 카드', '호별카드', '카드 시스템', 'jwcard', 'spn'])) {
    return MENU_RESPONSES.card;
  }

  if (includesAny(text, ['비상 연락', '비상연락', '연락처', '전화', 'emergency'])) {
    return MENU_RESPONSES.emergency;
  }

  if (includesAny(text, ['공지', '공지사항', 'notice', 'announcement'])) {
    return MENU_RESPONSES.notice;
  }

  if (includesAny(text, ['대시보드', '홈', '메뉴', 'dashboard'])) {
    return MENU_RESPONSES.dashboard;
  }

  if (includesAny(text, ['메뉴 설명', '메뉴 알려', '어떤 기능', '사용법', '어디서'])) {
    return [
      '메뉴별 기능을 간단히 안내드릴게요.',
      `1) 봉사 마련: PDF 자료 확인`,
      `2) 구역 지도: Google 지도 열기`,
      `3) 호별 카드: 전자 구역 카드 시스템 접속`,
      `4) 비상 연락: 연락처 확인 및 즉시 전화`,
      `5) 공지사항: 운영 공지 확인`,
    ].join('\n');
  }

  return null;
}
