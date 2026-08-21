"use client";

/**
 * 로그인 카드. 이 페이지에서 유일하게 브라우저가 직접 움직이는 부분이다.
 *
 * 검사 규칙도 로그인 방법도 여기 하나도 안 적혀 있다.
 * 유스케이스를 한 번 부르고, 그 대답에 따라 화면만 갈아 끼운다.
 * [[api-key-form]] 과 같은 방식이다.
 */

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { pendingAuthGateway } from "@/lib/adapter/pending-auth-gateway";
import { signIn } from "@/lib/usecase/sign-in";
import { credentialMessages, loginCopy } from "@/lib/site-content";

export function LoginForm() {
  /* 이메일 칸에 지금 적혀 있는 글자 */
  const [email, setEmail] = useState("");

  /* 비밀번호 칸에 지금 적혀 있는 글자 */
  const [password, setPassword] = useState("");

  /* 로그인이 안 됐을 때 띄울 말. 할 말이 없으면 null */
  const [message, setMessage] = useState<string | null>(null);

  /* 서버에 다녀오는 중인지. 다녀오는 동안 단추를 잠가 두려고 쓴다 */
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    /* 가만두면 브라우저가 페이지를 통째로 새로 고쳐 버린다. 그걸 막는다 */
    e.preventDefault();

    /* 이미 다녀오는 중이면 또 보내지 않는다. 단추를 두 번 누르는 일이 흔하다 */
    if (pending) return;

    /* 지난번 잔소리를 먼저 치운다. 새 답을 기다리는 동안 옛 문구가 남아 있으면 헷갈린다 */
    setMessage(null);

    /* 단추를 잠근다 */
    setPending(true);

    /* 검사와 로그인 요청은 통째로 유스케이스에 맡긴다.
       지금 넘기는 pendingAuthGateway 는 늘 "아직 없다" 고 답한다.
       서버가 생기면 여기 넘기는 값만 진짜 어댑터로 바꾸면 된다 */
    const result = await signIn(email, password, pendingAuthGateway);

    /* 답이 왔으니 단추를 푼다. 성공이든 실패든 풀어야 다시 누를 수 있다 */
    setPending(false);

    // 안 됐으면 화면은 그대로 두고 까닭만 알려 준다
    if (!result.ok) {
      /* 돌아온 까닭을 사람이 읽을 수 있는 말로 바꿔서 보여 준다 */
      setMessage(credentialMessages[result.reason]);
      return;
    }

    /* 여기는 아직 닿지 않는다. 서버가 없어서 늘 위에서 끝나기 때문이다.
       서버가 생기면 이 자리에서 다음 화면으로 보내면 된다 */
    setPassword("");
  }

  return (
    <div className="login-card">
      {/* 카드 제목. 이 화면에서 가장 큰 제목이다 */}
      <h1 className="login-title">{loginCopy.title}</h1>

      {/* 제목 아래 한 줄 */}
      <p className="login-lead">{loginCopy.lead}</p>

      {/* 브라우저가 제멋대로 검사하지 않게 막는다. 검사는 우리가 정한 규칙으로만 한다 */}
      <form onSubmit={onSubmit} noValidate>
        {/* 이메일 칸 — 왼쪽에 봉투 그림이 앉는다 */}
        <div className="login-field">
          {/* 이름표를 눈에는 안 보이게 숨긴다. 대신 읽어 주는 기계는 읽을 수 있게 남겨 둔다 */}
          <label className="sr-only" htmlFor="login-email">
            이메일 주소
          </label>

          {/* 그림은 뜻을 옆 칸이 전하므로 읽어 주는 기계에는 숨긴다 */}
          <span className="login-field-ico" aria-hidden="true">
            <Icon name="mail" size={19} />
          </span>

          <input
            // 위 이름표의 htmlFor 와 짝을 맞추는 이름
            id="login-email"
            className="login-input"
            // 휴대폰에서 골뱅이가 있는 자판이 바로 뜬다
            type="email"
            // 적힌 글자를 위쪽 값이 쥐고 있어 화면과 실제 값이 어긋날 일이 없다
            value={email}
            // 다시 적기 시작하면 아까 띄운 잔소리는 치워 준다
            onChange={(e) => {
              setEmail(e.target.value);
              setMessage(null);
            }}
            placeholder={loginCopy.emailPlaceholder}
            // 저장해 둔 이메일을 브라우저가 채워 주도록 허락한다. 매번 치는 것은 번거롭다
            autoComplete="email"
            // 이메일에 맞춤법 검사나 첫 글자 대문자 만들기는 방해만 된다
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            // 잘못됐을 때 읽어 주는 기계가 아래 잔소리도 같이 읽도록 이어 준다
            aria-invalid={message !== null}
            aria-describedby={message ? "login-error" : undefined}
          />
        </div>

        {/* 비밀번호 칸 — 왼쪽에 자물쇠 그림이 앉는다 */}
        <div className="login-field">
          <label className="sr-only" htmlFor="login-password">
            비밀번호
          </label>

          <span className="login-field-ico" aria-hidden="true">
            <Icon name="lock" size={19} />
          </span>

          <input
            id="login-password"
            className="login-input"
            // 친 글자가 점으로 가려진다
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setMessage(null);
            }}
            placeholder={loginCopy.passwordPlaceholder}
            // 저장해 둔 비밀번호를 브라우저가 채워 주도록 허락한다.
            // 이걸 막으면 사람들이 오히려 외우기 쉬운 비밀번호를 쓰게 된다
            autoComplete="current-password"
            aria-invalid={message !== null}
            aria-describedby={message ? "login-error" : undefined}
          />
        </div>

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

      {/* 로그인이 아직 안 되니 그냥 들어갈 수 있는 길을 카드 안에 남겨 둔다.
          이게 없으면 이 화면에 온 사람이 갈 데가 없다 */}
      <p className="login-skip">
        <Link href="/start">로그인 없이 바로 시작하기 →</Link>
      </p>
    </div>
  );
}
