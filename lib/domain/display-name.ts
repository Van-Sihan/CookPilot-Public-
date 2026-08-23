/**
 * 도메인 · 남에게 보이는 이름(닉네임).
 *
 * 이메일·비밀번호와 한 파일에 두지 않았다. 그 둘은 **들어오기 위한 열쇠**고
 * 이 값은 **들어온 뒤에 남에게 보이는 것**이라 성격이 다르다.
 * 나중에 프로필 화면에서 이름만 고치게 될 텐데, 그때 비밀번호 규칙이 딸려 오면 곤란하다.
 *
 * 여기 적은 길이 규칙은 `supabase/migrations` 의 profiles 표 검사와 같은 값이다.
 * 한쪽만 고치면 화면은 통과시켰는데 데이터베이스가 거절하는 일이 생긴다.
 */

/** 검사를 통과한 이름에만 몰래 붙는 도장. 아무 글자나 이름인 척 끼어들지 못하게 막는다 */
declare const validated: unique symbol;

/** 도장이 찍힌 이름 */
export type DisplayName = string & { readonly [validated]: "display-name" };

/**
 * 가장 짧은 이름.
 *
 * 한 글자를 막는 까닭은 한국어에서 "김", "ㅋ" 같은 이름이 목록에 섞이면
 * 글쓴이 자리가 무슨 글자인지 알아볼 수 없기 때문이다.
 */
export const MIN_DISPLAY_NAME = 2;

/**
 * 가장 긴 이름.
 *
 * 커뮤니티 카드의 글쓴이 자리가 한 줄이라, 이보다 길면 말줄임표로 잘려서
 * 누군지 알 수 없게 된다. 데이터베이스가 아니라 화면이 정한 한계다.
 */
export const MAX_DISPLAY_NAME = 20;

/** 이름을 돌려보내는 까닭. 화면에 그대로 띄우지 않고 문장은 화면이 고른다 */
export type DisplayNameProblem = "name-empty" | "name-short" | "name-long";

/** 검사 결과 */
export type DisplayNameCheck =
  | { ok: true; name: DisplayName }
  | { ok: false; problem: DisplayNameProblem };

/**
 * 적어 넣은 이름을 받아 줄지 살펴본다.
 *
 * 글자 종류는 보지 않는다. 이모지를 쓰든 한자를 쓰든 남에게 보이는 이름일 뿐이고,
 * 막아 봐야 비슷하게 생긴 글자로 피해 갈 수 있어서 규칙만 늘어난다.
 */
// [F1][함수] checkDisplayName(raw): 닉네임을 받아 줄지 판정
// 입력: raw(가입·계정설정 입력칸 글자) → 처리: 공백 제거 후 길이 검사 → 출력: DisplayNameCheck
export function checkDisplayName(raw: string): DisplayNameCheck {
  /* 앞뒤 빈칸을 떼어 낸다. 이걸 안 하면 "  " 두 칸짜리 이름이 두 글자로 통과한다 */
  // [F2][흐름] raw → trim() → name
  const name = raw.trim();

  // 아무것도 안 적었을 때. 짧은 것과는 다른 상황이라 따로 알린다
  // [F3][분기] name.length === 0 → true: 'name-empty' 반환 / false: F4
  if (name.length === 0) return { ok: false, problem: "name-empty" };

  // 한 글자짜리
  // [F4][분기] name.length < MIN_DISPLAY_NAME(2) → true: 'name-short' 반환 / false: F5
  if (name.length < MIN_DISPLAY_NAME) return { ok: false, problem: "name-short" };

  /* 너무 길 때. 여기서 잘라서 통과시키지 않는다 —
     사람이 적은 이름이 말없이 바뀌어 있으면 더 당황스럽다 */
  // [F5][분기] name.length > MAX_DISPLAY_NAME(20) → true: 'name-long' 반환 / false: F6
  if (name.length > MAX_DISPLAY_NAME) return { ok: false, problem: "name-long" };

  // 통과했으니 이제야 도장을 찍어 돌려준다
  // [F6][반환] name → {ok:true, name} → 호출한 유스케이스(sign-up · rename-me)로 전달
  return { ok: true, name: name as DisplayName };
}
