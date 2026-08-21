/**
 * 도메인 · 로그인에 쓰는 이메일과 비밀번호.
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
export function checkCredentials(
  rawEmail: string,
  rawPassword: string,
): CredentialsCheck {
  // 복사해서 붙이면 앞뒤에 빈칸이 딸려 오는 일이 많다. 이메일은 떼어 낸다
  const email = rawEmail.trim();

  // 비밀번호는 앞뒤 빈칸도 진짜 글자일 수 있어서 손대지 않는다.
  // 빈칸으로 끝나는 비밀번호를 쓰는 사람이 실제로 있다
  const password = rawPassword;

  // 아무것도 안 적고 눌렀을 때
  if (email.length === 0) return { ok: false, problem: "email-empty" };

  // 골뱅이 자리를 찾는다. 없으면 -1 이 온다
  const at = email.indexOf("@");

  // 골뱅이가 아예 없거나, 맨 앞이거나(앞이 빔), 맨 뒤면(뒤가 빔) 주소가 될 수 없다
  if (at <= 0 || at === email.length - 1) {
    return { ok: false, problem: "email-shape" };
  }

  // 비밀번호는 비었는지만 본다
  if (password.length === 0) return { ok: false, problem: "password-empty" };

  // 여기까지 왔으면 검사를 통과한 것이니 이제야 도장을 찍어 돌려준다
  return {
    ok: true,
    email: email as Email,
    password: password as Password,
  };
}

/**
 * 이메일을 화면에 보여 줄 때 쓰는 가림막. 골뱅이 앞의 가운데를 점으로 덮는다.
 * 로그인한 사람에게 "이 계정이 맞나요?" 하고 보여 줄 때 쓰려고 미리 둔다.
 */
export function maskEmail(email: Email): string {
  // 골뱅이를 기준으로 앞뒤를 가른다
  const at = email.indexOf("@");

  // 골뱅이 앞부분. 여기만 가린다
  const name = email.slice(0, at);

  // 골뱅이부터 끝까지. 어느 메일 서비스인지는 가릴 이유가 없다
  const domain = email.slice(at);

  // 두 글자 이하면 앞 한 글자만 남겨도 거의 다 드러난다. 통째로 덮는다
  if (name.length <= 2) return `${"·".repeat(name.length)}${domain}`;

  // 첫 글자와 끝 글자만 남기고 가운데를 덮는다
  return `${name[0]}${"·".repeat(name.length - 2)}${name.at(-1)}${domain}`;
}
