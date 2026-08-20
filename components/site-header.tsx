"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/brand";
import { navLinks, site } from "@/lib/site-content";

/**
 * 머리말. 넓은 화면은 가로 차림표, 좁은 화면은 햄버거로 여닫는 서랍.
 * 서랍은 링크를 누르면 스스로 닫히고, Esc 로도 닫힌다.
 */
export function SiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header>
      <div className="wrap nav">
        <a className="brand" href="#top" aria-label={`${site.name} 홈`}>
          <Logo size={30} id="nav" />
          <span className="name">{site.name}</span>
        </a>

        <nav className="nav-links" aria-label="주요 메뉴">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="nav-right">
          <a className="login" href="#">
            로그인
          </a>
          <a className="btn btn-fill btn-sm" href="#pricing">
            무료로 시작하기
          </a>
          <button
            className="nav-toggle"
            type="button"
            aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={open}
            aria-controls="nav-drawer"
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>

      <div
        id="nav-drawer"
        className={`wrap nav-drawer${open ? " open" : ""}`}
        hidden={!open}
      >
        <nav aria-label="모바일 메뉴">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <a href="#" onClick={() => setOpen(false)}>
            로그인
          </a>
        </nav>
        <a
          className="btn btn-fill"
          href="#pricing"
          onClick={() => setOpen(false)}
        >
          무료로 시작하기
        </a>
      </div>
    </header>
  );
}
