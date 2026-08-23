/**
 * 커뮤니티 화면의 위아래 테두리.
 *
 * 소개 페이지의 머리말을 쓰지 않는 이유는 [[login-chrome]] 과 같다 —
 * 여기서 할 일은 남의 요리를 구경하는 것 하나뿐이라, 기능·요금제 메뉴를
 * 늘어놓으면 시선이 갈라진다. 시안(design/blogmain.png)도 로고와
 * 설정·도움말 단추만 남겨 두었다.
 *
 * 그 두 단추는 한동안 갈 곳이 없어 `href="#"` 로 놓여 있었다. 지금은
 * 계정 설정과 자주 묻는 말로 이어져 있다.
 *
 * 둘 다 움직이지 않아서 서버에서만 그려진다.
 */

import Link from "next/link";
import { Logo } from "@/components/brand";
import { Icon } from "@/components/icons";
import { communityFooterLinks, site } from "@/lib/site-content";

/** 맨 윗줄. 왼쪽에 로고와 이름, 오른쪽에 설정·도움말 */
// [F1][함수] CommunityTop(): 커뮤니티 화면의 맨 윗줄
// 입력: 없음 → 처리: 로고 + 톱니바퀴(/account) + 물음표(/#faq) → 출력: 화면(JSX)
export function CommunityTop() {
  return (
    <header className="cm-top">
      {/* 로고를 누르면 소개 페이지로 돌아간다. 나가는 길을 하나는 남겨 둬야 한다 */}
      <Link className="cm-brand" href="/community" aria-label={`${site.name} 홈`}>
        {/* 이름 글씨 왼쪽에 늘 붙는 로고. 자리 이름을 줘서 색 이름이 다른 로고와 안 겹치게 한다 */}
        <Logo size={26} id="community-top" />
        <span className="cm-brand-name">{site.name}</span>
      </Link>

      {/*
        오른쪽 위 두 단추.

        시안(design/blogmain.png)에 있어서 자리만 잡아 두었던 것들이다.
        둘 다 `href="#"` 이라 눌러도 아무 일이 없었는데, **눌리는데 아무 일도
        안 일어나는 단추는 없느니만 못하다** — 고장으로 여기게 된다.
        이제 갈 곳이 생겼으니 이어 준다.
      */}
      <div className="cm-top-acts">
        {/* 톱니바퀴 = 계정 설정. 닉네임·사진·목소리·API 키가 그 안에 있다 */}
        <Link href="/account" aria-label="계정 설정" title="계정 설정">
          <Icon name="gear" size={20} />
        </Link>

        {/* 물음표 = 자주 묻는 말. 소개 페이지 아래쪽에 이미 있어서 그리로 보낸다 */}
        <Link href="/#faq" aria-label="자주 묻는 말" title="자주 묻는 말">
          <Icon name="help" size={20} />
        </Link>
      </div>
    </header>
  );
}

/** 맨 아랫줄. 로고 글씨와 저작권, 그리고 약관 링크 셋 */
// [F2][함수] CommunityFoot(): 커뮤니티 화면의 맨 아랫줄
// 입력: 없음(site-content 의 communityFooterLinks) → 출력: 화면(JSX)
export function CommunityFoot() {
  return (
    <footer className="cm-foot">
      {/* 위쪽 로고와 같은 글꼴이되 훨씬 작다. 여기서는 눈에 덜 띄어야 한다 */}
      <p className="cm-foot-logo">{site.name}</p>

      {/* 해가 바뀌어도 고칠 일이 없게, 올해가 몇 년인지 그때그때 물어본다 */}
      <p className="cm-foot-copy">
        © {new Date().getFullYear()} {site.name}. 오늘도 맛있게.
      </p>

      {/* 메뉴가 이 화면에 여럿은 아니지만, 읽어 주는 기계가 알아보게 이름을 붙인다 */}
      <nav aria-label="약관 및 도움말">
        {/* 주소가 아직 다 "#" 이라 겹친다. 그래서 겹치지 않는 글자를 이름표로 쓴다 */}
        {communityFooterLinks.map((l) => (
          <a key={l.label} href={l.href}>
            {l.label}
          </a>
        ))}
      </nav>
    </footer>
  );
}
