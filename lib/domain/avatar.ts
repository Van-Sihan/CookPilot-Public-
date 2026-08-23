/**
 * 도메인 · 프로필 사진 주소.
 *
 * 사진 파일 자체는 여기서 다루지 않는다. 다루는 것은 **주소 한 줄**이고,
 * 그 주소를 그대로 믿어도 되는지만 본다.
 *
 * 왜 따져야 하는가. 프로필 사진 주소는 `<img src>` 로 그대로 나간다.
 * 남이 준 주소를 그냥 붙이면 두 가지가 일어난다 —
 *   · 남의 서버가 우리 사용자의 접속을 하나하나 들여다보게 된다(추적)
 *   · `javascript:` 같은 주소를 넣어 스크립트를 끼워 넣으려 든다
 *
 * 그래서 **우리가 올린 자리에서 온 주소만** 받는다. 판단 규칙이라 도메인에 둔다.
 */

/** 프로필 사진이 놓이는 스토리지 버킷 이름. 주소에 이 조각이 들어 있어야 한다 */
const BUCKET_MARK = "/avatars/";

/**
 * 사진 주소를 받아 줄지 본다. 안 되면 null.
 *
 * null 을 돌려주는 것이 "사진 없음" 과 같은 뜻이 되게 해 두었다.
 * 이상한 주소가 오면 화면이 깨지는 대신 이름 첫 글자로 조용히 돌아간다 —
 * 프로필 사진은 없어도 되는 값이라 여기서 막아 세울 까닭이 없다.
 */
// [F1][함수] readAvatarUrl(raw): 프로필 사진 주소를 그대로 믿어도 되는지 판정
// 입력: raw(표에서 읽은 avatar_url 또는 폼 값) → 처리: https + 버킷 경로 확인 → 출력: 주소 또는 null
export function readAvatarUrl(raw: unknown): string | null {
  // 글자가 아니면 볼 것도 없다
  // [F2][분기] 글자가 아님 → true: null 반환 / false: F3
  if (typeof raw !== "string") return null;

  // [F3][흐름] raw → trim() → url
  const url = raw.trim();

  // [F4][분기] 빈 글자 → true: null 반환(사진 없음과 같은 뜻) / false: F5
  if (url.length === 0) return null;

  /* https 로 시작하고, 우리 버킷 경로가 들어 있어야 한다.
     둘을 함께 보는 까닭 — https 만 보면 남의 서버 주소가 통과하고,
     경로만 보면 "http://나쁜곳/avatars/x.png" 가 통과한다 */
  // [F5][흐름] url → https 시작 여부 + '/avatars/' 포함 여부 → ok
  const ok = url.startsWith("https://") && url.includes(BUCKET_MARK);

  // [F6][반환] ok 면 url, 아니면 null → supabase-post-reader · profile-gateway · changeMyPhoto 로 전달
  return ok ? url : null;
}

/**
 * 사진이 없을 때 동그라미에 넣을 글자.
 *
 * 이름의 첫 글자 하나다. 한글은 한 글자가 이미 뜻을 담고 있어서 이만으로 충분하고,
 * 영문 이름이면 대문자로 세운다 — 소문자 하나는 동그라미 안에서 너무 작아 보인다.
 */
// [F7][함수] avatarLetter(name): 사진이 없을 때 동그라미에 넣을 글자
// 입력: name(닉네임) → 처리: 첫 글자 추출 후 대문자화 → 출력: 한 글자
export function avatarLetter(name: string): string {
  // [F8][흐름] name → trim() → slice(0,1) → first
  const first = name.trim().slice(0, 1);

  // 빈 이름이 올 수 있다. 그때는 물음표 대신 사람 모양에 가까운 글자를 둔다
  // [F9][반환] first 있으면 대문자, 없으면 '?' → home-me · live-talk · photo-form 으로 전달
  return first.length > 0 ? first.toUpperCase() : "?";
}
