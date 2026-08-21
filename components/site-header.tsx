"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand";
import { navLinks, site } from "@/lib/site-content";

/**
 * 화면 맨 윗부분. 넓은 화면에서는 메뉴가 가로로 늘어서고,
 * 좁은 화면에서는 줄 세 개짜리 단추를 눌러 서랍처럼 펼친다.
 * 서랍은 링크를 누르면 알아서 닫히고, Esc 키로도 닫힌다.
 */
export function SiteHeader() {
  /* 좁은 화면 서랍이 열려 있는지 아닌지. 이 값 하나로 단추 모양과 서랍이 같이 움직인다 */
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // 닫혀 있을 때는 키를 들을 이유가 없어서 아무것도 안 한다
    if (!open) return;
    // Esc 로 덮인 화면을 닫는 건 어디서나 똑같은 약속이라 그대로 따른다
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    // 서랍 안이 아니라 화면 어디를 보고 있든 들리도록 창 전체에 귀를 붙인다
    window.addEventListener("keydown", onKey);
    // 서랍이 닫히거나 이 화면을 떠날 때 붙여 둔 귀를 떼어 낸다
    return () => window.removeEventListener("keydown", onKey);
    // 열림·닫힘이 바뀔 때마다 귀를 붙였다 뗐다 한다
  }, [open]);

  return (
    <header>
      {/* 로고·메뉴·오른쪽 단추를 한 줄에 놓는 틀 */}
      <div className="wrap nav">
        {/* 맨 위 띠로 돌아간다. 그림만 있으면 무슨 링크인지 모르니 이름을 붙여 준다 */}
        <a className="brand" href="#top" aria-label={`${site.name} 홈`}>
          {/* 맨 윗부분에 쓰는 색깔 이름 */}
          <Logo size={30} id="nav" />
          <span className="name">{site.name}</span>
        </a>

        {/* 화면이 넓을 때만 보이는 가로 메뉴 */}
        <nav className="nav-links" aria-label="주요 메뉴">
          {/* 전부 같은 페이지 안에서 내려가는 링크라 주소를 이름표로 쓴다 */}
          {navLinks.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>

        {/* 로그인·시작 단추·서랍 단추를 모아 오른쪽에 붙인다 */}
        <div className="nav-right">
          {/* 이미 계정이 있는 사람이 가는 길 */}
          <Link className="login" href="/login">
            로그인
          </Link>
          {/* 맨 윗부분에서는 작은 단추로 둔다. 크게 권하는 자리는 첫 화면과 마지막 구역이다 */}
          <Link className="btn btn-fill btn-sm" href="/login">
            무료로 시작하기
          </Link>
          <button
            className="nav-toggle"
            // 단추는 가만두면 폼을 보내려고 한다. 그런 일이 없게 "그냥 단추" 라고 못 박는다
            type="button"
            // 그림만 있는 단추라 지금 상태에 맞는 이름을 붙여 준다
            aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
            // 열렸는지 닫혔는지를 읽어 주는 기계에도 알려 준다
            aria-expanded={open}
            // 이 단추가 여닫는 게 어느 것인지 이어 준다
            aria-controls="nav-drawer"
            // 지금 값을 뒤집는다. 바로 앞 값을 받아서 뒤집어야 빨리 여러 번 눌러도 안 꼬인다
            onClick={() => setOpen((v) => !v)}
          >
            {/* 서랍 단추의 줄 두 개. 열리면 X 모양으로 겹쳐진다 */}
            <span />
            <span />
          </button>
        </div>
      </div>

      <div
        // 위 단추의 aria-controls 가 가리키는 이름
        id="nav-drawer"
        // 열렸을 때만 open 이 붙어서 미끄러지듯 내려온다
        className={`wrap nav-drawer${open ? " open" : ""}`}
        // 닫혀 있으면 아예 없는 것처럼 만든다. 안 보이는 링크에 탭이 걸리면 안 되기 때문이다
        hidden={!open}
      >
        {/* 메뉴가 두 개라서 읽어 주는 기계가 헷갈리지 않게 이름을 다르게 붙인다 */}
        <nav aria-label="모바일 메뉴">
          {navLinks.map((l) => (
            // 아래로 내려갔는데 서랍이 화면을 덮고 있으면 안 되니, 누를 때 같이 닫는다
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          {/* 로그인도 같은 서랍 안에 두고, 똑같이 누르면 닫는다 */}
          <Link href="/login" onClick={() => setOpen(false)}>
            로그인
          </Link>
        </nav>
        <Link
          // 서랍 안에서는 가로를 꽉 채우는 큰 단추로 둔다
          className="btn btn-fill"
          href="/login"
          // 다른 화면으로 넘어가는 길이니 서랍은 닫아 두고 보낸다
          onClick={() => setOpen(false)}
        >
          무료로 시작하기
        </Link>
      </div>
    </header>
  );
}
