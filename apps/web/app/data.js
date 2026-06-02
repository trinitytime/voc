// Shared data and constants for the Vue 3 VOC Console
// (mirrors what was in the React app.jsx)

export const ACCENTS = {
  indigo:  { name: "Indigo",  base: "#4F46E5", soft: "#EEF2FF", ring: "#C7D2FE", deep: "#3730A3" },
  blue:    { name: "Blue",    base: "#2563EB", soft: "#EFF6FF", ring: "#BFDBFE", deep: "#1D4ED8" },
  emerald: { name: "Emerald", base: "#059669", soft: "#ECFDF5", ring: "#A7F3D0", deep: "#047857" },
  violet:  { name: "Violet",  base: "#7C3AED", soft: "#F5F3FF", ring: "#DDD6FE", deep: "#5B21B6" },
  slate:   { name: "Slate",   base: "#0F172A", soft: "#F1F5F9", ring: "#CBD5E1", deep: "#020617" },
};

export const STATUS_STYLES = {
  "신규":   { bg: "#EFF6FF", fg: "#1D4ED8", dot: "#3B82F6" },
  "처리중": { bg: "#FEF3C7", fg: "#92400E", dot: "#F59E0B" },
  "보류":   { bg: "#F1F5F9", fg: "#475569", dot: "#94A3B8" },
  "완료":   { bg: "#ECFDF5", fg: "#047857", dot: "#10B981" },
};

export const PRIORITY_STYLES = {
  "긴급": { fg: "#B91C1C", bg: "#FEE2E2" },
  "높음": { fg: "#C2410C", bg: "#FFEDD5" },
  "보통": { fg: "#1E40AF", bg: "#DBEAFE" },
  "낮음": { fg: "#475569", bg: "#F1F5F9" },
};

export const SAMPLE_VOC = [
  { id: "VOC-2026-04812", title: "결제 완료 후 주문 내역이 보이지 않습니다",   customer: "김민수", category: "결제/주문", priority: "높음", status: "처리중", channel: "앱",     date: "2026-05-12 14:32", assignee: "이지현", excerpt: "결제는 정상적으로 됐는데 마이페이지에 주문이 안 뜹니다. 카드 명세서에는 출금되어 있어요." },
  { id: "VOC-2026-04811", title: "배송 조회 화면이 로딩만 계속됩니다",          customer: "박서연", category: "배송",      priority: "보통", status: "처리중", channel: "웹",     date: "2026-05-12 13:11", assignee: "이지현", excerpt: "운송장 번호 클릭하면 빈 화면만 나오고 한참 기다려도 응답이 없습니다." },
  { id: "VOC-2026-04810", title: "쿠폰 중복 적용 안 되는 이유 문의",            customer: "최유진", category: "프로모션",  priority: "낮음", status: "완료",   channel: "이메일", date: "2026-05-12 11:48", assignee: "정태호", excerpt: "생일 쿠폰이랑 회원 쿠폰이 동시에 적용되지 않습니다. 정책 안내 부탁드립니다." },
  { id: "VOC-2026-04809", title: "회원 탈퇴 후 재가입 시 등급 복원 가능?",       customer: "정하늘", category: "계정",      priority: "보통", status: "신규",   channel: "챗봇",   date: "2026-05-12 10:25", assignee: "—",       excerpt: "작년에 VIP였는데 탈퇴했다가 다시 가입하면 등급이 초기화되나요?" },
  { id: "VOC-2026-04808", title: "교환 신청 후 일주일째 연락이 없습니다",        customer: "한도윤", category: "교환/환불",  priority: "긴급", status: "처리중", channel: "전화",   date: "2026-05-12 09:50", assignee: "윤서아", excerpt: "5월 5일에 신청한 교환 건이 아직도 진행 상황이 업데이트 안 됩니다. 빠른 처리 부탁드립니다." },
  { id: "VOC-2026-04807", title: "앱 푸시 알림이 두 번씩 옵니다",                customer: "오재현", category: "기술",      priority: "낮음", status: "보류",   channel: "앱",     date: "2026-05-11 22:14", assignee: "박준영", excerpt: "안드로이드 14 기기에서만 같은 알림이 2회씩 옵니다." },
  { id: "VOC-2026-04806", title: "기프트카드 잔액 조회 메뉴 위치 안내",          customer: "신예린", category: "결제/주문",  priority: "낮음", status: "완료",   channel: "챗봇",   date: "2026-05-11 20:02", assignee: "정태호", excerpt: "기프트카드 잔액 어디서 보는지 모르겠어요." },
  { id: "VOC-2026-04805", title: "장바구니 담은 상품이 자동으로 사라집니다",     customer: "임수아", category: "기술",      priority: "보통", status: "처리중", channel: "웹",     date: "2026-05-11 18:39", assignee: "박준영", excerpt: "장바구니에 담아두고 다음 날 들어오면 비어 있습니다. 보관 기간 정책이 있나요?" },
  { id: "VOC-2026-04804", title: "해외 배송 가능 여부 문의 (싱가포르)",          customer: "강민호", category: "배송",      priority: "보통", status: "신규",   channel: "이메일", date: "2026-05-11 17:01", assignee: "—",       excerpt: "싱가포르로 배송 가능한지, 배송비는 얼마인지 알고 싶습니다." },
  { id: "VOC-2026-04803", title: "포인트로 결제 시 영수증 발급 가능한가요?",     customer: "조서윤", category: "결제/주문",  priority: "낮음", status: "완료",   channel: "전화",   date: "2026-05-11 15:22", assignee: "이지현", excerpt: "현금영수증 처리되는지 궁금합니다." },
];
