"use client";

/**
 * 로그인 카드.
 *
 * "use client" 가 붙어 있지만 브라우저가 하는 일은 거의 없다.
 * 이메일도 비밀번호도 여기서 쥐고 있지 않고, 로그인 방법도 여기 안 적혀 있다.
 * 폼을 보내면 [[auth]] 의 Server Action 이 **서버에서** 실행되고,
 * 이 파일은 그 대답을 받아 문구만 갈아 끼운다.
 *
 * 그래서 비밀번호가 리액트 상태에 담기지 않는다. 브라우저 입력칸에만 잠깐 있다가
 * 폼과 함께 서버로 가고 끝난다.
 *
 * 그럼 왜 "use client" 가 필요한가. useActionState 때문이다 —
 * 잘 안 됐을 때 페이지를 통째로 새로 그리지 않고 잔소리만 띄우려면
 * 대답을 받아 둘 곳이 있어야 한다.
 * (node_modules/next/dist/docs/01-app/02-guides/forms.md 의 「Validation errors」)
 */

import { useActionState } from "react";
import Link from "next/link";
import { signInAction } from "@/app/actions/auth";
import { emptyAuthState } from "@/app/actions/auth-state";
import { AuthField } from "@/components/auth/auth-field";
import { Icon } from "@/components/icons";
import { credentialMessages, loginCopy } from "@/lib/site-content";

export function LoginForm() {
  /* state  — 서버가 돌려준 쪽지 (왜 안 됐는지, 방금 적은 이메일)
     action — form 에 물려 두면 눌렀을 때 서버로 간다
     pending— 다녀오는 중인지. 단추를 잠그는 데 쓴다 */
  const [state, action, pending] = useActionState(signInAction, emptyAuthState);

  /* 서버는 까닭만 알려 준다. 무슨 말로 보여 줄지는 화면이 정한다 —
     도메인·유스케이스가 지켜 온 규칙을 여기서도 그대로 지킨다 */
  const message = state.reason ? credentialMessages[state.reason] : null;

  return (
    <div className="login-card">
      {/* 카드 제목. 이 화면에서 가장 큰 제목이다 */}
      <h1 className="login-title">{loginCopy.title}</h1>

      {/* 제목 아래 한 줄 */}
      <p className="login-lead">{loginCopy.lead}</p>

      {/* noValidate 로 브라우저의 제 검사를 끈다. 검사는 우리가 정한 규칙으로만 한다 */}
      <form action={action} noValidate>
        <AuthField
          name="email"
          label="이메일 주소"
          icon="mail"
          type="email"
          placeholder={loginCopy.emailPlaceholder}
          autoComplete="email"
          // 틀렸을 때 이메일까지 다시 치게 하지 않는다
          defaultValue={state.email}
          invalid={message !== null}
          errorId="login-error"
        />

        <AuthField
          name="password"
          label="비밀번호"
          icon="lock"
          type="password"
          placeholder={loginCopy.passwordPlaceholder}
          // 이걸 막으면 사람들이 오히려 외우기 쉬운 비밀번호를 쓰게 된다
          autoComplete="current-password"
          invalid={message !== null}
          errorId="login-error"
        />

        {/* 비밀번호 찾기. 아직 그 화면이 없어 자리만 잡아 둔다 */}
        <p className="login-forgot">
          <a href="#">{loginCopy.forgot}</a>
        </p>

        {/* role="alert" 라 잔소리가 나타나는 순간 읽어 주는 기계가 바로 알려 준다 */}
        {message && (
          <p className="login-error" id="login-error" role="alert">
            {message}
          </p>
        )}

        <button
          className="btn btn-fill login-go"
          type="submit"
          // 다녀오는 중에는 잠근다. 같은 요청을 두 번 보내지 않게 하려는 것이다
          disabled={pending}
        >
          {/* 기다리는 동안 단추 글자가 바뀌어 지금 무슨 일이 벌어지는지 알린다 */}
          {pending ? "확인하는 중…" : loginCopy.submit}

          {/* 기다리는 동안에는 화살표를 감춘다. 아직 넘어가지 않았기 때문이다 */}
          {!pending && <Icon name="arrow-right" size={18} />}
        </button>
      </form>

      {/* 계정을 만들기도 로그인하기도 싫은 사람을 위한 길.
          쿡파일럿은 키만 있으면 계정 없이도 쓸 수 있어서 막아 둘 이유가 없다 */}
      <p className="login-skip">
        <Link href="/start">로그인 없이 바로 시작하기 →</Link>
      </p>
    </div>
  );
}
