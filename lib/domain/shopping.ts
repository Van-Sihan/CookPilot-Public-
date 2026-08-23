/**
 * 도메인 · 장보기 규칙.
 *
 * 어느 쇼핑몰로 보낼지, 검색 주소를 어떻게 만드는지, 장바구니에 몇 개가 담겼는지를 안다.
 * 화면이 어떻게 생겼는지는 모른다.
 *
 * 쇼핑몰 검색 주소를 여기 모아 둔 까닭 —
 * 주소 규칙은 저쪽 사정으로 언제든 바뀐다. 화면 여기저기에 흩어 놓으면 바뀌는 날
 * 어디를 고쳐야 하는지 찾아다녀야 한다.
 */

/** 보낼 수 있는 쇼핑몰. 속이름이라 화면에 그대로 나가지 않는다 */
export type ShoppingMall = "coupang" | "kurly" | "naver" | "ssg";

/** 화면에 늘어놓을 차례 */
export const SHOPPING_MALLS = ["coupang", "kurly", "naver", "ssg"] as const;

/** 아무것도 안 고른 사람에게 줄 곳 */
export const DEFAULT_MALL: ShoppingMall = "coupang";

/** 밖에서 들어온 글자를 쇼핑몰로 받아 준다. 모르는 값이면 기본값으로 돌린다 */
export function resolveMall(raw: unknown): ShoppingMall {
  // 목록에 있는 이름일 때만 그대로 쓴다
  return SHOPPING_MALLS.includes(raw as ShoppingMall)
    ? (raw as ShoppingMall)
    : DEFAULT_MALL;
}

/**
 * 쇼핑몰마다 다른 검색 주소.
 *
 * 장바구니에 바로 담는 길은 열어 두지 않는다. 그건 저쪽 로그인과 API 가 있어야 하고,
 * 남의 장바구니에 물건을 넣는 일이라 함부로 할 것이 아니다. 검색 결과까지만 데려다준다.
 */
const searchUrls: Record<ShoppingMall, (q: string) => string> = {
  // 쿠팡은 q 하나로 끝난다
  coupang: (q) => `https://www.coupang.com/np/search?q=${q}`,
  // 마켓컬리는 검색어 이름이 다르다
  kurly: (q) => `https://www.kurly.com/search?sword=${q}`,
  // 네이버 쇼핑
  naver: (q) => `https://search.shopping.naver.com/search/all?query=${q}`,
  // SSG
  ssg: (q) => `https://www.ssg.com/search.ssg?target=all&query=${q}`,
};

/**
 * 재료 이름으로 검색 주소를 만든다.
 *
 * 한글은 주소에 그대로 실을 수 없어서 반드시 encodeURIComponent 를 거쳐야 한다.
 * 이걸 빠뜨리면 "다진 마늘" 처럼 빈칸이 든 이름에서 주소가 끊긴다.
 */
export function searchUrl(mall: ShoppingMall, keyword: string): string {
  // 앞뒤 빈칸을 떼고 주소에 실을 수 있는 모양으로 바꾼다
  return searchUrls[mall](encodeURIComponent(keyword.trim()));
}

/**
 * 여러 재료를 한 번에 열 때 쓸 주소들.
 *
 * 한 창에 다 담아 주는 길이 없어서 재료마다 탭을 하나씩 연다.
 * 그래서 개수를 막아 둔다 — 스무 개를 한꺼번에 열면 브라우저가 멈추고,
 * 팝업 차단에 걸려서 하나도 안 열리기도 한다.
 */
export const MAX_BULK_OPEN = 8;

/** 한 번에 열 주소 목록. 너무 많으면 앞에서부터 잘라 준다 */
export function bulkSearchUrls(
  mall: ShoppingMall,
  keywords: readonly string[],
): readonly string[] {
  // 막아 둔 개수까지만 자르고 각각 주소로 바꾼다
  return keywords.slice(0, MAX_BULK_OPEN).map((k) => searchUrl(mall, k));
}

/**
 * 장보기 목록을 글자로 옮긴다. 메모장이나 메신저에 붙여 넣으라고 쓰는 값이다.
 * 화면 밖으로 나가는 값이라 도메인이 모양을 정한다 — 화면마다 다른 모양이면 곤란하다.
 */
export function shoppingListText(
  items: readonly { name: string; amount: string }[],
): string {
  // 한 줄에 하나씩. 앞에 점을 찍어 두면 메신저에서도 목록으로 보인다
  return items.map((i) => `· ${i.name} ${i.amount}`).join("\n");
}
