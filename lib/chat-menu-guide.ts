const MENU_RESPONSES = {
  service:
    '일반 사용자 기준으로 봉사 안내 메뉴에서 비상 연락, 대화 방법, 봉사 마련 자료를 한 화면에서 섹션별로 확인할 수 있습니다. 하단 탭의 봉사안내 또는 대시보드의 봉사 안내 카드를 누르시면 됩니다. 관리자는 기존처럼 봉사 마련/비상 연락/대화 방법을 각각 관리할 수 있습니다.',
  map:
    '구역 지도 메뉴에서는 한강공원, 올림픽공원, 아산병원 관련 구역 지도를 확인할 수 있습니다. 지도 열기 버튼을 누르면 새 탭으로 Google 지도가 열립니다. 관리자는 지도 URL을 직접 수정해 최신 링크로 관리할 수 있습니다.',
  card:
    '호별 카드 메뉴에서는 서울풍납 회중 전자 구역 카드 시스템으로 이동할 수 있습니다. 카드 시스템 열기 버튼을 누르면 spn.jwcard.co.kr로 연결됩니다. 관리자는 링크를 최신 주소로 변경할 수 있습니다.',
  emergency:
    '일반 사용자는 봉사 안내 메뉴 안의 비상 연락 섹션에서 담당자 연락처 확인과 전화 연결, 관련 파일 조회를 할 수 있습니다. 관리자는 비상 연락 메뉴에서 연락처 추가/수정/삭제와 파일 관리를 할 수 있습니다.',
  talk:
    '일반 사용자는 봉사 안내 메뉴 안의 대화 방법 섹션에서 제안 자료 링크와 파일을 확인할 수 있습니다. 관리자는 대화 방법 메뉴에서 파일 업로드/수정/삭제와 링크 수정을 할 수 있습니다.',
  notice:
    '공지사항 메뉴에서는 캠페인 운영 공지를 확인할 수 있습니다. 일반 공지는 상단 고정 배너로 안내되고, 팝업 공지는 일반 사용자에게 팝업으로 표시됩니다(오늘 하루 보지 않기 가능). 관리자는 공지 등록/수정/삭제와 일반/팝업 유형을 설정할 수 있습니다.',
  dashboard:
    '대시보드는 캠페인 핵심 메뉴의 시작 화면입니다. 일반 사용자에게는 봉사 안내(비상 연락/대화 방법/봉사 마련 통합), 구역 지도, 호별 카드가 카드 형태로 보입니다. 관리자는 봉사 마련/비상 연락/대화 방법이 분리된 기존 카드와 최근 공지 관리 블록이 표시됩니다.',
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

  if (includesAny(text, ['대화 방법', '대화방법', '대화', 'talk', 'conversation'])) {
    return MENU_RESPONSES.talk;
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
      `1) 봉사 안내: 비상 연락/대화 방법/봉사 마련 통합 확인`,
      `2) 구역 지도: Google 지도 열기`,
      `3) 호별 카드: 전자 구역 카드 시스템 접속`,
      `4) 비상 연락: 연락처 확인 및 즉시 전화(봉사 안내 내 섹션)`,
      `5) 대화 방법: 제안 자료 PDF/링크 확인(봉사 안내 내 섹션)`,
      `6) 공지사항: 운영 공지 확인`,
    ].join('\n');
  }

  return null;
}
