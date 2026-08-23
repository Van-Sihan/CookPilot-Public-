/**
 * 프레임워크 계층 · 인증 폼과 서버가 주고받는 쪽지의 생김새.
 *
 * 이 내용이 [[auth]] 안에 있으면 안 된다. 그 파일은 맨 위에 "use server" 가
 * 붙어 있어서 **async 함수 말고는 아무것도 내보낼 수 없기** 때문이다.
 * 아래 emptyAuthState 는 그냥 객체라 거기 두면 빌드가 이렇게 막는다.
 *
 *   A "use server" file can only export async functions, found object.
 *
 * 왜 그렇게 막아 두었나. "use server" 파일에서 내보낸 것은 전부
 * **바깥에서 부를 수 있는 서버 입구**가 된다. 함수가 아닌 값에는 그 취급을
 * 할 수가 없다. 그래서 값과 타입은 이렇게 평범한 파일로 따로 빼 둔다.
 */

// [F1][데이터] 로그인·가입 폼이 서버와 주고받는 쪽지의 생김새(타입 선언만)
// 실행 흐름 없음. 쓰는 곳: app/actions/auth.ts · components/login·signup/*-form.tsx
// "use server" 파일은 async 함수 말고는 못 내보내서 여기 따로 둔다

import type { SignInResult } from "@/lib/usecase/sign-in";
import type { SignUpResult } from "@/lib/usecase/sign-up";

/** 로그인이 안 될 수 있는 까닭들. 유스케이스가 정한 것을 그대로 따라간다 */
type SignInFailure = Extract<SignInResult, { ok: false }>["reason"];

/** 가입이 안 될 수 있는 까닭들 */
type SignUpFailure = Extract<SignUpResult, { ok: false }>["reason"];

/**
 * 폼과 서버가 주고받는 쪽지.
 *
 * 문장이 아니라 까닭만 담는다. 무슨 말로 보여 줄지는 화면이 정한다 —
 * 도메인·유스케이스가 지켜 온 규칙을 여기서도 그대로 지킨다.
 */
export type AuthFormState = {
  /** 왜 안 됐는지. 잘됐거나 아직 아무것도 안 눌렀으면 null */
  reason: SignInFailure | SignUpFailure | null;

  /**
   * 방금 적었던 이메일.
   *
   * 되돌려주지 않으면 자바스크립트가 꺼진 브라우저에서 화면을 새로 그릴 때
   * 이메일 칸이 비어 버린다. 틀린 건 비밀번호인데 이메일을 다시 치게 하면 짜증난다.
   */
  email: string;

  /**
   * 방금 적었던 닉네임. 이메일과 같은 까닭으로 되돌려준다 —
   * 비밀번호가 틀렸을 뿐인데 이름까지 다시 짓게 하면 짜증난다.
   * 가입 폼에만 있는 칸이라 없을 수도 있다.
   */
  name?: string;

  /** 가입은 됐는데 메일함을 확인해야 하는 경우에만 true */
  checkMail?: boolean;
};

/** 아무것도 누르기 전의 상태. 폼이 처음 그려질 때 쓴다 */
export const emptyAuthState: AuthFormState = { reason: null, email: "" };
