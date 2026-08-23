/**
 * 장보기·요리·완성 세 화면에 나오는 글과 값.
 *
 * `site-content.ts` 와 나누어 둔 까닭 — 그 파일은 이미 650줄이 넘었고,
 * 여기 담기는 것은 소개 페이지가 아니라 실제로 요리하는 동안 쓰이는 값이다.
 * 성격이 다른 것을 한 파일에 계속 쌓으면 고칠 때 엉뚱한 곳을 건드리게 된다.
 */

import type { IconName } from "@/components/icons";
import type { ShoppingMall } from "@/lib/domain/shopping";
import type { VoiceTone } from "@/lib/domain/voice-tone";

/* ---------- 장보기 (/shop) ---------- */

/** 쇼핑몰을 부르는 말. 속이름은 도메인이 정하고 여기서는 이름만 붙인다 */
export const mallLabels = {
  coupang: "쿠팡",
  kurly: "마켓컬리",
  naver: "네이버쇼핑",
  ssg: "SSG",
} as const satisfies Record<ShoppingMall, string>;

/** 장보기 화면에 적히는 말 */
export const shopCopy = {
  // 재료 묶음의 제목
  title: "재료와 장보기",
  // 쇼핑몰 고르는 자리의 이름
  mallLabel: "쇼핑몰",
  // 왜 어떤 것은 체크가 빠져 있는지 알려 주는 줄
  pantryNote:
    "소금·간장·식용유처럼 집에 늘 있는 양념은 체크가 빠진 채로 시작합니다. 필요하면 다시 체크하세요.",
  // 장바구니 줄의 이름
  cartLabel: "장바구니에 담은 재료",
  // 목록을 글자로 복사하는 접이칸
  copyLabel: "장보기 목록 복사",
  // 다음 화면으로 넘어가는 단추
  start: "요리 시작하기",
  // 앞 화면으로 돌아가는 단추
  back: "← 다른 요리 고르기",
  // 오른쪽 기둥의 두 제목
  sourceLabel: "출처",
  stepsLabel: "전체 순서",
  // 쿡파일럿이 만든 레시피일 때 출처 자리에 적히는 말
  sourceAi: "쿡파일럿이 만든 기본 레시피입니다",
  // 서재에서 꺼낸 레시피일 때
  sourceShelf: "서재에서 꺼낸 레시피입니다",
  // 커뮤니티 글에서 가져온 레시피일 때. 뒤에 적은 사람 이름이 붙는다
  sourceCommunity: "커뮤니티 글에서 가져왔습니다",
} as const;

/**
 * 광고 자리에 놓이는 상품.
 *
 * **이 값은 자리표시자다.** 브랜드 이름은 실제로 있는 것이지만 용량과 값은
 * 우리가 채워 넣은 예시이고, 어느 쇼핑몰의 지금 값도 아니다.
 * 진짜 광고를 붙일 때는 제휴사에서 받아 온 값으로 이 배열을 갈아 끼운다.
 * 그때까지는 화면에도 "예시" 라고 밝혀 둔다.
 */
export type SponsoredItem = {
  /** 어떤 재료 밑에 붙을지. 재료 이름에 이 낱말이 들어가면 걸린다 */
  match: string;
  /** 상품 이름 */
  name: string;
  /** 용량 */
  size: string;
  /** 값. 숫자로 두어야 화면에서 자릿수를 찍을 수 있다 */
  price: number;
};

/** 지금 붙어 있는 광고 자리들 */
export const sponsoredItems: readonly SponsoredItem[] = [
  { match: "고추장", name: "해찬들 태양초 골드 고추장", size: "1kg", price: 12900 },
  { match: "고춧가루", name: "청정원 고운 고춧가루", size: "500g", price: 16900 },
  { match: "간장", name: "샘표 진간장 501", size: "1.8L", price: 8900 },
  { match: "설탕", name: "백설 하얀설탕", size: "1kg", price: 3200 },
  { match: "마늘", name: "청정원 다진마늘", size: "500g", price: 7500 },
  { match: "참기름", name: "오뚜기 고소한 참기름", size: "320ml", price: 11900 },
  { match: "식용유", name: "백설 콩기름", size: "900ml", price: 5400 },
  { match: "된장", name: "해찬들 재래식된장", size: "900g", price: 9800 },
];

/**
 * 재료 이름에 걸리는 광고를 찾는다.
 *
 * "고추장" 이 "간장" 보다 먼저 걸려야 한다 — 둘 다 "장" 으로 끝나지만
 * 낱말 전체로 견주므로 섞이지 않는다. 먼저 걸린 것 하나만 쓴다.
 */
export function sponsoredFor(ingredient: string): SponsoredItem | null {
  return sponsoredItems.find((s) => ingredient.includes(s.match)) ?? null;
}

/** 값을 "12,900원" 처럼 적는다 */
export function wonText(price: number): string {
  // 세 자리마다 쉼표. 한국어 자리표기라 ko-KR 로 못 박는다
  return `${price.toLocaleString("ko-KR")}원`;
}

/* ---------- 요리 (/cook) ---------- */

/** 요리 화면에 적히는 말 */
export const cookCopy = {
  // 스피커 단추의 이름표. 눈에는 안 보이고 읽어 주는 기계와 마우스 설명에만 쓰인다
  readAloud: "이 걸음 소리로 듣기",
  // 마이크 묶음의 제목
  askLabel: "물어보기",
  // 마이크가 꺼져 있을 때. 이 화면은 들어오면 알아서 켜지므로, 이 글이 보인다는 것은
  // 사람이 껐거나 못 켰다는 뜻이다
  askIdle: "마이크가 꺼져 있습니다. 동그란 단추를 누르면 다시 켜집니다",
  // 이어지는 중
  askOpening: "말동무를 부르는 중…",
  // 듣고 있을 때
  askLive: "듣고 있습니다. 편하게 말씀하세요",
  // 마이크 밑에 붙는 힌트. 말로 무엇을 시킬 수 있는지 알려 준다
  askHint:
    "“다음” 이라고 하면 다음 걸음으로 넘어갑니다 · “3분 타이머해줘” 라고 하면 타이머가 걸립니다 · “다시” 는 지금 걸음을 한 번 더 읽어 줍니다",
  // 걸음 묶음의 제목
  nowLabel: "지금 할 일",
  // 타이머 묶음의 제목
  timerLabel: "타이머",
  // 타이머 이름칸에 흐리게 비치는 예시
  timerNamePlaceholder: "예: 면 삶기",
  // 타이머 거는 단추
  timerStart: "타이머 시작",
  // 걸어 둔 타이머가 없을 때
  timerEmpty: "걸어둔 타이머 없음",
  // 다음 걸음을 알려 달라고 하는 단추
  timerNext: "다음 단계 알려줘",
  // 오간 말 묶음의 제목
  saidLabel: "주고받은 말",
  // 아직 아무 말도 안 오갔을 때
  saidEmpty: "아직 주고받은 말 없음",
  // 아래 단추들
  prev: "← 이전",
  next: "다음 →",
  ingredients: "재료",
  allSteps: "전체 순서 보기",
  toShop: "← 장보기로",
  finish: "🎉 요리 끝내기",
} as const;

/** 말동무를 못 불렀을 때 띄우는 말 */
export const liveMessages = {
  key: "API 키가 거절되었습니다. 시작 화면에서 키를 다시 넣어 주세요.",
  /* 웹소켓은 왜 실패했는지 브라우저가 일부러 감춘다. 키가 틀려도 인터넷이 끊겨도
     똑같이 여기로 온다. 그래서 짚어 볼 곳을 둘 다 적어 준다 */
  unreachable:
    "말동무와 이어지지 않았습니다. 키가 라이브 모델을 쓸 수 있는지, 인터넷이 끊기지 않았는지 보아 주세요.",
  closed: "말동무와의 연결이 끊겼습니다. 다시 누르면 이어집니다.",
  denied: "마이크 사용을 막아 두셨습니다. 주소창 왼쪽 자물쇠에서 허용으로 바꿔 주세요.",
  missing: "이 브라우저에서는 마이크를 찾지 못했습니다.",
  failed: "마이크를 켜지 못했습니다. 다른 앱이 쓰고 있는지 보아 주세요.",
} as const;

/** 레시피를 못 받아 왔을 때 띄우는 말 */
export const planMessages = {
  unheard: "무슨 요리인지 못 알아들었습니다. 조금 더 또렷하게 말씀해 주세요.",
  // 유튜브 주소를 살펴보다 걸렸을 때. 다녀오기 전에 여기서 끝난다
  "not-youtube": "유튜브 주소가 아닙니다. youtube.com 또는 youtu.be 로 시작하는 주소를 붙여넣어 주세요.",
  // 냉장고 재료가 너무 적을 때
  "too-few": "재료를 두 가지 이상 적어 주세요. 쉼표로 나눠 적으면 됩니다.",
  key: "API 키가 거절되었습니다. 시작 화면에서 키를 다시 넣어 주세요.",
  shape: "레시피를 만들다가 모양이 어긋났습니다. 한 번 더 해 보세요.",
  "empty-steps": "조리 순서를 못 받았습니다. 한 번 더 해 보세요.",
  "empty-ingredients": "재료 목록을 못 받았습니다. 한 번 더 해 보세요.",
  "too-many": "요청이 너무 잦습니다. 잠시 뒤에 다시 해 보세요.",
  unreachable: "지금 연결이 되지 않습니다. 잠시 뒤에 다시 해 보세요.",
  empty: "만들 요리를 적어 주세요.",
} as const;

/* ---------- 완성 (/cook/done) ---------- */

/** 완성 화면에 적히는 말 */
export const doneCopy = {
  // 큰 제목 뒤에 붙는 말. 앞에는 요리 이름이 온다
  titleTail: "완성 🎉",
  // 제목 밑 한 줄
  lead: "한 장짜리 레시피 그림을 만들어 레시피북 표지로 쓸 수 있습니다",
  // 표지 묶음의 제목
  coverLabel: "레시피 표지",
  // AI 로 표지를 만드는 단추
  coverAi: "AI 표지 만들기",
  // AI 없이 만드는 단추
  coverPlain: "레시피 카드 만들기",
  /* AI 그림은 유료 요금제에서만 된다. 왜 막혔고 대신 무엇이 만들어지는지
     둘 다 적어야 한다 — 막혔다는 말만 하면 사람은 고장으로 여긴다 */
  coverPaidWarn:
    "AI 그림 표지는 유료 요금제에서만 만들 수 있습니다. 지금은 쿡파일럿이 자동으로 만드는 레시피 카드로 저장됩니다 — 요리명·인분·재료·순서가 모두 들어갑니다.",
  coverDone: "레시피 카드를 그림 파일로 내려받았습니다.",
  // 만든 요리를 커뮤니티에 올리는 단추
  toCommunity: "커뮤니티에 글쓰기",
  // 서재 묶음의 제목
  shelfLabel: "레시피북에 꽂기",
  // 그 밑 한 줄
  shelfNote: "표지까지 함께 저장됩니다. 다음부터는 AI 없이 바로 꺼내 쓸 수 있습니다.",
  // 저장 단추
  shelfSave: "레시피북에 저장",
  // 재료 다시 담기 묶음의 제목
  againLabel: "이번에 쓴 재료 다시 담기",
  // 그 밑 한 줄
  againNote: "검색으로 이어집니다. 다 쓴 양념만 골라 담아도 됩니다",
  // 아래 단추 묶음의 제목
  nextLabel: "다음",
  toShelf: "서재 보기",
  newDish: "새 요리 시작",
  backToCook: "← 조리 화면으로 돌아가기",
} as const;

/** 표지에 쓸 수 있는 색조. 도메인의 tone 과 같은 이름을 쓴다 */
export const coverTones = ["ember", "herb", "cocoa", "cream"] as const;

/** 그 색조를 부르는 말 */
/** 표지 색조 하나 */
export type CoverTone = (typeof coverTones)[number];

/** 색조마다 표지에 칠할 두 색. 요리 완성 화면과 글쓰기 화면이 함께 쓴다 */
export const coverColors: Record<CoverTone, [string, string]> = {
  // 잉걸불 — 이 서비스의 기본 색
  ember: ["#C2502F", "#5B1E12"],
  // 허브
  herb: ["#4E7A46", "#1B2C1A"],
  // 카카오
  cocoa: ["#6B4630", "#2A1912"],
  // 크림
  cream: ["#B99B62", "#3B2E19"],
};

export const coverToneLabels: Record<(typeof coverTones)[number], string> = {
  ember: "잉걸불",
  herb: "허브",
  cocoa: "카카오",
  cream: "크림",
};

/** 말투를 부르는 말. 요리 화면 위쪽에 지금 어떤 목소리인지 작게 보여 준다 */
export const toneLabels: Record<VoiceTone, string> = {
  calm: "차분한",
  bright: "밝은",
  soft: "부드러운",
};

/** 아래 카드에 붙는 그림 이름. 화면이 아이콘 이름을 직접 적지 않게 모아 둔다 */
export const cookIcons = {
  timer: "timer" as IconName,
  book: "book" as IconName,
  cart: "scale" as IconName,
};
