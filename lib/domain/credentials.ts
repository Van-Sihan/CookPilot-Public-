/**
 * 도메인 · 로그인과 회원가입에 쓰는 이메일과 비밀번호.
 *
 * 이 파일이 아는 것은 하나다. "받아 줄 만한 이메일과 비밀번호인가?"
 * 그 사람이 진짜 회원인지, 비밀번호가 맞는지는 여기서 알 수 없다.
 * 그건 서버에 물어봐야 아는 일이고 바깥 계층이 한다.
 * 여기서는 서버에 물어볼 가치도 없는 값 — 빈칸, 골뱅이 없는 글자 — 만 걸러 낸다.
 *
 * [[api-key]] 와 같은 자리에 있고 같은 방식으로 쓴다.
 */

/** 검사를 통과한 값에만 몰래 붙는 도장. 아무 글자나 이메일인 척 끼어들지 못하게 막는다 */
declare const validated: unique symbol;

/** 도장이 찍힌 이메일 */
export type Email = string & { readonly [validated]: "email" };

/** 도장이 찍힌 비밀번호 */
export type Password = string & { readonly [validated]: "password" };

/** 값을 왜 돌려보냈는지 알려 주는 쪽지. 화면에 그대로 띄우지 않고 문장은 화면이 고른다 */
export type CredentialProblem =
  | "email-empty"
  | "email-shape"
  | "password-empty";

/** 검사 결과. 잘됐으면 도장 찍힌 값 둘을, 안 됐으면 까닭을 담아 온다 */
export type CredentialsCheck =
  | { ok: true; email: Email; password: Password }
  | { ok: false; problem: CredentialProblem };

/**
 * 사람이 적어 넣은 이메일과 비밀번호를 받아 줄지 살펴본다.
 *
 * 이메일은 "골뱅이가 있고 앞뒤가 비어 있지 않은가" 만 본다.
 * 더 촘촘한 규칙을 세우고 싶은 마음이 들지만 그러면 안 된다 —
 * 실제로 쓰이는 주소 중에는 흔한 규칙에 안 맞는 것이 아주 많고,
 * 그걸 막으면 멀쩡한 사람이 로그인을 못 한다.
 * 주소가 살아 있는지는 메일을 보내 봐야 알 수 있는 일이다.
 *
 * 비밀번호는 길이도 글자 구성도 보지 않는다.
 * 그 규칙은 가입할 때 정해지는 것이고, 로그인은 이미 만들어진 값을 받는 자리다.
 * 여기서 "8글자 이상" 같은 것을 막으면 예전에 짧게 만든 사람이 못 들어온다.
 */
// [F1][함수] checkCredentials(rawEmail, rawPassword): 로그인 값을 받아 줄지 판정
// 입력: rawEmail + rawPassword(로그인 폼) → 처리: 이메일 모양·빈값 검사 → 출력: CredentialsCheck
export function checkCredentials(
  rawEmail: string,
  rawPassword: string,
): CredentialsCheck {
  // 복사해서 붙이면 앞뒤에 빈칸이 딸려 오는 일이 많다. 이메일은 떼어 낸다
  // [F2][흐름] rawEmail → trim() → email / rawPassword → (그대로) → password
  const email = rawEmail.trim();

  // 비밀번호는 앞뒤 빈칸도 진짜 글자일 수 있어서 손대지 않는다.
  // 빈칸으로 끝나는 비밀번호를 쓰는 사람이 실제로 있다
  const password = rawPassword;

  // 아무것도 안 적고 눌렀을 때
  // [F3][분기] email 이 빔 → true: 'email-empty' 반환 / false: F4
  if (email.length === 0) return { ok: false, problem: "email-empty" };

  // 골뱅이 자리를 찾는다. 없으면 -1 이 온다
  // [F4][흐름] email → indexOf('@') → at
  const at = email.indexOf("@");

  // 골뱅이가 아예 없거나, 맨 앞이거나(앞이 빔), 맨 뒤면(뒤가 빔) 주소가 될 수 없다
  // [F5][분기] 골뱅이가 없거나 맨 앞·맨 뒤 → true: 'email-shape' 반환 / false: F6
  if (at <= 0 || at === email.length - 1) {
    return { ok: false, problem: "email-shape" };
  }

  // 비밀번호는 비었는지만 본다
  // [F6][분기] password 가 빔 → true: 'password-empty' 반환 / false: F7
  if (password.length === 0) return { ok: false, problem: "password-empty" };

  // 여기까지 왔으면 검사를 통과한 것이니 이제야 도장을 찍어 돌려준다
  // [F7][반환] {ok:true, email, password} → signIn(sign-in) · checkNewCredentials(F8) 로 전달
  return {
    ok: true,
    email: email as Email,
    password: password as Password,
  };
}

/* ---------- 여기서부터는 회원가입에서만 쓰는 규칙 ---------- */

/**
 * 새로 만드는 비밀번호의 가장 짧은 길이.
 *
 * 수파베이스 쪽 기본값은 6글자다. 여기를 그보다 짧게 잡으면
 * 우리 검사는 통과했는데 수파베이스가 되돌려보내는 일이 생긴다.
 * 그러면 왜 안 되는지 화면에서 설명할 길이 없어진다. 그래서 더 깐깐하게 잡는다.
 */
export const MIN_PASSWORD_LENGTH = 8;

/** 가입할 때만 생기는 까닭까지 더한 쪽지 */
export type NewCredentialProblem =
  | CredentialProblem
  | "password-short"
  | "password-mismatch";

/** 가입 검사 결과. 모양은 위와 같고 까닭의 가짓수만 늘었다 */
export type NewCredentialsCheck =
  | { ok: true; email: Email; password: Password }
  | { ok: false; problem: NewCredentialProblem };

/**
 * 가입하려는 사람이 적어 넣은 값을 살펴본다.
 *
 * 로그인과 규칙이 다른 이유가 있다. 로그인은 **이미 만들어진** 비밀번호를 받는 자리라
 * 길이를 따지면 예전에 짧게 만든 사람이 못 들어온다.
 * 가입은 그 비밀번호가 **여기서 정해지는** 자리라 지금 막지 않으면 막을 데가 없다.
 *
 * 글자 구성(대문자·숫자·특수문자 섞기)은 일부러 안 본다.
 * 그런 규칙은 사람을 `Password1!` 같은 뻔한 값으로 몰아가서
 * 길이를 넉넉히 두는 것보다 오히려 약해진다는 것이 알려져 있다.
 */
// [F8][함수] checkNewCredentials(rawEmail, rawPassword, rawConfirm): 가입 값을 판정
// 입력: 이메일+비밀번호+확인 → 처리: 공통 검사(F1) 후 길이·일치 추가 검사 → 출력: NewCredentialsCheck
export function checkNewCredentials(
  rawEmail: string,
  rawPassword: string,
  rawConfirm: string,
): NewCredentialsCheck {
  // 이메일 모양과 "비밀번호가 비었는가" 는 로그인과 규칙이 똑같다.
  // 여기서 다시 쓰면 규칙이 두 군데로 갈라져 한쪽만 고치는 일이 생긴다
  // [F9][호출] rawEmail, rawPassword → checkCredentials(F1) → base
  const base = checkCredentials(rawEmail, rawPassword);

  // 공통 검사에서 걸렸으면 가입만의 규칙은 볼 것도 없다
  // [F10][분기] base.ok → false: base(까닭)를 그대로 반환 / true: F11
  if (!base.ok) return base;

  // 여기서만 보는 규칙 하나 — 너무 짧은가
  // [F11][분기] 8자 미만 → true: 'password-short' 반환 / false: F12
  if (base.password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, problem: "password-short" };
  }

  // 확인 칸도 앞뒤 빈칸을 손대지 않는다. 위 칸과 똑같이 다뤄야 비교가 맞는다
  // [F12][분기] 확인 칸과 다름 → true: 'password-mismatch' 반환 / false: F13
  if (base.password !== rawConfirm) {
    return { ok: false, problem: "password-mismatch" };
  }

  // 다 통과했다. 도장이 찍힌 값을 그대로 넘긴다
  // [F13][반환] base → signUp(sign-up) 으로 전달
  return base;
}

/**
 * 이메일을 화면에 보여 줄 때 쓰는 가림막. 골뱅이 앞의 가운데를 점으로 덮는다.
 * 로그인한 사람에게 "이 계정이 맞나요?" 하고 보여 줄 때 쓰려고 미리 둔다.
 */
// [F14][함수] maskEmail(email): 이메일 가운데를 점으로 덮는다
// 입력: email → 처리: 골뱅이 앞부분만 가림 → 출력: 가려진 문자열
export function maskEmail(email: Email): string {
  // 골뱅이를 기준으로 앞뒤를 가른다
  // [F15][흐름] email → indexOf('@') → at → slice 로 name / domain 으로 가름
  const at = email.indexOf("@");

  // 골뱅이 앞부분. 여기만 가린다
  const name = email.slice(0, at);

  // 골뱅이부터 끝까지. 어느 메일 서비스인지는 가릴 이유가 없다
  const domain = email.slice(at);

  // 두 글자 이하면 앞 한 글자만 남겨도 거의 다 드러난다. 통째로 덮는다
  // [F16][분기] name 이 두 글자 이하 → true: 통째로 덮어 반환 / false: F17
  if (name.length <= 2) return `${"·".repeat(name.length)}${domain}`;

  // 첫 글자와 끝 글자만 남기고 가운데를 덮는다
  // [F17][반환] 첫 글자 + 점 + 끝 글자 + domain → 화면으로 전달
  return `${name[0]}${"·".repeat(name.length - 2)}${name.at(-1)}${domain}`;
}
