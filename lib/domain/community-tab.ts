/**
 * 도메인 · 커뮤니티 화면의 탭.
 *
 * 이 파일이 아는 것은 하나다. "우리가 아는 탭이 몇 개이고, 주소에 적힌 글자가
 * 그중 하나인가?"
 *
 * 어느 탭에 어떤 글이 걸리는지도, 탭 이름을 한국어로 뭐라고 쓸지도 모른다.
 * 글은 바깥에서 가져오는 것이고, 이름은 화면이 정하는 것이다.
 *
 * import 문이 한 줄도 없다. [[api-key]] · [[credentials]] 와 같은 자리다.
 */

/**
 * 탭의 속이름.
 *
 * 주소창에 그대로 실리는 값이라 영어로 둔다. `?tab=인기` 처럼 한글을 쓰면
 * 주소가 `%EC%9D%B8%EA%B8%B0` 로 바뀌어 링크를 복사했을 때 알아보기 어렵다.
 * 사람이 읽을 이름은 화면이 따로 붙인다.
 */
export type CommunityTab = "popular" | "recent" | "brand" | "trend";

/**
 * 탭 차례. 화면에 놓이는 순서이기도 하다.
 *
 * 여기 적힌 순서가 곧 왼쪽 목록의 순서다. 순서를 바꾸고 싶으면 이 줄만 고친다.
 */
export const COMMUNITY_TABS = [
  "popular",
  "recent",
  "brand",
  "trend",
] as const satisfies readonly CommunityTab[];

/** 아무것도 안 골랐을 때 서 있는 자리 */
export const DEFAULT_TAB: CommunityTab = "popular";

/**
 * 주소에 적힌 글자를 탭으로 받아 준다. 모르는 글자면 첫 탭으로 돌린다.
 *
 * 왜 이런 게 필요한가. 주소창은 **누구나 아무 글자나 적을 수 있는 자리**다.
 * `?tab=아무거나` 라고 쳐 넣어도 화면이 깨지지 않아야 한다.
 * 걸러 내지 않고 그대로 믿으면 아무 탭도 안 걸려 빈 화면이 나온다.
 *
 * 없는 탭을 404 로 처리하지 않고 조용히 첫 탭으로 돌리는 이유도 있다.
 * 링크를 잘못 복사한 사람에게 오류 화면을 보여 줄 만한 일이 아니다.
 */
// [F1][함수] resolveTab(raw): 주소의 ?tab= 값을 아는 탭으로 정리
// 입력: raw(searchParams.tab) → 처리: 배열이면 마지막 값 → 목록 대조 → 출력: CommunityTab
export function resolveTab(raw: string | string[] | undefined): CommunityTab {
  /* 같은 이름이 두 번 실리면(`?tab=a&tab=b`) 배열로 온다.
     그럴 때는 마지막에 적힌 것을 따른다 — 나중에 누른 쪽이 사람의 뜻이다 */
  // [F2][흐름] raw → (배열이면) at(-1) → value
  const value = Array.isArray(raw) ? raw.at(-1) : raw;

  // 아예 없으면 기본값. 주소에 ?tab= 을 안 붙이고 들어온 보통의 경우다
  // [F3][분기] value 없음 → true: DEFAULT_TAB 반환 / false: F4
  if (!value) return DEFAULT_TAB;

  /* 아는 이름인지 본다. includes 로 확인해도 타입은 아직 넓은 문자열이라
     확인이 끝난 뒤에 좁혀 준다 */
  // [F4][반환] 목록에 있으면 value, 없으면 DEFAULT_TAB → app/community/page.tsx 로 전달
  return COMMUNITY_TABS.includes(value as CommunityTab)
    ? (value as CommunityTab)
    : DEFAULT_TAB;
}

/**
 * 주소에 적힌 검색어를 다듬는다.
 *
 * 탭과 마찬가지로 주소창은 누구나 아무 글자나 적을 수 있는 자리다.
 * 너무 긴 글자를 그대로 받아 견주면 글 하나마다 그 길이만큼 훑게 된다.
 */
// [F5][함수] resolveQuery(raw): 주소의 ?q= 값을 검색어로 다듬는다
// 입력: raw(searchParams.q) → 처리: 마지막 값 → trim → 60자로 자름 → 출력: 검색어 문자열
export function resolveQuery(raw: string | string[] | undefined): string {
  // 같은 이름이 두 번 실리면 배열로 온다. 나중에 적힌 것을 따른다
  // [F6][흐름] raw → (배열이면) at(-1) → value
  const value = Array.isArray(raw) ? raw.at(-1) : raw;

  // 앞뒤 빈칸을 떼고, 지나치게 긴 것은 잘라 낸다
  // [F7][반환] value → trim() → slice(0,60) → app/community/page.tsx 로 전달
  return (value ?? "").trim().slice(0, 60);
}

/**
 * 검색어가 이 글에 걸리는지 본다.
 *
 * 글자 하나하나를 그대로 견주지 않고 **띄어쓰기를 무시**한다.
 * "비빔 국수" 와 "비빔국수" 는 사람에게 같은 말인데, 그대로 견주면 하나는 안 걸린다.
 * 검색이 한 번 헛돌면 사람은 그 뒤로 검색칸을 안 쓴다.
 *
 * 대소문자도 무시한다. 영어 요리 이름을 소문자로 치는 일이 잦다.
 */
// [F8][함수] matchesQuery(fields, query): 이 글이 검색어에 걸리는지 판정
// 입력: fields(제목·글쓴이·태그·설명) + query → 처리: squash 후 포함 검사 → 출력: boolean
export function matchesQuery(fields: readonly string[], query: string): boolean {
  // 빈 검색어는 모두 걸리는 것으로 본다 — 걸러 내지 않는다는 뜻이다
  // [F9][호출] query → squash()(F12) → needle
  const needle = squash(query);
  // [F10][분기] needle 빈값 → true: 모두 통과(true 반환) / false: F11
  if (!needle) return true;

  // 한 칸이라도 걸리면 그 글은 검색 결과다
  // [F11][반복] fields 를 앞에서부터 훑다가 needle 이 든 칸을 만나면 멈춘다
  // [F11][반환] boolean → postsByQuery(site-content) · community/page.tsx 로 전달
  return fields.some((f) => squash(f).includes(needle));
}

/** 견주기 전에 글자를 고르게 만든다. 띄어쓰기를 없애고 소문자로 */
// [F12][함수] squash(text): 견주기 전에 글자를 고르게 만든다
// 입력: text → 처리: 공백 제거 + 소문자화 → 출력: 정규화 문자열 (F9·F11 이 부른다)
function squash(text: string): string {
  return text.replace(/\s+/g, "").toLowerCase();
}
