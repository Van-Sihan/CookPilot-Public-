import type { Metadata } from "next";
import Link from "next/link";
import { AskShell } from "@/components/ask/ask-shell";
import { Icon } from "@/components/icons";
import {
  CommunityFoot,
  CommunityTop,
} from "@/components/community/community-chrome";
import { askCopy } from "@/lib/ask-content";

/* 로그인 없이도 쓸 수 있는 자리지만, 아직 자료가 예시 글뿐이라 검색에는 안 올린다 */
export const metadata: Metadata = {
  // 위쪽 설정을 타고 "커뮤니티에 물어보기 · 쿡파일럿" 이 된다
  title: askCopy.title,
  description: askCopy.lead,
  robots: { index: false, follow: true },
};

/**
 * /ask — 커뮤니티 글에 물어보는 곳.
 *
 * 이 파일은 서버에서 한 번 그려지고 끝난다. 움직이는 것은 전부 AskShell 안에 있다.
 * 머리말은 바뀔 일이 없어서 여기서 그린다 — 그러면 브라우저가 받을
 * 자바스크립트에 이 부분은 끼지 않는다.
 */
export default function AskPage() {
  return (
    <>
      {/* 탭 키를 쓰는 사람을 곧장 본문으로 데려다준다 */}
      <a className="skip" href="#ask-main">
        본문으로 건너뛰기
      </a>

      <CommunityTop />

      {/* glow 는 뒤에 모닥불 같은 빛을 깔아 주는 이름표다. 커뮤니티와 같은 것을 쓴다 */}
      <main className="ask-page glow" id="ask-main">
        <div className="ask-wrap">
          <header className="ask-head">
            {/* 목록으로 돌아가는 길. 글 화면과 같은 자리에 둔다 */}
            <Link className="pd-back" href="/community">
              ← 커뮤니티로
            </Link>

            {/* 제목 옆 로봇 얼굴. 사람이 아니라 기계가 답한다는 것을 글자보다 먼저 알린다 */}
            <h1 className="ask-title">
              <span className="ask-title-ico" aria-hidden="true">
                <Icon name="bot" size={30} />
              </span>
              {askCopy.title}
            </h1>
            <p className="ask-lead">{askCopy.lead}</p>
          </header>

          <AskShell />
        </div>
      </main>

      <CommunityFoot />
    </>
  );
}
