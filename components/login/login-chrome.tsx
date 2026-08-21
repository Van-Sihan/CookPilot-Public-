/**
 * 로그인 화면의 위아래 테두리 — 맨 윗줄과 맨 아랫줄.
 *
 * 소개 페이지의 머리말·꼬리말을 그대로 쓰지 않는 이유는 하나다.
 * 로그인 화면에서 할 일은 로그인 하나뿐이라, 메뉴를 늘어놓으면 시선이 갈라진다.
 * 시안(design/login.png)도 로고와 계정 표시만 남겨 두었다.
 *
 * 둘 다 움직이지 않아서 서버에서만 그려진다. 브라우저가 따로 할 일이 없다.
 */

import Link from "next/link";
import { Icon } from "@/components/icons";
import { loginFooterLinks, loginFootNote, site } from "@/lib/site-content";

/** 맨 윗줄. 왼쪽에 로고, 오른쪽에 계정 표시 */
export function LoginTop() {
  return (
    <header className="login-top">
      {/* 로고를 누르면 소개 페이지로 돌아간다. 나가는 길을 하나는 남겨 둬야 한다 */}
      <Link className="login-logo" href="/" aria-label={`${site.name} 홈`}>
        {site.name}
      </Link>

      {/* 시안의 오른쪽 위 동그란 표시. 아직 계정 화면이 없어 자리만 잡아 둔다.
          누를 수 있는 것처럼 보이면 안 되므로 단추가 아니라 그냥 그림으로 둔다 */}
      <span className="login-account" aria-hidden="true">
        <Icon name="user" size={26} />
      </span>
    </header>
  );
}

/** 맨 아랫줄. 로고와 저작권, 그리고 약관 링크 셋 */
export function LoginFoot() {
  return (
    <footer className="login-foot">
      {/* 왼쪽 덩어리 — 로고와 저작권 */}
      <div>
        {/* 위쪽 로고와 같은 글꼴이되 색만 크림색이다. 여기서는 눈에 덜 띄어야 한다 */}
        <p className="login-foot-logo">{site.name}</p>

        {/* 해가 바뀌어도 고칠 일이 없게, 올해가 몇 년인지 그때그때 물어본다 */}
        <p className="login-foot-copy">
          © {new Date().getFullYear()} {site.name}. {loginFootNote}
        </p>
      </div>

      {/* 메뉴가 이 화면에 여럿은 아니지만, 읽어 주는 기계가 알아보게 이름을 붙인다 */}
      <nav aria-label="약관 및 도움말">
        {/* 주소가 아직 다 "#" 이라 겹친다. 그래서 겹치지 않는 글자를 이름표로 쓴다 */}
        {loginFooterLinks.map((l) => (
          <a key={l.label} href={l.href}>
            {l.label}
          </a>
        ))}
      </nav>
    </footer>
  );
}
