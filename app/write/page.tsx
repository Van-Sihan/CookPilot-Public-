import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CommunityFoot,
  CommunityTop,
} from "@/components/community/community-chrome";
import { WriteForm } from "@/components/write/write-form";
import { currentUserEmail } from "@/lib/adapter/supabase-auth-gateway";
import { writeCopy } from "@/lib/write-content";

/* 글을 쓰는 자리라 검색에 나올 이유가 없다 */
export const metadata: Metadata = {
  title: writeCopy.title,
  description: writeCopy.lead,
  robots: { index: false, follow: false },
};

/**
 * /write — 커뮤니티에 글 쓰는 곳.
 *
 * `?from=cook` 이 붙어 있으면 방금 만든 요리로 미리 채운다.
 * 그 판단을 서버에서 해서 넘기는 까닭 — 브라우저에서 주소를 다시 읽으면
 * 서버가 그린 화면과 브라우저가 그린 화면이 잠깐 달라진다.
 */
// [F1][함수] WritePage(props): 커뮤니티에 글 쓰는 화면 (/write)
// 입력: props.searchParams(?from=cook) → 처리: 로그인 확인 → WriteForm 에 fromCook 전달
// 출력: 화면(JSX) 또는 redirect
export default async function WritePage(props: PageProps<"/write">) {
  // [F2][흐름] props.searchParams(기다려야 하는 값) → params
  const params = await props.searchParams;

  /* 로그인 안 한 사람은 글을 못 쓴다. 폼을 보여 주고 나서 저장할 때 막으면
     다 적은 글이 날아간다 — 들어올 때 막는 편이 낫다 */
  // [F3][외부] ▷ currentUserEmail(adapter/supabase-auth-gateway:F12) → email
  const email = await currentUserEmail().catch(() => null);
  // [F4][분기] 로그인 안 함 → true: ▷ redirect('/login?next=/write')
  // (폼을 다 적고 나서 막으면 쓴 글이 날아간다. 들어올 때 막는다) / false: F5
  if (!email) redirect("/login?next=/write");

  // [F5][흐름] params.from === 'cook' → fromCook
  // [F5][반환] fromCook → WriteForm 이 draftFromRecipe(domain:F7) 로 칸을 미리 채운다
  const fromCook = params.from === "cook";

  return (
    <>
      <a className="skip" href="#wr-main">
        본문으로 건너뛰기
      </a>

      <CommunityTop />

      <main className="ask-page glow" id="wr-main">
        <div className="ask-wrap">
          <header className="ask-head">
            <Link className="pd-back" href="/community">
              ← 커뮤니티로
            </Link>

            <h1 className="ask-title">
              {fromCook ? writeCopy.titleFromCook : writeCopy.title}
            </h1>
            <p className="ask-lead">
              {fromCook ? writeCopy.leadFromCook : writeCopy.lead}
            </p>
          </header>

          <WriteForm fromCook={fromCook} />
        </div>
      </main>

      <CommunityFoot />
    </>
  );
}
