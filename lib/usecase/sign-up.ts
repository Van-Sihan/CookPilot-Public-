/**
 * 유스케이스 · "회원가입하기".
 *
 * [[sign-in]] 과 짝을 이루고 생김새도 일부러 똑같이 맞췄다.
 * 검사는 도메인에 맡기고, 계정을 진짜로 만드는 일은 남에게 맡기고,
 * 이 파일은 순서만 정한다.
 *
 * 로그인과 따로 두는 까닭은 오갈 수 있는 대답이 다르기 때문이다.
 * 로그인은 "맞다 / 아니다" 로 끝나지만, 가입은 "이미 있는 주소다",
 * "메일함을 확인해야 한다" 처럼 로그인에는 없는 갈래가 생긴다.
 * 한 함수에 억지로 합치면 부르는 쪽이 쓰지도 않을 갈래를 늘 확인해야 한다.
 */

import {
  checkNewCredentials,
  type Email,
  type NewCredentialProblem,
  type Password,
} from "@/lib/domain/credentials";
/* 닉네임 규칙은 따로 산다. 열쇠(이메일·비밀번호)와 성격이 달라서다 */
import {
  checkDisplayName,
  type DisplayName,
  type DisplayNameProblem,
} from "@/lib/domain/display-name";

/** 계정을 만들어 주는 곳이 지켜야 할 약속. 진짜 구현은 lib/adapter 에 있다 */
export type SignUpGateway = {
  /**
   * 이 이메일로 새 계정을 만들어 달라고 부탁한다.
   * 서버에 다녀오는 일이라 시간이 걸린다. 그래서 Promise 로 돌려준다.
   *
   * 닉네임을 같이 넘기는 까닭 — 계정이 만들어지는 그 순간에 프로필도 함께
   * 만들어져야 한다. 가입은 됐는데 이름이 없는 사람이 생기면, 그 사람이 쓴 글은
   * 글쓴이 자리가 빈 채로 목록에 나온다.
   */
  signUp(
    email: Email,
    password: Password,
    name: DisplayName,
  ): Promise<SignUpAnswer>;
};

/** 계정을 만들어 주는 곳이 돌려주는 대답 */
export type SignUpAnswer =
  /**
   * 만들어졌다. needsConfirm 이 true 면 메일함에 온 링크를 눌러야 들어올 수 있다.
   * 수파베이스의 [Confirm Email] 설정이 켜져 있으면 true 가 온다.
   */
  | { ok: true; needsConfirm: boolean }
  /** 이미 그 이메일로 만들어진 계정이 있다 */
  | { ok: false; reason: "taken" }
  /** 서버 쪽 기준으로도 비밀번호가 너무 허술하다 */
  | { ok: false; reason: "weak" }
  /** 짧은 시간에 너무 여러 번 시도했다. 잠시 뒤에 다시 해야 한다 */
  | { ok: false; reason: "too-many" }
  /** 서버에 다녀오지 못했다 */
  | { ok: false; reason: "unreachable" }
  /** 아직 만들어지지 않은 기능이다 */
  | { ok: false; reason: "unavailable" };

/** 가입 단추를 눌렀을 때 생길 수 있는 일. 화면은 이 답만 보고 다음 모습을 정한다 */
export type SignUpResult =
  | { ok: true; email: Email; needsConfirm: boolean }
  | {
      ok: false;
      reason:
        | NewCredentialProblem
        | DisplayNameProblem
        | "taken"
        | "weak"
        | "too-many"
        | "unreachable"
        | "unavailable";
    };

/**
 * 적어 넣은 값을 검사하고, 통과하면 계정을 만들어 달라고 부탁한다.
 * 화면은 이 함수 하나만 부르면 되고, 검사 규칙도 가입 방법도 몰라도 된다.
 */
export async function signUp(
  rawName: string,
  rawEmail: string,
  rawPassword: string,
  rawConfirm: string,
  gateway: SignUpGateway,
): Promise<SignUpResult> {
  /* 닉네임을 먼저 본다. 폼에서 맨 위에 있는 칸이라, 여러 군데가 틀렸을 때
     위에서부터 알려 주는 편이 고치기 쉽다 */
  const named = checkDisplayName(rawName);

  // 걸렸으면 나머지는 볼 것도 없다
  if (!named.ok) return { ok: false, reason: named.problem };

  // 모양 검사는 통째로 도메인에 맡긴다. 여기서 또 따지면 규칙이 두 군데로 갈라져 헷갈린다
  const checked = checkNewCredentials(rawEmail, rawPassword, rawConfirm);

  // 검사에서 걸렸으면 서버에 물어보지도 않고 까닭만 그대로 올려 보낸다.
  // 특히 가입은 걸릴 일이 잦아서, 미리 걸러야 서버가 헛일을 덜 한다
  if (!checked.ok) return { ok: false, reason: checked.problem };

  try {
    // 여기서 실제로 계정이 만들어진다. 얼마나 걸릴지 모르니 기다린다
    const answer = await gateway.signUp(
      checked.email,
      checked.password,
      named.name,
    );

    // 안 됐다고 하면 그 까닭을 그대로 올려 보낸다
    if (!answer.ok) return { ok: false, reason: answer.reason };

    // 만들어졌다. 메일 확인이 필요한지까지 같이 올려 보낸다 —
    // 그 답에 따라 화면이 "바로 시작" 과 "메일함을 봐 주세요" 로 갈린다
    return {
      ok: true,
      email: checked.email,
      needsConfirm: answer.needsConfirm,
    };
  } catch {
    // 인터넷이 끊기면 여기로 온다. 값이 틀린 것과는 다른 실패라 따로 알린다
    return { ok: false, reason: "unreachable" };
  }
}
