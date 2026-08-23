"use client";

/**
 * 회원가입 카드.
 *
 * [[login-form]] 과 일부러 똑같이 생겼다. 두 화면을 오가는 사람이
 * 매번 다시 눈에 익힐 필요가 없어야 하기 때문이다.
 * 다른 점은 셋뿐이다 — 비밀번호를 한 번 더 받고, 부르는 Server Action 이 다르고,
 * 가입이 됐는데 메일함을 봐야 하는 갈래가 하나 더 있다.
 *
 * 여기서도 비밀번호는 리액트 상태에 담기지 않는다.
 * 검사도 계정 만들기도 전부 서버에서 벌어진다.
 */

import { useActionState } from "react";
import Link from "next/link";
import { signUpAction } from "@/app/actions/auth";
import { emptyAuthState } from "@/app/actions/auth-state";
import { AuthField } from "@/components/auth/auth-field";
import { Icon } from "@/components/icons";
import { credentialMessages, signupCopy } from "@/lib/site-content";

// [F1][함수] SignupForm(): 회원가입 폼
// 입력: 닉네임·이메일·비밀번호·확인 → 처리: signUpAction 에 넘김 → 출력: 화면(JSX)
export function SignupForm() {
  // 로그인 폼과 같은 구조. 부르는 Server Action 만 다르다
  // [F2][흐름] useActionState(signUpAction) → state · action · pending
  // 폼 제출 → ▷ signUpAction(app/actions/auth.ts:F8)
  const [state, action, pending] = useActionState(signUpAction, emptyAuthState);

  // 서버가 돌려준 까닭을 사람이 읽을 말로 바꾼다
  // [F3][분기] state.reason 이 있나? [true] 문장으로 바꿔 message / [false] null
  const message = state.reason ? credentialMessages[state.reason] : null;

  /* 가입은 됐는데 메일함의 링크를 눌러야 하는 경우.
     실패가 아니라서 잔소리 자리가 아니라 따로 안내로 보여 준다 */
  // [F4][분기] 서버가 checkMail 을 돌려줬나?
  // [true]  → 폼 대신 '메일함을 봐 주세요' 화면을 그리고 여기서 끝낸다
  // [false] → 아래 폼을 그린다
  if (state.checkMail) {
    return (
      <div className="login-card">
        <h1 className="login-title">{signupCopy.title}</h1>

        {/* 이 문단이 나타나는 순간 읽어 주는 기계가 바로 알려 준다 */}
        <p className="login-notice" role="status">
          {signupCopy.checkMail}
        </p>

        {/* 메일을 확인하고 나면 갈 곳. 여기서 갈 데가 없으면 막다른 화면이 된다 */}
        <p className="login-skip">
          <Link href="/login">로그인 화면으로 →</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="login-card">
      <h1 className="login-title">{signupCopy.title}</h1>

      <p className="login-lead">{signupCopy.lead}</p>

      {/* 검사는 우리가 정한 규칙으로만 한다 */}
      <form action={action} noValidate>
        {/* 맨 위에 둔다. 남에게 보이는 이름이라 이메일·비밀번호와 성격이 다르고,
            "무엇으로 불릴지" 를 먼저 정하는 편이 순서로도 자연스럽다 */}
        <AuthField
          name="name"
          label="닉네임"
          icon="user"
          type="text"
          placeholder={signupCopy.namePlaceholder}
          /* 브라우저가 저장해 둔 별명을 채워 준다. name 이나 username 은
             이메일 자동완성과 엉켜서 nickname 이 맞다 */
          autoComplete="nickname"
          // 비밀번호가 틀렸을 뿐인데 이름까지 다시 짓게 하지 않는다
          defaultValue={state.name}
          invalid={message !== null}
          errorId="signup-error"
        />

        <AuthField
          name="email"
          label="이메일 주소"
          icon="mail"
          type="email"
          placeholder={signupCopy.emailPlaceholder}
          autoComplete="email"
          // 틀렸을 때 이메일까지 다시 치게 하지 않는다
          defaultValue={state.email}
          invalid={message !== null}
          errorId="signup-error"
        />

        <AuthField
          name="password"
          label="비밀번호"
          icon="lock"
          type="password"
          placeholder={signupCopy.passwordPlaceholder}
          // 로그인과 달리 new-password 다. 이래야 브라우저가 새 비밀번호를 지어 준다
          autoComplete="new-password"
          invalid={message !== null}
          errorId="signup-error"
        />

        {/* 가입 폼에만 있는 칸. 오타 하나로 못 들어오는 일을 막는다 */}
        <AuthField
          name="confirm"
          label="비밀번호 다시 입력"
          icon="lock"
          type="password"
          placeholder={signupCopy.confirmPlaceholder}
          autoComplete="new-password"
          invalid={message !== null}
          errorId="signup-error"
        />

        {message && (
          <p className="login-error" id="signup-error" role="alert">
            {message}
          </p>
        )}

        <button className="btn btn-fill login-go" type="submit" disabled={pending}>
          {pending ? "만드는 중…" : signupCopy.submit}
          {!pending && <Icon name="arrow-right" size={18} />}
        </button>
      </form>

      {/* 로그인 카드와 마찬가지로, 계정 없이 쓰는 길도 남겨 둔다 */}
      <p className="login-skip">
        <Link href="/start">가입 없이 바로 시작하기 →</Link>
      </p>
    </div>
  );
}
