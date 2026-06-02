import { Plugin } from 'voc-server/plugin'
import type { VocArticle, VocListResult } from 'voc-server/types'

const SAMPLE: VocArticle[] = [
  {
    id: 'VOC-2026-04812',
    title: '결제 완료 후 주문 내역이 보이지 않습니다',
    customer: '김민수',
    category: '결제/주문',
    priority: '높음',
    status: '처리중',
    channel: '앱',
    assignee: '이지현',
    createdAt: '2026-05-12T05:32:00Z',
    updatedAt: '2026-05-12T05:32:00Z',
    content: [
      { type: 'inquiry', text: '결제는 정상적으로 됐는데 마이페이지에 주문이 안 뜹니다. 카드 명세서에는 출금되어 있어요.' },
      { type: 'reply', text: '확인 후 결제 시스템 점검 결과 24시간 내 정상 표시될 예정이라고 안내드렸습니다.' },
    ],
  },
  {
    id: 'VOC-2026-04811',
    title: '배송 조회 화면이 로딩만 계속됩니다',
    customer: '박서연',
    category: '배송',
    priority: '보통',
    status: '처리중',
    channel: '웹',
    assignee: '이지현',
    createdAt: '2026-05-12T04:11:00Z',
    updatedAt: '2026-05-12T04:11:00Z',
    content: [
      { type: 'inquiry', text: '운송장 번호 클릭하면 빈 화면만 나오고 한참 기다려도 응답이 없습니다.' },
    ],
  },
  {
    id: 'VOC-2026-04810',
    title: '쿠폰 중복 적용 안 되는 이유 문의',
    customer: '최유진',
    category: '프로모션',
    priority: '낮음',
    status: '완료',
    channel: '이메일',
    assignee: '정태호',
    createdAt: '2026-05-12T02:48:00Z',
    updatedAt: '2026-05-12T02:48:00Z',
    content: [
      { type: 'inquiry', text: '생일 쿠폰이랑 회원 쿠폰이 동시에 적용되지 않습니다. 정책 안내 부탁드립니다.' },
      { type: 'reply', text: '쿠폰은 정책상 최대 1장만 적용 가능합니다. 안내 후 종결되었습니다.' },
    ],
  },
  {
    id: 'VOC-2026-04809',
    title: '회원 탈퇴 후 재가입 시 등급 복원 가능?',
    customer: '정하늘',
    category: '계정',
    priority: '보통',
    status: '신규',
    channel: '챗봇',
    createdAt: '2026-05-12T01:25:00Z',
    updatedAt: '2026-05-12T01:25:00Z',
    content: [
      { type: 'inquiry', text: '작년에 VIP였는데 탈퇴했다가 다시 가입하면 등급이 초기화되나요?' },
    ],
  },
  {
    id: 'VOC-2026-04808',
    title: '교환 신청 후 일주일째 연락이 없습니다',
    customer: '한도윤',
    category: '교환/환불',
    priority: '긴급',
    status: '처리중',
    channel: '전화',
    assignee: '윤서아',
    createdAt: '2026-05-12T00:50:00Z',
    updatedAt: '2026-05-12T00:50:00Z',
    content: [
      { type: 'inquiry', text: '5월 5일에 신청한 교환 건이 아직도 진행 상황이 업데이트 안 됩니다. 빠른 처리 부탁드립니다.' },
    ],
  },
  {
    id: 'VOC-2026-04807',
    title: '앱 푸시 알림이 두 번씩 옵니다',
    customer: '오재현',
    category: '기술',
    priority: '낮음',
    status: '보류',
    channel: '앱',
    assignee: '박준영',
    createdAt: '2026-05-11T13:14:00Z',
    updatedAt: '2026-05-11T13:14:00Z',
    content: [
      { type: 'inquiry', text: '안드로이드 14 기기에서만 같은 알림이 2회씩 옵니다.' },
    ],
  },
  {
    id: 'VOC-2026-04806',
    title: '기프트카드 잔액 조회 메뉴 위치 안내',
    customer: '신예린',
    category: '결제/주문',
    priority: '낮음',
    status: '완료',
    channel: '챗봇',
    assignee: '정태호',
    createdAt: '2026-05-11T11:02:00Z',
    updatedAt: '2026-05-11T11:02:00Z',
    content: [
      { type: 'inquiry', text: '기프트카드 잔액 어디서 보는지 모르겠어요.' },
      { type: 'reply', text: '마이페이지 > 결제수단 > 기프트카드 탭에서 확인 가능합니다.' },
    ],
  },
  {
    id: 'VOC-2026-04805',
    title: '장바구니 담은 상품이 자동으로 사라집니다',
    customer: '임수아',
    category: '기술',
    priority: '보통',
    status: '처리중',
    channel: '웹',
    assignee: '박준영',
    createdAt: '2026-05-11T09:39:00Z',
    updatedAt: '2026-05-11T09:39:00Z',
    content: [
      { type: 'inquiry', text: '장바구니에 담아두고 다음 날 들어오면 비어 있습니다. 보관 기간 정책이 있나요?' },
    ],
  },
  {
    id: 'VOC-2026-04804',
    title: '해외 배송 가능 여부 문의 (싱가포르)',
    customer: '강민호',
    category: '배송',
    priority: '보통',
    status: '신규',
    channel: '이메일',
    createdAt: '2026-05-11T08:01:00Z',
    updatedAt: '2026-05-11T08:01:00Z',
    content: [
      { type: 'inquiry', text: '싱가포르로 배송 가능한지, 배송비는 얼마인지 알고 싶습니다.' },
    ],
  },
  {
    id: 'VOC-2026-04803',
    title: '포인트로 결제 시 영수증 발급 가능한가요?',
    customer: '조서윤',
    category: '결제/주문',
    priority: '낮음',
    status: '완료',
    channel: '전화',
    assignee: '이지현',
    createdAt: '2026-05-11T06:22:00Z',
    updatedAt: '2026-05-11T06:22:00Z',
    content: [
      { type: 'inquiry', text: '현금영수증 처리되는지 궁금합니다.' },
      { type: 'reply', text: '포인트 결제분은 부가세법상 현금영수증 발급 대상이 아닙니다.' },
    ],
  },
]

export default class MockupPlugin extends Plugin {
  override async onLoad(): Promise<void> {
    this.register('fetchList', (since?: string) => this.fetchList(since))
    this.register('fetchItem', (id: string) => this.fetchItem(id))
  }

  override async onUnload(): Promise<void> {}

  private async fetchList(since?: string): Promise<VocListResult> {
    const cutoff = since ? new Date(since).getTime() : 0
    const items = SAMPLE
      .filter((v) => new Date(v.updatedAt).getTime() > cutoff)
      .map((v) => ({ id: v.id, updatedAt: v.updatedAt }))
    return { items }
  }

  private async fetchItem(id: string): Promise<VocArticle | null> {
    return SAMPLE.find((v) => v.id === id) ?? null
  }
}
