import type { Metadata } from "next";
import Link from "next/link";
import {
  CommunityFoot,
  CommunityTop,
} from "@/components/community/community-chrome";
import { ShelfStand } from "@/components/shelf/shelf-stand";
import { shelfCopy } from "@/lib/shelf-content";

/* 내 브라우저에만 있는 책을 보여 주는 자리라 검색에 나올 이유가 없다 */
export const metadata: Metadata = {
  // 위쪽 설정을 타고 "내 요리 서재 · 쿡파일럿" 이 된다
  title: shelfCopy.title,
  description: shelfCopy.lead,
  robots: { index: false, follow: true },
};

/**
 * /shelf — 만든 요리가 책으로 꽂히는 곳.
 *
 * 이 파일은 서버에서 한 번 그려지고 끝난다. 책은 브라우저에만 있어서
 * 움직이는 것은 전부 ShelfStand 안에 있다.
 */
// [F1][함수] ShelfPage(): 내 서재 화면 (/shelf)
// 입력: 없음 → 처리: 머리말 + ShelfStand 배치 → 출력: 화면(JSX)
// 책은 브라우저에만 있어서 움직이는 것은 전부 ShelfStand 안에 있다
export default function ShelfPage() {
  return (
    <>
      <a className="skip" href="#sf-main">
        본문으로 건너뛰기
      </a>

      <CommunityTop />

      <main className="ask-page glow" id="sf-main">
        <div className="ask-wrap">
          <header className="ask-head">
            {/* 돌아가는 길. 다른 화면과 같은 자리에 둔다 */}
            <Link className="pd-back" href="/community">
              ← 커뮤니티로
            </Link>

            <h1 className="ask-title">{shelfCopy.title}</h1>
            <p className="ask-lead">{shelfCopy.lead}</p>
          </header>

          <ShelfStand />
        </div>
      </main>

      <CommunityFoot />
    </>
  );
}
