/**
 * 유스케이스 · "로그인하기".
 *
 * 검사는 도메인에 맡기고, 진짜로 들어가는 일은 남에게 맡긴다.
 * 이 파일이 하는 일은 순서를 정하는 것뿐이다.
 *
 * 누가 회원인지 확인하는 일은 서버가 한다. 여기서는 "확인해 주는 곳" 을
 * AuthGateway 라는 약속으로만 적어 두고, 진짜로 다녀오는 일은
 * [[supabase-auth-gateway]] 가 맡는다. 그래서 이 파일에는
 * 수파베이스라는 낱말이 한 번도 나오지 않는다 — 나중에 다른 서비스로 옮겨도
 * 갈아 끼울 파일은 어댑터 하나뿐이다.
 */

import {
  checkCredentials,
  type CredentialProblem,
  type Email,
  type Password,
} from "@/lib/domain/credentials";

/** 로그인을 확인해 주는 곳이 지켜야 할 약속. 진짜 구현은 lib/adapter 에 있다 */
export type AuthGateway = {
  /**
   * 이 사람이 회원이 맞는지 물어본다.
   * 서버에 다녀오는 일이라 시간이 걸린다. 그래서 Promise 로 돌려준다.
   */
  signIn(email: Email, password: Password): Promise<GatewayAnswer>;
};

/** 확인해 주는 곳이 돌려주는 대답 */
export type GatewayAnswer =
  /** 맞다. 들어와도 된다 */
  | { ok: true }
  /** 이메일이나 비밀번호가 틀렸다. 둘 중 어느 쪽인지는 일부러 알려 주지 않는다 */
  | { ok: false; reason: "rejected" }
  /** 회원은 맞는데 가입 확인 메일을 아직 안 눌렀다 */
  | { ok: false; reason: "unconfirmed" }
  /** 서버에 다녀오지 못했다. 인터넷이 끊겼거나 서버가 아직 없거나 */
  | { ok: false; reason: "unreachable" }
  /** 아직 만들어지지 않은 기능이다 */
  | { ok: false; reason: "unavailable" };

/** 로그인 단추를 눌렀을 때 생길 수 있는 일. 화면은 이 답만 보고 다음 모습을 정한다 */
export type SignInResult =
  | { ok: true; email: Email }
  | {
      ok: false;
      reason:
        | CredentialProblem
        | "rejected"
        | "unconfirmed"
        | "unreachable"
        | "unavailable";
    };

/**
 * 사람이 적어 넣은 값을 검사하고, 통과하면 회원이 맞는지 물어본다.
 * 화면은 이 함수 하나만 부르면 되고, 검사 규칙도 확인 방법도 몰라도 된다.
 */
export async function signIn(
  rawEmail: string,
  rawPassword: string,
  gateway: AuthGateway,
): Promise<SignInResult> {
  // 모양 검사는 통째로 도메인에 맡긴다. 여기서 또 따지면 규칙이 두 군데로 갈라져 헷갈린다
  const checked = checkCredentials(rawEmail, rawPassword);

  // 검사에서 걸렸으면 서버에 물어보지도 않고 까닭만 그대로 올려 보낸다.
  // 빈칸을 들고 서버를 다녀오는 것은 시간 낭비다
  if (!checked.ok) return { ok: false, reason: checked.problem };

  try {
    // 여기서 실제로 서버에 다녀온다. 얼마나 걸릴지 모르니 기다린다
    const answer = await gateway.signIn(checked.email, checked.password);

    // 아니라고 하면 그 까닭을 그대로 올려 보낸다
    if (!answer.ok) return { ok: false, reason: answer.reason };

    // 맞다고 했다. 화면은 이제 다음 걸음으로 넘어가도 된다
    return { ok: true, email: checked.email };
  } catch {
    // 인터넷이 끊기면 여기로 온다. 값이 틀린 것과는 다른 실패라 따로 알린다
    return { ok: false, reason: "unreachable" };
  }
}
